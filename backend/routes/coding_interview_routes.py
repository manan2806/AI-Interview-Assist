import os, json, time, uuid, requests, base64, random
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from dotenv import load_dotenv
from google import genai

from database import coding_interviews

load_dotenv()

coding_bp = Blueprint("coding_bp", __name__)

# ==========================================
# GEMINI CLIENT
# ==========================================
gemini_api_key = os.getenv("GEMINI_API_KEY")

if gemini_api_key:
    gemini_client = genai.Client(api_key=gemini_api_key)
else:
    gemini_client = None

# ==========================================
# JUDGE0 CONFIGURATION
# ==========================================
JUDGE0_API_URL = os.getenv("JUDGE0_API_URL", "https://ce.judge0.com").rstrip("/")
JUDGE0_API_KEY = os.getenv("JUDGE0_API_KEY")

# ==========================================
# CONSTANTS
# ==========================================
SUPPORTED_LANGUAGES = {"python": 71, "java": 62, "cpp": 54, "javascript": 63}
VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"]


# ==========================================
# HELPER FUNCTIONS
# ==========================================
def get_current_utc():
    return datetime.now(timezone.utc)


def generate_coding_interview_id():
    return "COD-" + str(random.randint(100000, 999999))


def validate_coding_interview_id(interview_id):
    return isinstance(interview_id, str) and interview_id.startswith("COD-")


# ==========================================
# BASE64 HELPER FUNCTIONS
# ==========================================
def encode_base64(value):
    return base64.b64encode(value.encode("utf-8")).decode("utf-8")


def decode_base64(value):
    if not value:
        return ""

    try:
        return base64.b64decode(value).decode("utf-8", errors="replace")
    except Exception:
        return value


# ==========================================
# JUDGE0 CODE EXECUTION
# ==========================================
def execute_code_with_judge0(code, language, stdin=""):
    language_id = SUPPORTED_LANGUAGES.get(language.lower())

    if not language_id:
        raise ValueError("Unsupported programming language.")

    headers = {"Content-Type": "application/json"}

    payload = {
        "source_code": encode_base64(code),
        "language_id": language_id,
        "stdin": encode_base64(stdin),
        "cpu_time_limit": 2,
        "wall_time_limit": 5,
        "memory_limit": 128000,
    }

    # CREATE SUBMISSION
    response = requests.post(
        f"{JUDGE0_API_URL}/submissions",
        params={"base64_encoded": "true"},
        json=payload,
        headers=headers,
        timeout=15,
    )

    response.raise_for_status()
    token = response.json().get("token")

    if not token:
        raise RuntimeError("Judge0 submission token missing.")

    # CHECK SUBMISSION RESULT
    for _ in range(20):
        result_response = requests.get(
            f"{JUDGE0_API_URL}/submissions/{token}",
            params={
                "base64_encoded": "true",
                "fields": "stdout,stderr,compile_output,message,status,time,memory",
            },
            headers=headers,
            timeout=10,
        )

        result_response.raise_for_status()
        result = result_response.json()
        status_id = result.get("status", {}).get("id")

        if status_id not in (1, 2):
            break

        time.sleep(0.5)
    else:
        raise TimeoutError("Code execution timed out.")

    return {
        "status": result.get("status", {}).get("description", "Unknown"),
        "stdout": decode_base64(result.get("stdout")),
        "stderr": decode_base64(result.get("stderr")),
        "compile_output": decode_base64(result.get("compile_output")),
        "message": decode_base64(result.get("message")),
        "execution_time": result.get("time"),
        "memory": result.get("memory"),
    }


# ==========================================
# TEST CASE OUTPUT NORMALIZATION
# ==========================================
def normalize_output(output):
    """
    Ignore trailing spaces and line-ending differences,
    but preserve meaningful spaces inside output lines.
    """
    if not isinstance(output, str):
        output = str(output or "")

    output = output.replace("\r\n", "\n").replace("\r", "\n")

    lines = [line.rstrip() for line in output.split("\n")]

    return "\n".join(lines).strip()


# ==========================================
# SUBMIT CODE API
# ==========================================
@coding_bp.route("/submit-code", methods=["POST"])
@jwt_required()
def submit_coding_code():
    try:
        if coding_interviews is None:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Coding interview database is unavailable.",
                    }
                ),
                503,
            )

        data = request.get_json(silent=True) or {}

        code = data.get("code", "")
        language = data.get("language", "")
        interview_id = data.get("interview_id", "")

        # VALIDATE REQUEST DATA
        if not isinstance(code, str) or not code.strip():
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Please enter your code before submitting.",
                    }
                ),
                400,
            )

        if len(code) > 20000:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Code size exceeds the allowed limit.",
                    }
                ),
                400,
            )

        if not isinstance(language, str):
            return (
                jsonify({"success": False, "message": "Invalid programming language."}),
                400,
            )

        language = language.strip().lower()

        if language not in SUPPORTED_LANGUAGES:
            return (
                jsonify(
                    {"success": False, "message": "Unsupported programming language."}
                ),
                400,
            )

        if not validate_coding_interview_id(interview_id):
            return (
                jsonify({"success": False, "message": "Invalid coding interview ID."}),
                400,
            )

        # FIND USER'S CODING INTERVIEW
        user_id = get_jwt_identity()

        interview = coding_interviews.find_one(
            {"coding_interview_id": interview_id, "user_id": user_id}
        )

        if not interview:
            return (
                jsonify({"success": False, "message": "Coding interview not found."}),
                404,
            )

        # VALIDATE INTERVIEW LANGUAGE
        if interview.get("language") != language:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Selected language does not match this interview.",
                    }
                ),
                400,
            )

        question = interview.get("question", {})
        test_cases = question.get("test_cases", [])

        if not isinstance(test_cases, list) or not test_cases:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "No test cases are available for this question.",
                    }
                ),
                400,
            )

        # Prevent excessive Judge0 executions.
        if len(test_cases) > 20:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Too many test cases in this interview.",
                    }
                ),
                400,
            )

        # EXECUTE ALL TEST CASES
        test_results = []
        passed_count = 0
        failed_count = 0

        for index, test_case in enumerate(test_cases):

            if not isinstance(test_case, dict):
                raise ValueError("Invalid test case data.")

            test_input = test_case.get("input", "")
            expected_output = test_case.get("expected_output", "")
            is_hidden = test_case.get("is_hidden", False)

            if not isinstance(test_input, str):
                raise ValueError("Invalid test case input.")

            if not isinstance(expected_output, str):
                raise ValueError("Invalid expected output.")

            if not isinstance(is_hidden, bool):
                raise ValueError("Invalid hidden test case flag.")

            # Execute code with this test case's input.
            execution = execute_code_with_judge0(
                code=code, language=language, stdin=test_input
            )

            actual_output = execution.get("stdout", "")
            execution_status = execution.get("status", "Unknown")

            # Check execution status and output.
            output_matches = execution_status == "Accepted" and normalize_output(
                actual_output
            ) == normalize_output(expected_output)

            if output_matches:
                passed_count += 1
                case_status = "Passed"
            else:
                failed_count += 1

                if execution_status != "Accepted":
                    case_status = execution_status
                else:
                    case_status = "Failed"

            # PUBLIC TEST CASE RESULT
            if is_hidden:
                # Never expose hidden input/output.
                test_results.append(
                    {"test_case": index + 1, "is_hidden": True, "status": case_status}
                )
            else:
                test_results.append(
                    {
                        "test_case": index + 1,
                        "is_hidden": False,
                        "status": case_status,
                        "input": test_input,
                        "expected_output": expected_output,
                        "actual_output": actual_output,
                        "execution_status": execution_status,
                        "stderr": execution.get("stderr", ""),
                        "compile_output": execution.get("compile_output", ""),
                    }
                )

        # CALCULATE FINAL SCORE
        total_count = len(test_cases)

        score = round((passed_count / total_count) * 100, 2)

        final_status = (
            "Accepted"
            if passed_count == total_count
            else "Partially Accepted" if passed_count > 0 else "Failed"
        )

        current_time = get_current_utc()

        # SAVE SUBMISSION IN MONGODB
        submission_document = {
            "status": final_status,
            "score": score,
            "passed_test_cases": passed_count,
            "failed_test_cases": failed_count,
            "total_test_cases": total_count,
            "submitted_code": code,
            "language": language,
            "test_results": test_results,
            "submitted_at": current_time,
        }

        coding_interviews.update_one(
            {"coding_interview_id": interview_id, "user_id": user_id},
            {
                "$set": {
                    "status": "completed",
                    "score": score,
                    "submission": submission_document,
                    "updated_at": current_time,
                }
            },
        )

        # SEND EVALUATION RESULT
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Code submitted and evaluated successfully.",
                    "result": {
                        "interview_id": interview_id,
                        "status": final_status,
                        "score": score,
                        "passed_test_cases": passed_count,
                        "failed_test_cases": failed_count,
                        "total_test_cases": total_count,
                        "test_results": test_results,
                    },
                }
            ),
            200,
        )

    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400

    except TimeoutError as e:
        return jsonify({"success": False, "message": str(e)}), 504

    except requests.RequestException:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Judge0 service is currently unavailable.",
                }
            ),
            502,
        )

    except Exception as e:
        print("SUBMIT CODING CODE ERROR:", str(e))

        return (
            jsonify(
                {
                    "success": False,
                    "message": "Something went wrong while submitting your code.",
                }
            ),
            500,
        )


# ==========================================
# RUN CODE API
# ==========================================
@coding_bp.route("/run-code", methods=["POST"])
@jwt_required()
def run_coding_code():
    try:
        data = request.get_json(silent=True) or {}

        code = data.get("code", "")
        language = data.get("language", "python")
        stdin = data.get("stdin", "")

        if not isinstance(code, str) or not code.strip():
            return (
                jsonify({"success": False, "message": "Please enter your code."}),
                400,
            )

        if len(code) > 20000:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Code size exceeds the allowed limit.",
                    }
                ),
                400,
            )

        if not isinstance(stdin, str) or len(stdin) > 10000:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid input or input size too large.",
                    }
                ),
                400,
            )

        if not isinstance(language, str):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid programming language.",
                    }
                ),
                400,
            )

        language = language.lower().strip()

        if language not in SUPPORTED_LANGUAGES:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Unsupported programming language.",
                    }
                ),
                400,
            )

        result = execute_code_with_judge0(code=code, language=language, stdin=stdin)

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Code executed successfully.",
                    "result": result,
                }
            ),
            200,
        )

    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400

    except TimeoutError as e:
        return jsonify({"success": False, "message": str(e)}), 504

    except requests.RequestException:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Judge0 service is currently unavailable.",
                }
            ),
            502,
        )

    except Exception:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Something went wrong while executing code.",
                }
            ),
            500,
        )


# ==========================================
# GEMINI CODING QUESTION GENERATION
# ==========================================
CODING_GEMINI_MODEL = os.getenv("GEMINI_CODING_MODEL", "gemini-3.6-flash")


def generate_ai_coding_question(
    field, target_role, experience_level, difficulty, language
):

    difficulty_topics = {
        "Easy": """
        Reference topics:
        - Reverse a string without slicing
        - Prime number checking
        - Palindrome checking
        - Factorial
        - Largest number in a list
        - Sum and frequency of elements
        - Basic loops and conditions
        """,
        "Medium": """
        Reference topics:
        - Second largest number in a list
        - Character frequency
        - Anagram checking
        - Missing number in an array
        - Flatten a nested list
        - Hash maps and dictionaries
        - Recursion and searching
        """,
        "Hard": """
        Reference topics:
        - LRU Cache implementation
        - Custom decorators
        - Longest substring without repeating characters
        - Binary Search implementation
        - Longest palindromic substring
        - Advanced data structures
        - Algorithm optimization
        """,
    }

    topics = difficulty_topics.get(difficulty)

    if not topics:
        raise ValueError("Invalid difficulty level.")

    prompt = f"""
You are an expert technical coding interviewer.

Generate EXACTLY ONE original coding interview problem.

CANDIDATE DETAILS:

Technical Field: {field}
Target Role: {target_role}
Experience Level: {experience_level}
Difficulty: {difficulty}
Programming Language: {language}

REFERENCE TOPICS FOR {difficulty.upper()} LEVEL:

{topics}

QUESTION GENERATION RULES:

1. Generate a practical programming interview problem.
2. Use the reference topics as inspiration.
3. Do not simply copy a reference question.
4. Generate an original variation of a programming problem.
5. Match the selected technical field and target role.
6. Match the selected experience level.
7. Respect the selected difficulty.
8. Avoid unnecessarily advanced concepts for Fresher candidates.
9. Generate exactly ONE question.

DIFFICULTY GUIDELINES:

EASY:
Basic programming, loops, conditions, strings,
numbers, lists and simple problem solving.

MEDIUM:
Arrays, strings, dictionaries, hash maps,
recursion, searching, sorting and nested structures.

HARD:
Advanced algorithms, data structures,
optimization, caching, decorators and complex
problem solving.

INPUT/OUTPUT RULES:

1. Every question MUST use standard input (stdin)
   and standard output (stdout).
2. Define an exact Input Format.
3. Define an exact Output Format.
4. Include sample input and expected sample output.
5. Every test case input must follow the same format.
6. Every expected_output must be the exact stdout result.
7. Do not use Python function arguments as test input.
8. Do not mix function-based and stdin-based formats.
9. Generate starter code for the selected language.
10. Starter code must be executable and must not
    contain the complete solution.

EXAMPLES:

Generate 1 or 2 sample examples.

TEST CASE RULES:

1. Generate at least 5 test cases.
2. Generate between 5 and 10 test cases.
3. At least 2 test cases must be hidden.
4. Include normal, boundary and edge cases.
5. Include empty input where applicable.
6. All inputs must follow the declared Input Format.
7. All expected outputs must be correct.
8. Do not reveal hidden test case input/output
   in the public question.

Return ONLY valid JSON using this exact structure:

{{
    "title": "Question title",
    "description": "Complete problem description",
    "input_format": "Input format description",
    "output_format": "Output format description",
    "examples": [
        {{
            "input": "Sample input",
            "output": "Expected output",
            "explanation": "Explanation"
        }}
    ],
    "constraints": [
        "Constraint 1",
        "Constraint 2"
    ],
    "starter_code": "Executable starter code",
    "test_cases": [
        {{
            "input": "Standard input",
            "expected_output": "Expected output",
            "is_hidden": false
        }},
        {{
            "input": "Standard input",
            "expected_output": "Expected output",
            "is_hidden": true
        }}
    ]
}}

Return valid JSON only.
"""

    response = gemini_client.models.generate_content(
        model=CODING_GEMINI_MODEL,
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response.")

    question = json.loads(response.text)

    if not isinstance(question, dict):
        raise ValueError("Invalid generated question format.")

    required_fields = [
        "title",
        "description",
        "input_format",
        "output_format",
        "examples",
        "constraints",
        "starter_code",
        "test_cases",
    ]

    for key in required_fields:
        if key not in question:
            raise ValueError(f"Generated question is missing: {key}")

    for key in [
        "title",
        "description",
        "input_format",
        "output_format",
        "starter_code",
    ]:
        if not isinstance(question[key], str) or not question[key].strip():
            raise ValueError(f"Invalid generated {key}.")

    if not isinstance(question["examples"], list):
        raise ValueError("Invalid question examples.")

    if not isinstance(question["constraints"], list):
        raise ValueError("Invalid question constraints.")

    if not isinstance(question["test_cases"], list):
        raise ValueError("Invalid test cases.")

    if len(question["test_cases"]) < 5 or len(question["test_cases"]) > 10:
        raise ValueError("Question must contain between 5 and 10 test cases.")

    if not question["examples"]:
        raise ValueError("At least one sample example is required.")

    for example in question["examples"]:
        if not isinstance(example, dict):
            raise ValueError("Invalid example format.")

        for key in ["input", "output", "explanation"]:
            if not isinstance(example.get(key), str):
                raise ValueError(f"Invalid example {key}.")

    for constraint in question["constraints"]:
        if not isinstance(constraint, str):
            raise ValueError("Invalid constraint format.")

    for test_case in question["test_cases"]:
        if not isinstance(test_case, dict):
            raise ValueError("Invalid test case format.")

        if not isinstance(test_case.get("input"), str):
            raise ValueError("Invalid test case input.")

        if not isinstance(test_case.get("expected_output"), str):
            raise ValueError("Invalid expected output.")

        if not isinstance(test_case.get("is_hidden"), bool):
            raise ValueError("Invalid hidden test case flag.")

    hidden_count = sum(1 for tc in question["test_cases"] if tc["is_hidden"])

    if hidden_count < 2:
        raise ValueError("At least 2 hidden test cases are required.")

    return question


# ==========================================
# GENERATE CODING INTERVIEW QUESTION API
# ==========================================
@coding_bp.route("/generate-question", methods=["POST"])
@jwt_required()
def generate_coding_question():
    try:
        if gemini_client is None:
            return (
                jsonify({"success": False, "message": "Gemini API is not configured."}),
                503,
            )

        if coding_interviews is None:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Coding interview database is unavailable.",
                    }
                ),
                503,
            )

        data = request.get_json(silent=True) or {}

        # GET INTERVIEW DETAILS
        field = data.get("field", "")
        target_role = data.get("target_role", "")
        experience_level = data.get("experience_level", "")
        difficulty = data.get("difficulty", "Easy")
        language = data.get("language", "python")
        duration = data.get("duration", "No Limit")

        # VALIDATE STRING FIELDS
        required_fields = {
            "field": field,
            "target_role": target_role,
            "experience_level": experience_level,
            "difficulty": difficulty,
            "language": language,
            "duration": duration,
        }

        for key, value in required_fields.items():
            if not isinstance(value, str) or not value.strip():
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": f"Please provide a valid {key.replace('_', ' ')}.",
                        }
                    ),
                    400,
                )

        field = field.strip()
        target_role = target_role.strip()
        experience_level = experience_level.strip()
        difficulty = difficulty.strip().capitalize()
        language = language.strip().lower()
        duration = duration.strip()

        if len(field) > 100 or len(target_role) > 100:
            return (
                jsonify(
                    {"success": False, "message": "Field or target role is too long."}
                ),
                400,
            )

        if len(experience_level) > 50 or len(duration) > 30:
            return (
                jsonify(
                    {"success": False, "message": "Invalid interview configuration."}
                ),
                400,
            )

        # VALIDATE DIFFICULTY
        if difficulty not in VALID_DIFFICULTIES:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Difficulty must be Easy, Medium or Hard.",
                    }
                ),
                400,
            )

        # VALIDATE LANGUAGE
        if language not in SUPPORTED_LANGUAGES:
            return (
                jsonify(
                    {"success": False, "message": "Unsupported programming language."}
                ),
                400,
            )

        user_id = get_jwt_identity()

        # GENERATE QUESTION USING GEMINI
        question = generate_ai_coding_question(
            field=field,
            target_role=target_role,
            experience_level=experience_level,
            difficulty=difficulty,
            language=language,
        )

        current_time = get_current_utc()
        coding_interview_id = generate_coding_interview_id()

        # SAVE INTERVIEW IN MONGODB
        interview_document = {
            "coding_interview_id": coding_interview_id,
            "user_id": user_id,
            "field": field,
            "target_role": target_role,
            "experience_level": experience_level,
            "difficulty": difficulty,
            "language": language,
            "duration": duration,
            "question": question,
            "status": "in_progress",
            "score": None,
            "created_at": current_time,
            "updated_at": current_time,
        }

        coding_interviews.insert_one(interview_document)

        # HIDE TEST CASES FROM FRONTEND
        public_question = {
            "title": question["title"],
            "description": question["description"],
            "input_format": question["input_format"],
            "output_format": question["output_format"],
            "examples": question["examples"],
            "constraints": question["constraints"],
            "starter_code": question["starter_code"],
        }

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Coding question generated successfully.",
                    "interview_id": coding_interview_id,
                    "field": field,
                    "target_role": target_role,
                    "experience_level": experience_level,
                    "difficulty": difficulty,
                    "language": language,
                    "duration": duration,
                    "question": public_question,
                }
            ),
            201,
        )

    except json.JSONDecodeError:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Gemini returned an invalid JSON response.",
                }
            ),
            502,
        )

    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 502

    except Exception as e:
        print("CODING QUESTION GENERATION ERROR:", str(e))
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Unable to generate coding question right now.",
                }
            ),
            500,
        )
