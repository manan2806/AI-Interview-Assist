from flask import Blueprint, request, jsonify , send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from google import genai
from bson import ObjectId
from dotenv import load_dotenv

import os ,json , time

from database import interviews , users
from utils.pdf_generator import generate_interview_pdf
from utils.email_service import send_interview_report_email

# LOAD ENVIRONMENT VARIABLES
load_dotenv()

interview_bp = Blueprint("interview_bp", __name__)

# ==========================================
# GEMINI CLIENT
# ==========================================
gemini_api_key = os.getenv("GEMINI_API_KEY")

if gemini_api_key:
    gemini_client = genai.Client(api_key=gemini_api_key)
else:
    gemini_client = None

# ==========================================
# HELPER - CONVERT MONGO ID
# ==========================================
def get_interview_object_id(interview_id):
    try:
        return ObjectId(interview_id)
    except Exception:
        return None

# ==========================================
# HELPER - GEMINI EVALUATION FOR ALL ANSWERS
# ==========================================
def evaluate_all_answers_with_gemini(
    job_role,
    experience_level,
    difficulty,
    questions,
    answers
):
    """
    Evaluate ALL interview answers in ONE Gemini request.

    questions = list of generated interview questions
    answers   = list of candidate answers

    Returns:
        list of evaluation dictionaries
    """

    if gemini_client is None:
        raise Exception(
            "Gemini client is not available."
        )

    # ==========================================
    # PREPARE QUESTIONS + ANSWERS
    # ==========================================

    interview_text = ""

    for index, question in enumerate(questions):

        question_number = question.get(
            "question_number",
            index + 1
        )

        question_text = question.get(
            "question",
            ""
        )

        # Find matching answer
        candidate_answer = ""

        for answer_data in answers:

            if (
                answer_data.get(
                    "question_number"
                )
                == question_number
            ):

                candidate_answer = answer_data.get(
                    "answer",
                    ""
                )

                break

        interview_text += f"""
Question {question_number}:
{question_text}

Candidate Answer {question_number}:
{candidate_answer}

--------------------------------
"""

    # ==========================================
    # GEMINI PROMPT
    # ==========================================

    prompt = f"""
You are an expert technical interviewer.

Evaluate ALL candidate answers from the
complete interview.

Candidate Information:

Job Role:
{job_role}

Experience Level:
{experience_level}

Difficulty:
{difficulty}

Interview Questions and Candidate Answers:

{interview_text}

Evaluation Requirements:

1. Evaluate EVERY question and answer.

2. Evaluate each answer independently based
   on its corresponding question.

3. Check whether the answer is technically
   correct.

4. Check whether the answer directly
   addresses the question.

5. Consider the candidate's experience level.

6. Identify important missing concepts.

7. Do not give credit for concepts that
   were not actually explained.

8. If an answer belongs to a different
   question, mark it as irrelevant or
   incorrect.

9. Be fair to a fresher-level candidate.

10. Give each answer a score from 0 to 10.

11. Return exactly ONE evaluation object
    for EVERY question.

12. Keep the question_number exactly matched
    with the original question.

13. Do not skip any question.

14. Do not evaluate multiple questions
    inside one evaluation object.

15. Return ONLY valid JSON.

16. Do not use Markdown.

17. Do not use ```json.

Return exactly this structure:

{{
    "evaluations": [
        {{
            "question_number": 1,
            "score": 0,
            "correctness": "Correct / Partially Correct / Incorrect",
            "relevance": "Highly Relevant / Relevant / Partially Relevant / Irrelevant",
            "technical_accuracy": "Excellent / Good / Average / Poor",
            "strengths": [
                "strength 1"
            ],
            "weaknesses": [
                "weakness 1"
            ],
            "missing_concepts": [
                "missing concept 1"
            ],
            "feedback": "Detailed but concise feedback for the candidate."
        }}
    ]
}}
"""

    # ==========================================
    # GEMINI REQUEST WITH RETRY
    # ==========================================

    max_retries = 3

    last_error = None

    for attempt in range(max_retries):

        try:

            print(
                "🤖 Evaluating complete interview "
                f"with Gemini "
                f"(attempt {attempt + 1}/{max_retries})"
            )

            response = gemini_client.models.generate_content(

                model="gemini-3.8-flash",

                contents=prompt,

                config={
                    "response_mime_type":
                        "application/json"
                }
            )

            if not response or not response.text:

                raise Exception(
                    "Gemini returned an empty response."
                )
            
            # PARSE JSON
            ai_data = json.loads(
                response.text.strip()
            )

            evaluations = ai_data.get(
                "evaluations",
                []
            )

            if not isinstance(
                evaluations,
                list
            ):

                raise Exception(
                    "Gemini returned invalid evaluations."
                )

            # VALIDATE EVALUATION COUNT
            if len(evaluations) != len(questions):

                raise Exception(
                    "Gemini evaluated an unexpected "
                    "number of questions. "
                    f"Expected: {len(questions)}, "
                    f"Received: {len(evaluations)}"
                )

            # NORMALIZE EACH EVALUATION
            normalized_evaluations = []

            for index, evaluation in enumerate(
                evaluations
            ):

                if not isinstance(
                    evaluation,
                    dict
                ):

                    raise Exception(
                        "Invalid evaluation object returned "
                        f"for question {index + 1}."
                    )

                question_number = evaluation.get(
                    "question_number",
                    index + 1
                )

                # Find original question
                original_question = None

                for question in questions:

                    if (
                        question.get(
                            "question_number"
                        )
                        == question_number
                    ):

                        original_question = question
                        break

                if original_question is None:

                    raise Exception(
                        "Gemini returned an invalid "
                        f"question number: "
                        f"{question_number}"
                    )

                # NORMALIZE SCORE
                score = evaluation.get(
                    "score",
                    0
                )

                try:

                    score = float(score)

                except (
                    ValueError,
                    TypeError
                ):

                    score = 0

                score = max(
                    0,
                    min(
                        10,
                        score
                    )
                )

                if score.is_integer():

                    score = int(score)

                evaluation["score"] = score

                # DEFAULT FIELDS
                evaluation.setdefault(
                    "correctness",
                    "Incorrect"
                )

                evaluation.setdefault(
                    "relevance",
                    "Irrelevant"
                )

                evaluation.setdefault(
                    "technical_accuracy",
                    "Poor"
                )

                evaluation.setdefault(
                    "strengths",
                    []
                )

                evaluation.setdefault(
                    "weaknesses",
                    []
                )

                evaluation.setdefault(
                    "missing_concepts",
                    []
                )

                evaluation.setdefault(
                    "feedback",
                    ""
                )

                evaluation["question_number"] = (
                    question_number
                )

                evaluation["evaluated_at"] = (
                    datetime.utcnow()
                )

                # ADD QUESTION + ANSWER TO EVALUATION
                evaluation["question"] = (
                    original_question.get(
                        "question",
                        ""
                    )
                )

                candidate_answer = ""

                for answer_data in answers:

                    if (
                        answer_data.get(
                            "question_number"
                        )
                        == question_number
                    ):

                        candidate_answer = (
                            answer_data.get(
                                "answer",
                                ""
                            )
                        )

                        break

                evaluation["answer"] = (
                    candidate_answer
                )

                normalized_evaluations.append(
                    evaluation
                )

            print(
                "✅ Complete interview evaluation "
                "received from Gemini."
            )

            return normalized_evaluations

        except Exception as e:

            last_error = e

            error_message = str(e)

            print(
                "⚠️ Complete Interview Evaluation "
                f"Error: {error_message}"
            )

            # Retry temporary Gemini errors
            if (
                (
                    "503" in error_message
                    or
                    "UNAVAILABLE"
                    in error_message
                    or
                    "429" in error_message
                    or
                    "RESOURCE_EXHAUSTED"
                    in error_message
                )
                and
                attempt < max_retries - 1
            ):

                wait_time = 3 * (
                    2 ** attempt
                )

                print(
                    "⏳ Retrying complete "
                    f"evaluation in {wait_time} seconds..."
                )

                time.sleep(
                    wait_time
                )

                continue

            break

    raise Exception(
        "Unable to evaluate complete interview: "
        f"{str(last_error)}"
    )

# ==========================================
# GENERATE OVERALL AI ANALYSIS
# ==========================================
def generate_overall_analysis(
    job_role,
    experience_level,
    difficulty,
    evaluations
):
    """
    Generate overall interview analysis using Gemini.

    Returns:
        dict containing:
        summary
        strengths
        weaknesses
        recommendations
        technical_skill_assessment
        readiness_assessment
    """

    if gemini_client is None:
        raise Exception("Gemini client is not available")

    # PREPARE EVALUATION DATA
    evaluation_text = ""

    for index, evaluation in enumerate(evaluations, start=1):

        question = evaluation.get(
            "question",
            ""
        )

        answer = evaluation.get(
            "answer",
            ""
        )

        score = evaluation.get(
            "score",
            0
        )

        feedback = evaluation.get(
            "feedback",
            ""
        )

        evaluation_text += f"""
Question {index}:
{question}

Candidate Answer:
{answer}

Score:
{score}/10

Feedback:
{feedback}

--------------------------------
"""

    # ==========================================
    # CREATE PROMPT
    # ==========================================

    prompt = f"""
You are an expert interview evaluator.

Analyze the candidate's complete interview.

Job Role:
{job_role}

Experience Level:
{experience_level}

Difficulty:
{difficulty}

Interview Evaluations:
{evaluation_text}

Provide an overall professional assessment.

Return ONLY valid JSON.

The JSON must have exactly these fields:

{{
    "summary": "A short overall summary of the candidate's performance.",

    "strengths": [
        "strength 1",
        "strength 2",
        "strength 3"
    ],

    "weaknesses": [
        "weakness 1",
        "weakness 2",
        "weakness 3"
    ],

    "recommendations": [
        "recommendation 1",
        "recommendation 2",
        "recommendation 3"
    ],

    "technical_skill_assessment":
        "Assessment of the candidate's technical knowledge and skills.",

    "readiness_assessment":
        "Assessment of whether the candidate appears ready for the given role."
}}

Rules:

1. Analyze all answers, not only the scores.
2. Do not invent information that is not present.
3. Keep the assessment professional.
4. Strengths must be based on actual answers.
5. Weaknesses must be based on actual answers.
6. Recommendations should be practical.
7. Do not include Markdown.
8. Return only JSON.
"""

    # CALL GEMINI
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    # GET RESPONSE TEXT
    response_text = response.text.strip()

    # REMOVE MARKDOWN JSON BLOCK IF PRESENT
    if response_text.startswith("```json"):

        response_text = response_text[
            7:
        ]

        if response_text.endswith("```"):
            response_text = response_text[
                :-3
            ]

        response_text = response_text.strip()

    elif response_text.startswith("```"):

        response_text = response_text[
            3:
        ]

        if response_text.endswith("```"):
            response_text = response_text[
                :-3
            ]

        response_text = response_text.strip()

    # PARSE JSON
    result = json.loads(
        response_text
    )

    # VALIDATE RESULT
    if not isinstance(result, dict):
        raise Exception(
            "Invalid AI analysis response"
        )

    # Make sure fields exist
    result.setdefault(
        "summary",
        ""
    )

    result.setdefault(
        "strengths",
        []
    )

    result.setdefault(
        "weaknesses",
        []
    )

    result.setdefault(
        "recommendations",
        []
    )

    result.setdefault(
        "technical_skill_assessment",
        ""
    )

    result.setdefault(
        "readiness_assessment",
        ""
    )

    return result

# ==========================================
# GENERATE OVERALL RESULT
# ==========================================

@interview_bp.route(
    "/<interview_id>/overall-result",
    methods=["POST"]
)
@jwt_required()
def generate_overall_result(interview_id):

    try:

        user_id = get_jwt_identity()

        # VALIDATE INTERVIEW ID
        try:

            object_id = ObjectId(
                interview_id
            )

        except Exception:

            return jsonify({
                "success": False,
                "message": "Invalid interview ID"
            }), 400

        # FIND INTERVIEW
        interview = interviews.find_one({
            "_id": object_id,
            "user_id": user_id
        })

        if not interview:

            return jsonify({
                "success": False,
                "message": "Interview not found"
            }), 404

        # CHECK COMPLETED
        current_status = interview.get(
            "status"
        )

        print("================================")
        print(
            "INTERVIEW STATUS:",
            current_status
        )
        print(
            "INTERVIEW ID:",
            interview_id
        )
        print("================================")

        if current_status != "completed":

            return jsonify({
                "success": False,
                "message": "Interview is not completed yet",
                "current_status": current_status
            }), 400

        # GET EVALUATIONS
        evaluations = interview.get(
            "evaluations",
            []
        )

        if not evaluations:

            return jsonify({
                "success": False,
                "message": "No answer evaluations found"
            }), 400

        # IF OVERALL RESULT ALREADY EXISTS
        existing_overall_result = interview.get(
            "overall_result"
        )

        if existing_overall_result:

            return jsonify({
                "success": True,
                "message": "Overall result already generated",
                "interview_id": interview_id,
                "overall_result": existing_overall_result,
                "report": {
                    "pdf_generated": False,
                    "email_sent": interview.get(
                        "report_email_sent",
                        False
                    ),
                    "email_error": interview.get(
                        "report_email_error",
                        None
                    )
                }
            }), 200

        # ==========================================
        # STEP 1 CALCULATE NUMERIC SCORE
        # ==========================================
        total_score = 0

        valid_evaluations = 0

        for evaluation in evaluations:

            score = evaluation.get(
                "score",
                0
            )

            try:

                score = float(
                    score
                )

            except (
                ValueError,
                TypeError
            ):

                score = 0

            # Keep score between 0 and 10
            score = max(
                0,
                min(
                    10,
                    score
                )
            )

            total_score += score

            valid_evaluations += 1

        # CHECK SCORE
        if valid_evaluations == 0:

            return jsonify({
                "success": False,
                "message": "Unable to calculate overall score"
            }), 400

        max_score = (
            valid_evaluations * 10
        )

        overall_score = round(
            (
                total_score /
                max_score
            ) * 100,
            2
        )

        average_score = round(
            total_score /
            valid_evaluations,
            2
        )

        # ==========================================
        # STEP 2 PERFORMANCE LEVEL
        # ==========================================
        if overall_score >= 90:

            performance_level = "Excellent"

        elif overall_score >= 75:

            performance_level = "Very Good"

        elif overall_score >= 60:

            performance_level = "Good"

        elif overall_score >= 40:

            performance_level = "Needs Improvement"

        else:

            performance_level = "Poor"

        # ==========================================
        # STEP 3 DEFAULT AI ANALYSIS
        # ==========================================
        ai_analysis = {

            "summary":
                "Interview completed successfully. "
                "The overall score is calculated from "
                "your evaluated answers.",

            "strengths": [],

            "weaknesses": [],

            "recommendations": [],

            "technical_skill_assessment":
                "Assessment is based on the scores "
                "received for the evaluated answers.",

            "readiness_assessment":
                "Continue practicing the areas where "
                "your score was lower."
        }

        # ==========================================
        # STEP 4 TRY GEMINI OVERALL ANALYSIS
        # ==========================================
        if gemini_client is not None:

            try:

                ai_result = generate_overall_analysis(

                    interview.get(
                        "job_role",
                        ""
                    ),

                    interview.get(
                        "experience_level",
                        ""
                    ),

                    interview.get(
                        "difficulty",
                        ""
                    ),

                    evaluations
                )

                if isinstance(
                    ai_result,
                    dict
                ):

                    ai_analysis.update(
                        ai_result
                    )

            except Exception as e:

                print(
                    "Overall AI analysis failed:",
                    str(e)
                )

                print(
                    "Numeric interview result "
                    "will still be generated."
                )

        # ==========================================
        # STEP 5 CREATE OVERALL RESULT
        # ==========================================
        overall_result = {

            "overall_score":
                overall_score,

            "average_score":
                average_score,

            "total_score":
                total_score,

            "max_score":
                max_score,

            "performance_level":
                performance_level,

            "summary":
                ai_analysis.get(
                    "summary",
                    ""
                ),

            "strengths":
                ai_analysis.get(
                    "strengths",
                    []
                ),

            "weaknesses":
                ai_analysis.get(
                    "weaknesses",
                    []
                ),

            "recommendations":
                ai_analysis.get(
                    "recommendations",
                    []
                ),

            "technical_skill_assessment":
                ai_analysis.get(
                    "technical_skill_assessment",
                    ""
                ),

            "readiness_assessment":
                ai_analysis.get(
                    "readiness_assessment",
                    ""
                ),

            "generated_at":
                datetime.utcnow()
        }

        # ==========================================
        # STEP 6 SAVE OVERALL RESULT
        # ==========================================
        update_result = interviews.update_one(
            {
                "_id":
                    object_id,

                "user_id":
                    user_id
            },

            {
                "$set": {

                    "overall_result":
                        overall_result,

                    "status":
                        "completed"
                }
            }
        )

        # CHECK DATABASE UPDATE
        if update_result.matched_count == 0:

            return jsonify({
                "success": False,
                "message":
                    "Interview could not be updated"
            }), 500

        # ==========================================
        # STEP 7 PDF + EMAIL
        # ==========================================
        report_email_sent = False

        report_email_error = None

        pdf_generated = False

        pdf_path = None

        try:
            # GET REGISTERED USER
            user = None

            # Try MongoDB ObjectId
            try:

                user_object_id = ObjectId(
                    user_id
                )

                user = users.find_one({
                    "_id": user_object_id
                })

            except Exception:

                pass

            # Try string user_id if ObjectId lookup did not find user
            if not user:

                user = users.find_one({
                    "user_id": user_id
                })

            if not user:

                raise Exception(
                    "Registered user not found."
                )

            # GET USER NAME
            recipient_name = (
                user.get("name")
                or user.get("username")
                or "Candidate"
            )

            # GET USER EMAIL
            recipient_email = (
                user.get("email")
                or ""
            )

            if not recipient_email:

                raise Exception(
                    "Registered user email not found."
                )

            # CREATE REPORT DIRECTORY
            reports_folder = os.path.join(
                os.getcwd(),
                "generated_reports"
            )

            os.makedirs(
                reports_folder,
                exist_ok=True
            )

            # CREATE PDF PATH
            pdf_file_name = (
                f"interview_report_"
                f"{interview_id}.pdf"
            )

            pdf_path = os.path.join(
                reports_folder,
                pdf_file_name
            )

            # GET UPDATED INTERVIEW
            updated_interview = interviews.find_one({

                "_id":
                    object_id,

                "user_id":
                    user_id
            })

            if not updated_interview:

                raise Exception(
                    "Interview could not be loaded "
                    "after generating result."
                )

            # GENERATE PDF
            generate_interview_pdf(
                updated_interview,
                pdf_path
            )

            pdf_generated = True

            print(
                "✅ PDF generated:",
                pdf_path
            )

            # SEND EMAIL
            send_interview_report_email(

                recipient_email=
                    recipient_email,

                recipient_name=
                    recipient_name,

                pdf_path=
                    pdf_path,

                job_role=
                    updated_interview.get(
                        "job_role",
                        "Interview"
                    )
            )

            report_email_sent = True

            print(
                "✅ Email sent to:",
                recipient_email
            )

            # SAVE EMAIL STATUS
            interviews.update_one(
                {
                    "_id":
                        object_id,

                    "user_id":
                        user_id
                },

                {
                    "$set": {

                        "report_email_sent":
                            True,

                        "report_email_sent_at":
                            datetime.utcnow(),

                        "report_email":
                            recipient_email
                    }
                }
            )

        except Exception as report_error:

            report_email_error = str(
                report_error
            )

            print(
                "⚠️ PDF/Email Error:",
                report_email_error
            )

            # Save failure status
            interviews.update_one(

                {
                    "_id":
                        object_id,

                    "user_id":
                        user_id
                },

                {
                    "$set": {

                        "report_email_sent":
                            False,

                        "report_email_error":
                            report_email_error
                    }
                }
            )

        # ==========================================
        # STEP 8 FINAL RESPONSE
        # ==========================================
        return jsonify({

            "success":
                True,

            "message":
                "Overall interview result generated successfully",

            "interview_id":
                interview_id,

            "overall_result":
                overall_result,

            "report": {

                "pdf_generated":
                    pdf_generated,

                "email_sent":
                    report_email_sent,

                "email_error":
                    report_email_error
            }

        }), 200

    except Exception as e:

        print(
            "Overall Result Error:",
            str(e)
        )

        return jsonify({

            "success":
                False,

            "message":
                str(e)

        }), 500

# ==========================================
# CREATE INTERVIEW SETUP
# ==========================================
@interview_bp.route("/setup", methods=["POST"])
@jwt_required()
def setup_interview():
    try:
        user_id = get_jwt_identity()

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "JSON body is required."
            }), 400

        job_role = data.get("job_role")
        experience_level = data.get("experience_level")
        interview_type = data.get("interview_type")
        difficulty = data.get("difficulty")
        number_of_questions = data.get("number_of_questions")

        if not job_role:
            return jsonify({
                "success": False,
                "message": "Job role is required."
            }), 400

        if not experience_level:
            return jsonify({
                "success": False,
                "message": "Experience level is required."
            }), 400

        if not interview_type:
            return jsonify({
                "success": False,
                "message": "Interview type is required."
            }), 400

        if not difficulty:
            return jsonify({
                "success": False,
                "message": "Difficulty is required."
            }), 400

        if number_of_questions is None:
            return jsonify({
                "success": False,
                "message": "Number of questions is required."
            }), 400

        try:
            number_of_questions = int(number_of_questions)
        except (ValueError, TypeError):
            return jsonify({
                "success": False,
                "message": "Number of questions must be a number."
            }), 400

        if number_of_questions < 1:
            return jsonify({
                "success": False,
                "message": "At least 1 question is required."
            }), 400

        if number_of_questions > 20:
            return jsonify({
                "success": False,
                "message": "Maximum 20 questions are allowed."
            }), 400

        if interviews is None:
            return jsonify({
                "success": False,
                "message": "Database is not connected."
            }), 500

        interview_data = {
            "user_id": user_id,
            "job_role": job_role.strip(),
            "experience_level": experience_level.strip(),
            "interview_type": interview_type.strip(),
            "difficulty": difficulty.strip(),
            "number_of_questions": number_of_questions,
            "questions": [],
            "answers": [],
            "evaluations": [],
            "current_question": 0,
            "status": "created",
            "created_at": datetime.utcnow()
        }

        result = interviews.insert_one(interview_data)

        return jsonify({
            "success": True,
            "message": "Interview setup created successfully.",
            "interview_id": str(result.inserted_id)
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# GENERATE AI INTERVIEW QUESTIONS
# ==========================================
@interview_bp.route(
    "/<interview_id>/generate-questions",
    methods=["POST"]
)
@jwt_required()
def generate_questions(interview_id):
    try:
        user_id = get_jwt_identity()

        interview_object_id = get_interview_object_id(interview_id)

        if not interview_object_id:
            return jsonify({
                "success": False,
                "message": "Invalid interview ID."
            }), 400

        interview = interviews.find_one({
            "_id": interview_object_id,
            "user_id": user_id
        })

        if not interview:
            return jsonify({
                "success": False,
                "message": "Interview not found."
            }), 404

        job_role = interview["job_role"]
        experience_level = interview["experience_level"]
        interview_type = interview["interview_type"]
        difficulty = interview["difficulty"]
        number_of_questions = interview["number_of_questions"]

        if gemini_client is None:
            return jsonify({
                "success": False,
                "message": "GEMINI_API_KEY is not configured."
            }), 500

        prompt = f"""
You are an expert technical interviewer.

Generate exactly {number_of_questions}
high-quality interview questions.

Candidate Information:

Job Role:
{job_role}

Experience Level:
{experience_level}

Interview Type:
{interview_type}

Difficulty:
{difficulty}

Requirements:

1. Questions must be directly relevant
   to the job role.

2. Questions must match the candidate's
   experience level.

3. Questions must match the requested
   difficulty.

4. Avoid duplicate questions.

5. Include conceptual and practical
   questions.

6. Questions should be suitable for a
   real technical interview.

7. Do not provide answers.

8. Do not provide explanations.

9. Keep questions clear and concise.

10. Generate exactly
    {number_of_questions} questions.

11. Return ONLY valid JSON.

Return exactly:

{{
    "questions": [
        {{
            "question_number": 1,
            "question": "Question text"
        }}
    ]
}}
"""
        # GEMINI REQUEST WITH RETRY + FALLBACK
        models_to_try = [
            "gemini-3.6-flash",
            "gemini-2.5-flash"
        ]

        response = None
        last_error = None

        for model_name in models_to_try:

            max_retries = 4

            for attempt in range(max_retries):

                try:

                    print(
                        f"🤖 Trying Gemini model: {model_name} "
                        f"(attempt {attempt + 1}/{max_retries})"
                    )

                    response = gemini_client.models.generate_content(

                        model=model_name,

                        contents=prompt,

                        config={
                            "response_mime_type":
                                "application/json"
                        }
                    )

                    if response and response.text:

                        print(
                            f"✅ Gemini response received "
                            f"from {model_name}"
                        )

                        break

                    raise Exception(
                        "Gemini returned an empty response."
                    )

                except Exception as e:

                    last_error = e

                    error_message = str(e)

                    print(
                        f"⚠️ Gemini error with {model_name}: "
                        f"{error_message}"
                    )

                    # Retry temporary errors
                    if (
                        (
                            "503" in error_message
                            or
                            "UNAVAILABLE" in error_message
                            or
                            "429" in error_message
                            or
                            "RESOURCE_EXHAUSTED"
                            in error_message
                        )
                        and
                        attempt < max_retries - 1
                    ):

                        wait_time = 3 * (
                            2 ** attempt
                        )

                        print(
                            f"⏳ Retrying in "
                            f"{wait_time} seconds..."
                        )

                        time.sleep(
                            wait_time
                        )

                        continue

                    break

            # If successful, stop trying models
            if response and response.text:
                break

            print(
                f"⚠️ Model {model_name} failed. "
                f"Trying next model..."
            )

        # No model worked
        if not response or not response.text:

            return jsonify({

                "success": False,

                "message":
                    "AI question generation is temporarily unavailable. "
                    "Please try again after a few seconds.",

                "error":
                    str(last_error)
                    if last_error
                    else "Unknown Gemini error."

            }), 503

        if not response.text:
            return jsonify({
                "success": False,
                "message": "Gemini returned an empty response."
            }), 500

        try:
            ai_data = json.loads(response.text.strip())
        except json.JSONDecodeError:
            return jsonify({
                "success": False,
                "message": "Gemini returned invalid JSON.",
                "ai_response": response.text
            }), 500

        questions = ai_data.get("questions", [])

        if not questions:
            return jsonify({
                "success": False,
                "message": "Gemini did not generate questions."
            }), 500

        if len(questions) != number_of_questions:
            return jsonify({
                "success": False,
                "message": "Gemini generated an unexpected number of questions.",
                "expected": number_of_questions,
                "received": len(questions)
            }), 500

        interviews.update_one(
            {
                "_id": interview_object_id,
                "user_id": user_id
            },
            {
                "$set": {
                    "questions": questions,
                    "answers": [],
                    "evaluations": [],
                    "current_question": 0,
                    "status": "ready",
                    "questions_generated_at": datetime.utcnow()
                }
            }
        )

        return jsonify({
            "success": True,
            "message": "AI interview questions generated successfully.",
            "interview_id": interview_id,
            "job_role": job_role,
            "experience_level": experience_level,
            "interview_type": interview_type,
            "difficulty": difficulty,
            "number_of_questions": len(questions),
            "questions": questions
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# START INTERVIEW
# ==========================================
@interview_bp.route(
    "/<interview_id>/start",
    methods=["POST"]
)
@jwt_required()
def start_interview(interview_id):

    try:

        user_id = get_jwt_identity()

        # VALIDATE INTERVIEW ID
        try:

            object_id = ObjectId(interview_id)

        except Exception:

            return jsonify({
                "success": False,
                "message": "Invalid interview ID."
            }), 400

        # FIND INTERVIEW
        interview = interviews.find_one({
            "_id": object_id,
            "user_id": user_id
        })

        if not interview:

            return jsonify({
                "success": False,
                "message": "Interview not found."
            }), 404

        # QUESTIONS CHECK
        questions = interview.get(
            "questions",
            []
        )

        if not questions:

            return jsonify({
                "success": False,
                "message": "Interview questions are not generated yet."
            }), 400

        # COMPLETED INTERVIEW
        if interview.get("status") == "completed":

            return jsonify({
                "success": False,
                "message": "This interview has already been completed."
            }), 400

        # RESUME EXISTING INTERVIEW
        if interview.get("status") == "in_progress":

            current_index = interview.get(
                "current_question",
                0
            )

            # Safety check
            if current_index >= len(questions):

                return jsonify({
                    "success": False,
                    "message": "Interview is already completed."
                }), 400

            current_question = questions[
                current_index
            ]

            return jsonify({

                "success": True,

                "message":
                    "Interview resumed successfully.",

                "status":
                    "in_progress",

                "interview_id":
                    interview_id,

                "current_question":
                    current_index + 1,

                "total_questions":
                    len(questions),

                "question":
                    current_question

            }), 200

        # FIRST TIME START
        if interview.get("status") in [
            "ready",
            "created"
        ]:

            current_index = 0

            interviews.update_one(

                {
                    "_id": object_id,
                    "user_id": user_id
                },

                {
                    "$set": {

                        "current_question":
                            current_index,

                        "status":
                            "in_progress",

                        "started_at":
                            datetime.utcnow()

                    }
                }

            )

            return jsonify({

                "success": True,

                "message":
                    "Interview started successfully.",

                "status":
                    "in_progress",

                "interview_id":
                    interview_id,

                "current_question":
                    1,

                "total_questions":
                    len(questions),

                "question":
                    questions[0]

            }), 200

        # INVALID STATUS
        return jsonify({

            "success": False,

            "message":
                f"Invalid interview status: "
                f"{interview.get('status')}"

        }), 400

    except Exception as e:

        print(
            "Start Interview Error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to start/resume interview.",

            "error":
                str(e)

        }), 500

# ==========================================
# RESUME INTERVIEW
# ==========================================
@interview_bp.route(
    "/<interview_id>/resume",
    methods=["GET"]
)
@jwt_required()
def resume_interview(interview_id):

    try:
        user_id = get_jwt_identity()

        # VALIDATE INTERVIEW ID
        try:

            object_id = ObjectId(interview_id)

        except Exception:

            return jsonify({
                "success": False,
                "message": "Invalid interview ID."
            }), 400

        # FIND INTERVIEW
        interview = interviews.find_one({
            "_id": object_id,
            "user_id": user_id
        })

        if not interview:

            return jsonify({
                "success": False,
                "message": "Interview not found."
            }), 404

        questions = interview.get(
            "questions",
            []
        )

        answers = interview.get(
            "answers",
            []
        )

        evaluations = interview.get(
            "evaluations",
            []
        )

        status = interview.get(
            "status"
        )

        current_index = interview.get(
            "current_question",
            0
        )

        total_questions = len(
            questions
        )

        # COMPLETED
        if status == "completed":

            return jsonify({

                "success": True,

                "status":
                    "completed",

                "interview_id":
                    interview_id,

                "current_question":
                    total_questions,

                "total_questions":
                    total_questions,

                "answered_questions":
                    len(answers),

                "evaluated_questions":
                    len(evaluations),

                "overall_result":
                    interview.get(
                        "overall_result"
                    ),

                "message":
                    "Interview already completed."

            }), 200

        # EVALUATION PENDING
        elif status == "evaluation_pending":
            return jsonify({
                "success": True,
                "status":"evaluation_pending",
                "evaluating":interview.get("evaluating",False),
                "message":"All answers are saved. ""Interview evaluation is pending.",
                "current_question":len(questions),
                "current_question_number":len(questions),
                "total_questions":len(questions),
                "answered_questions":len(answers),
                "evaluations":len(interview.get("evaluations",[]))
            }),200
        

        # NOT STARTED
        if status in [
            "created",
            "ready"
        ]:

            return jsonify({

                "success": True,

                "status":
                    status,

                "interview_id":
                    interview_id,

                "current_question":
                    1,

                "total_questions":
                    total_questions,

                "answered_questions":
                    len(answers),

                "evaluated_questions":
                    len(evaluations),

                "message":
                    "Interview has not started yet."

            }), 200

        # IN PROGRESS
        if status == "in_progress":

            if current_index >= total_questions:

                return jsonify({

                    "success": False,

                    "message":
                        "Invalid current question index."

                }), 400

            current_question = questions[
                current_index
            ]

            return jsonify({

                "success": True,

                "status":
                    "in_progress",

                "interview_id":
                    interview_id,

                "current_question":
                    current_index + 1,

                "total_questions":
                    total_questions,

                "question":
                    current_question,

                "answered_questions":
                    len(answers),

                "evaluated_questions":
                    len(evaluations),

                "message":
                    "Interview resumed successfully."

            }), 200

        # UNKNOWN STATUS
        return jsonify({

            "success": False,

            "message":
                f"Unknown interview status: {status}"

        }), 400

    except Exception as e:

        print(
            "Resume Interview Error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to resume interview.",

            "error":
                str(e)

        }), 500

# ==========================================
# GET CURRENT QUESTION
# ==========================================
@interview_bp.route(
    "/<interview_id>/current-question",
    methods=["GET"]
)
@jwt_required()
def get_current_question(interview_id):
    try:
        user_id = get_jwt_identity()

        interview_object_id = get_interview_object_id(interview_id)

        if not interview_object_id:
            return jsonify({
                "success": False,
                "message": "Invalid interview ID."
            }), 400

        interview = interviews.find_one({
            "_id": interview_object_id,
            "user_id": user_id
        })

        if not interview:
            return jsonify({
                "success": False,
                "message": "Interview not found."
            }), 404

        status = interview.get("status")

        if status == "created":
            return jsonify({
                "success": False,
                "message": "Please generate questions first."
            }), 400

        if status == "ready":
            return jsonify({
                "success": False,
                "message": "Please start the interview first."
            }), 400

        if status == "completed":
            return jsonify({
                "success": False,
                "message": "Interview is already completed.",
                "status": "completed"
            }), 400

        questions = interview.get("questions", [])
        current_question = interview.get("current_question", 0)

        if current_question >= len(questions):
            return jsonify({
                "success": False,
                "message": "No more questions available."
            }), 400

        return jsonify({
            "success": True,
            "interview_id": interview_id,
            "status": status,
            "current_question": current_question + 1,
            "total_questions": len(questions),
            "question": questions[current_question]
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# SUBMIT ANSWER , SAVE ANSWER ONLY , GEMINI IS NOT CALLED HERE
# ==========================================

@interview_bp.route(
    "/<interview_id>/answer",
    methods=["POST"]
)
@jwt_required()
def submit_answer(interview_id):

    try:
        user_id = get_jwt_identity()

        object_id = get_interview_object_id(
            interview_id
        )

        if object_id is None:

            return jsonify({
                "success": False,
                "message": "Invalid interview ID."
            }), 400

        # GET INTERVIEW
        interview = interviews.find_one({
            "_id": object_id,
            "user_id": user_id
        })

        if not interview:

            return jsonify({
                "success": False,
                "message": "Interview not found."
            }), 404

        # CHECK STATUS
        if interview.get("status") != "in_progress":

            return jsonify({
                "success": False,
                "message": (
                    "This interview is not currently "
                    "accepting answers."
                ),
                "status": interview.get("status")
            }), 400

        # GET REQUEST DATA
        data = request.get_json(
            silent=True
        ) or {}

        answer = str(
            data.get("answer", "")
        ).strip()

        if not answer:

            return jsonify({
                "success": False,
                "message": "Answer cannot be empty."
            }), 400

        # GET QUESTIONS
        questions = interview.get(
            "questions",
            []
        )

        if not questions:

            return jsonify({
                "success": False,
                "message": "Interview questions not found."
            }), 400

        # CURRENT QUESTION INDEX
        current_index = interview.get(
            "current_question",
            0
        )

        try:

            current_index = int(
                current_index
            )

        except (
            ValueError,
            TypeError
        ):

            current_index = 0

        # VALIDATE QUESTION INDEX
        if (
            current_index < 0
            or
            current_index >= len(questions)
        ):

            return jsonify({
                "success": False,
                "message": "Invalid current question."
            }), 400

        # CURRENT QUESTION
        current_question = questions[
            current_index
        ]

        question_number = current_question.get(
            "question_number",
            current_index + 1
        )

        question_text = current_question.get(
            "question",
            ""
        )

        # CHECK DUPLICATE ANSWER
        existing_answers = interview.get(
            "answers",
            []
        )

        for existing_answer in existing_answers:

            if (
                existing_answer.get(
                    "question_number"
                )
                == question_number
            ):

                return jsonify({
                    "success": False,
                    "message": (
                        "This question has already "
                        "been answered."
                    )
                }), 400

        # CREATE ANSWER OBJECT
        answer_data = {

            "question_number":
                question_number,

            "question":
                question_text,

            "answer":
                answer,

            "answered_at":
                datetime.utcnow()
        }

        # CHECK IF FINAL QUESTION
        is_last_question = (
            current_index
            ==
            len(questions) - 1
        )

        # FINAL QUESTION
        if is_last_question:

            interviews.update_one(

                {
                    "_id": object_id,
                    "user_id": user_id
                },

                {
                    "$push": {
                        "answers": answer_data
                    },

                    "$set": {

                        "current_question":
                            len(questions),

                        "status":
                            "evaluation_pending",

                        "completed_at":
                            datetime.utcnow()
                    }
                }
            )

            print(
                "✅ Final answer saved."
            )

            print(
                "⏳ Interview waiting for "
                "complete Gemini evaluation."
            )

            return jsonify({

                "success": True,

                "message":
                    "Final answer saved successfully.",

                "status":
                    "evaluation_pending",

                "question_number":
                    question_number,

                "total_questions":
                    len(questions),

                "next_question":
                    None,

                "next_question_number":
                    None
            }), 200

        # NOT FINAL QUESTION
        next_index = current_index + 1

        next_question = questions[
            next_index
        ]

        next_question_number = next_question.get(
            "question_number",
            next_index + 1
        )

        # SAVE ANSWER + MOVE TO NEXT QUESTION
        interviews.update_one(

            {
                "_id": object_id,
                "user_id": user_id
            },

            {
                "$push": {
                    "answers": answer_data
                },

                "$set": {
                    "current_question":
                        next_index
                }
            }
        )

        print(
            f"✅ Answer saved for "
            f"Question {question_number}"
        )

        print(
            f"➡️ Moving to Question "
            f"{next_question_number}"
        )

        # RETURN NEXT QUESTION
        return jsonify({

            "success": True,

            "message":
                "Answer saved successfully.",

            "status":
                "in_progress",

            "question_number":
                question_number,

            "total_questions":
                len(questions),

            "next_question":
                next_question,

            "next_question_number":
                next_question_number
        }), 200

    except Exception as e:

        print(
            "❌ Submit Answer Error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to save answer.",

            "error":
                str(e)
        }), 500
    
# ==========================================
# EVALUATE COMPLETE INTERVIEW
# ONE GEMINI REQUEST FOR ALL ANSWERS
# ==========================================

@interview_bp.route(
    "/<interview_id>/evaluate",
    methods=["POST"]
)
@jwt_required()
def evaluate_interview(interview_id):

    try:

        user_id = get_jwt_identity()

        # VALIDATE INTERVIEW ID
        object_id = get_interview_object_id(
            interview_id
        )

        if object_id is None:

            return jsonify({
                "success": False,
                "message": "Invalid interview ID."
            }), 400

        # GET INTERVIEW
        interview = interviews.find_one({
            "_id": object_id,
            "user_id": user_id
        })

        if not interview:

            return jsonify({
                "success": False,
                "message": "Interview not found."
            }), 404

        # GET QUESTIONS + ANSWERS
        questions = interview.get(
            "questions",
            []
        )

        answers = interview.get(
            "answers",
            []
        )

        if not questions:

            return jsonify({
                "success": False,
                "message": "Interview questions not found."
            }), 400

        # IF ALREADY EVALUATED
        existing_evaluations = interview.get(
            "evaluations",
            []
        )

        if existing_evaluations:

            return jsonify({

                "success": True,

                "message":
                    "Interview is already evaluated.",

                "status":
                    interview.get(
                        "status",
                        "completed"
                    ),

                "evaluations":
                    existing_evaluations,

                "evaluation_count":
                    len(existing_evaluations)

            }), 200
        
        # PREVENT DUPLICATE EVALUATION
        if interview.get("evaluating") is True:
            return jsonify({
                "success" : False,
                "message":"Interview evaluation is already ""in progress.",
                "status":"evaluating"
            }),409

        # CHECK ANSWER COUNT
        if len(answers) != len(questions):

            return jsonify({

                "success": False,

                "message":
                    "All interview questions must "
                    "be answered before evaluation.",

                "questions":
                    len(questions),

                "answers":
                    len(answers)

            }), 400

        # CHECK GEMINI CLIENT
        if gemini_client is None:

            return jsonify({

                "success": False,

                "message":
                    "Gemini client is not available."

            }), 500

        # CHECK STATUS
        current_status = interview.get(
            "status"
        )

        if current_status not in [
            "evaluation_pending",
            "completed"
        ]:

            return jsonify({

                "success": False,

                "message":
                    "Interview is not ready "
                    "for evaluation.",

                "status":
                    current_status

            }), 400

        # MARK INTERVIEW AS EVALUATING
        interviews.update_one(
             {
                 "_id": object_id,
                 "user_id": user_id
            },
            {
                "$set": {
                    "evaluating": True
                }
            }
        )

        # GEMINI - ONE REQUEST
        print(
            "🤖 Starting complete interview "
            "evaluation..."
        )

        evaluations = (
            evaluate_all_answers_with_gemini(

                job_role=
                    interview.get(
                        "job_role",
                        ""
                    ),

                experience_level=
                    interview.get(
                        "experience_level",
                        ""
                    ),

                difficulty=
                    interview.get(
                        "difficulty",
                        ""
                    ),

                questions=
                    questions,

                answers=
                    answers
            )
        )

        # VALIDATE GEMINI RESULT
        if not evaluations:

            return jsonify({

                "success": False,

                "message":
                    "Gemini did not return "
                    "any evaluations."

            }), 500

        if len(evaluations) != len(questions):

            return jsonify({

                "success": False,

                "message":
                    "Gemini did not evaluate "
                    "all questions.",

                "expected":
                    len(questions),

                "received":
                    len(evaluations)

            }), 500

        # SAVE EVALUATIONS
        update_result = interviews.update_one(

            {
                "_id": object_id,
                "user_id": user_id
            },

            {
                "$set": {

                    "evaluations":
                        evaluations,

                    "status":
                        "completed",

                    "evaluating": False,

                    "evaluated_at":
                        datetime.utcnow()
                }
            }
        )

        # CHECK DATABASE UPDATE
        if update_result.modified_count == 0:

            print(
                "⚠️ Evaluation data was not modified."
            )

        print(
            "✅ Complete interview evaluation "
            "saved successfully."
        )

        # RETURN RESPONSE
        return jsonify({

            "success": True,

            "message":
                "Complete interview evaluated successfully.",

            "status":
                "completed",

            "evaluations":
                evaluations,

            "evaluation_count":
                len(evaluations)

        }), 200

    except Exception as e:

        print(
            "❌ Complete Interview Evaluation Error:",
            str(e)
        )

        # RESET EVALUATING FLAG AFTER ERROR
        try:
            interviews.update_one(

            {
                "_id": object_id,
                "user_id": user_id
            },

            {
                "$set": {
                    "evaluating": False
                }
            }
        )

        except Exception as reset_error:
            print("⚠️ Unable to reset evaluating flag:",str(reset_error))

        return jsonify({

            "success": False,

            "message":
                "Unable to evaluate complete interview.",

            "error":
                str(e)

        }), 500

# ==========================================
# GET INTERVIEW RESULT
# ==========================================
@interview_bp.route(
    "/<interview_id>/result",
    methods=["GET"]
)
@jwt_required()
def get_interview_result(interview_id):
    try:
        user_id = get_jwt_identity()

        interview_object_id = get_interview_object_id(interview_id)

        if not interview_object_id:
            return jsonify({
                "success": False,
                "message": "Invalid interview ID."
            }), 400

        interview = interviews.find_one({
            "_id": interview_object_id,
            "user_id": user_id
        })

        if not interview:
            return jsonify({
                "success": False,
                "message": "Interview not found."
            }), 404

        return jsonify({
            "success": True,
            "interview": {
                "interview_id": str(interview["_id"]),
                "job_role": interview.get("job_role"),
                "experience_level": interview.get("experience_level"),
                "interview_type": interview.get("interview_type"),
                "difficulty": interview.get("difficulty"),
                "number_of_questions": interview.get("number_of_questions"),
                "status": interview.get("status"),
                "questions": interview.get("questions", []),
                "answers": interview.get("answers", []),
                "evaluations": interview.get("evaluations", []),
                "overall_result": interview.get("overall_result",None)
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# INTERVIEW RESULT DASHBOARD
# ==========================================
@interview_bp.route("/<interview_id>/dashboard",methods=["GET"])
@jwt_required()
def interview_dashboard(interview_id):

    try:
        user_id = get_jwt_identity()

        # Validate ObjectId
        try:
            object_id = ObjectId(interview_id)
        except Exception:
            return jsonify({
                "success": False,
                "message": "Invalid interview ID"
            }), 400

        # Find interview owned by logged-in user
        interview = interviews.find_one({
            "_id": object_id,
            "user_id": user_id
        })

        if not interview:
            return jsonify({
                "success": False,
                "message": "Interview not found"
            }), 404

        evaluations = interview.get("evaluations", [])
        answers = interview.get("answers", [])
        questions = interview.get("questions", [])

        overall_result = interview.get(
            "overall_result"
        )

        # Overall result is required
        if not overall_result:
            return jsonify({
                "success": False,
                "message": "Overall result has not been generated yet"
            }), 400

        # Question-wise performance
        question_performance = []

        answer_map = {}

        for answer in answers:
            question_number = answer.get(
                "question_number"
            )

            answer_map[question_number] = answer

        evaluation_map = {}

        for evaluation in evaluations:
            question_number = evaluation.get(
                "question_number"
            )

            evaluation_map[question_number] = evaluation

        for index, question in enumerate(questions):

            question_number = question.get(
                "question_number",
                index + 1
            )

            answer = answer_map.get(
                question_number
            )

            evaluation = evaluation_map.get(
                question_number
            )

            question_performance.append({
                "question_number": question_number,

                "question": question.get(
                    "question",
                    ""
                ),

                "answer": (
                    answer.get("answer", "")
                    if answer
                    else None
                ),

                "score": (
                    evaluation.get("score", 0)
                    if evaluation
                    else 0
                ),

                "correctness": (
                    evaluation.get("correctness", "")
                    if evaluation
                    else "Not Evaluated"
                ),

                "relevance": (
                    evaluation.get("relevance", "")
                    if evaluation
                    else "Not Evaluated"
                ),

                "technical_accuracy": (
                    evaluation.get(
                        "technical_accuracy",
                        ""
                    )
                    if evaluation
                    else "Not Evaluated"
                ),

                "strengths": (
                    evaluation.get("strengths", [])
                    if evaluation
                    else []
                ),

                "weaknesses": (
                    evaluation.get("weaknesses", [])
                    if evaluation
                    else []
                ),

                "missing_concepts": (
                    evaluation.get(
                        "missing_concepts",
                        []
                    )
                    if evaluation
                    else []
                ),

                "feedback": (
                    evaluation.get("feedback", "")
                    if evaluation
                    else ""
                )
            })

        # Dashboard response
        dashboard_data = {

            "interview": {
                "interview_id": interview_id,
                "job_role": interview.get(
                    "job_role",
                    ""
                ),
                "experience_level": interview.get(
                    "experience_level",
                    ""
                ),
                "interview_type": interview.get(
                    "interview_type",
                    ""
                ),
                "difficulty": interview.get(
                    "difficulty",
                    ""
                ),
                "number_of_questions": interview.get(
                    "number_of_questions",
                    len(questions)
                ),
                "status": interview.get(
                    "status",
                    ""
                )
            },

            "overall_performance": {
                "overall_score": overall_result.get(
                    "overall_score",
                    0
                ),
                "average_score": overall_result.get(
                    "average_score",
                    0
                ),
                "total_score": overall_result.get(
                    "total_score",
                    0
                ),
                "max_score": overall_result.get(
                    "max_score",
                    0
                ),
                "performance_level": overall_result.get(
                    "performance_level",
                    ""
                )
            },

            "ai_analysis": {
                "summary": overall_result.get(
                    "summary",
                    ""
                ),
                "strengths": overall_result.get(
                    "strengths",
                    []
                ),
                "weaknesses": overall_result.get(
                    "weaknesses",
                    []
                ),
                "recommendations": overall_result.get(
                    "recommendations",
                    []
                ),
                "technical_skill_assessment":
                    overall_result.get(
                        "technical_skill_assessment",
                        ""
                    ),
                "readiness_assessment":
                    overall_result.get(
                        "readiness_assessment",
                        ""
                    )
            },

            "question_performance":
                question_performance
        }

        return jsonify({
            "success": True,
            "message": "Interview dashboard retrieved successfully",
            "data": dashboard_data
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# INTERVIEW HISTORY
# ==========================================
@interview_bp.route("/history", methods=["GET"])
@jwt_required()
def interview_history():

    try:
        user_id = get_jwt_identity()

        if interviews is None:
            return jsonify({
                "success": False,
                "message": "Database is not connected."
            }), 500

        interview_cursor = interviews.find(
            {
                "user_id": user_id
            }
        ).sort(
            "created_at",
            -1
        )

        history = []

        for interview in interview_cursor:

            overall_result = interview.get(
                "overall_result",
                {}
            )

            history.append({
                "interview_id": str(interview["_id"]),
                "job_role": interview.get("job_role", ""),
                "experience_level": interview.get("experience_level", ""),
                "interview_type": interview.get("interview_type", ""),
                "difficulty": interview.get("difficulty", ""),
                "number_of_questions": interview.get("number_of_questions", 0),
                "overall_score": overall_result.get("overall_score", None),
                "performance_level": overall_result.get("performance_level", None),
                "status": interview.get("status", ""),
                "created_at": (interview["created_at"].isoformat()
                               if interview.get("created_at")
                               else None
                               )
            })


        return jsonify({
            "success": True,
            "total_interviews": len(history),
            "interviews": history
        }), 200

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# DELETE INTERVIEW
# ==========================================
@interview_bp.route(
    "/<interview_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_interview(interview_id):

    try:
        # GET LOGGED-IN USER
        user_id = get_jwt_identity()

        # VALIDATE INTERVIEW ID
        interview_object_id = get_interview_object_id(
            interview_id
        )

        if not interview_object_id:

            return jsonify({
                "success": False,
                "message": "Invalid interview ID."
            }), 400

        # CHECK INTERVIEW EXISTS
        # AND BELONGS TO CURRENT USER
        interview = interviews.find_one({
            "_id": interview_object_id,
            "user_id": user_id
        })

        if not interview:

            return jsonify({
                "success": False,
                "message": "Interview not found."
            }), 404

        # DELETE INTERVIEW
        delete_result = interviews.delete_one({
            "_id": interview_object_id,
            "user_id": user_id
        })

        # CHECK DELETE RESULT
        if delete_result.deleted_count == 0:

            return jsonify({
                "success": False,
                "message": "Interview could not be deleted."
            }), 400

        # SUCCESS
        return jsonify({
            "success": True,
            "message": "Interview deleted successfully.",
            "interview_id": interview_id
        }), 200

    except Exception as e:

        print(
            "Delete Interview Error:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": "Something went wrong while deleting interview.",
            "error": str(e)
        }), 500

# ==========================================
# INTERVIEW DETAILS
# ==========================================
@interview_bp.route("/<interview_id>/details", methods=["GET"])
@jwt_required()
def interview_details(interview_id):
    try:
        user_id = get_jwt_identity()

        # VALIDATE INTERVIEW ID
        interview_object_id = get_interview_object_id(interview_id)

        if not interview_object_id:
            return jsonify({
                "success": False,
                "message": "Invalid interview ID."
            }), 400

        # FIND INTERVIEW
        interview = interviews.find_one({
            "_id": interview_object_id,
            "user_id": user_id
        })

        if not interview:
            return jsonify({
                "success": False,
                "message": "Interview not found."
            }), 404

        # GET DATA
        questions = interview.get("questions", [])
        answers = interview.get("answers", [])
        evaluations = interview.get("evaluations", [])
        overall_result = interview.get("overall_result", {})

        # ANSWER MAP
        answer_map = {}

        for answer in answers:
            question_number = answer.get("question_number")
            answer_map[question_number] = answer

        # EVALUATION MAP
        evaluation_map = {}

        for evaluation in evaluations:
            question_number = evaluation.get("question_number")
            evaluation_map[question_number] = evaluation

        # QUESTION-WISE DETAILS
        question_details = []

        for index, question in enumerate(questions):
            question_number = question.get("question_number", index + 1)
            answer = answer_map.get(question_number)
            evaluation = evaluation_map.get(question_number)

            question_details.append({
                "question_number": question_number,
                "question": question.get("question", ""),
                "answer": (
                    answer.get("answer", "")
                    if answer
                    else None
                ),
                "score": (
                    evaluation.get("score", 0)
                    if evaluation
                    else 0
                ),
                "correctness": (
                    evaluation.get("correctness", "")
                    if evaluation
                    else "Not Evaluated"
                ),
                "relevance": (
                    evaluation.get("relevance", "")
                    if evaluation
                    else "Not Evaluated"
                ),
                "technical_accuracy": (
                    evaluation.get("technical_accuracy", "")
                    if evaluation
                    else "Not Evaluated"
                ),
                "strengths": (
                    evaluation.get("strengths", [])
                    if evaluation
                    else []
                ),
                "weaknesses": (
                    evaluation.get("weaknesses", [])
                    if evaluation
                    else []
                ),
                "missing_concepts": (
                    evaluation.get("missing_concepts", [])
                    if evaluation
                    else []
                ),
                "feedback": (
                    evaluation.get("feedback", "")
                    if evaluation
                    else ""
                )
            })

        # DATE INFORMATION
        created_at = interview.get("created_at")
        started_at = interview.get("started_at")
        completed_at = interview.get("completed_at")

        # FINAL RESPONSE
        return jsonify({
            "success": True,

            "interview": {
                "interview_id": str(interview["_id"]),
                "job_role": interview.get("job_role", ""),
                "experience_level": interview.get("experience_level", ""),
                "interview_type": interview.get("interview_type", ""),
                "difficulty": interview.get("difficulty", ""),
                "number_of_questions": interview.get(
                    "number_of_questions",
                    len(questions)
                ),
                "status": interview.get("status", ""),
                "created_at": (
                    created_at.isoformat()
                    if created_at
                    else None
                ),
                "started_at": (
                    started_at.isoformat()
                    if started_at
                    else None
                ),
                "completed_at": (
                    completed_at.isoformat()
                    if completed_at
                    else None
                )
            },

            # SUMMARY
            "summary": {
                "total_questions": len(questions),
                "answered_questions": len(answers),
                "evaluated_questions": len(evaluations),

                # Overall result values
                # directly inside summary
                "overall_score": overall_result.get(
                    "overall_score",
                    None
                ),
                "average_score": overall_result.get(
                    "average_score",
                    None
                ),
                "total_score": overall_result.get(
                    "total_score",
                    None
                ),
                "max_score": overall_result.get(
                    "max_score",
                    None
                ),
                "performance_level": overall_result.get(
                    "performance_level",
                    ""
                ),

                # Keep complete result also
                "overall_result": overall_result
            },

            # QUESTION DETAILS
            "question_details": question_details
        }), 200

    except Exception as e:
        print("Interview Details Error:", repr(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# RETAKE INTERVIEW
# ==========================================
@interview_bp.route("/<interview_id>/retake",methods=["POST"])
@jwt_required()
def retake_interview(interview_id):

    try:
        user_id = get_jwt_identity()

        # Validate interview ID
        interview_object_id = get_interview_object_id(
            interview_id
        )

        if not interview_object_id:
            return jsonify({
                "success": False,
                "message": "Invalid interview ID."
            }), 400

        # Find original interview
        original_interview = interviews.find_one({
            "_id": interview_object_id,
            "user_id": user_id
        })

        if not original_interview:
            return jsonify({
                "success": False,
                "message": "Interview not found."
            }), 404

        # Find root interview
        root_interview_id = original_interview.get("root_interview_id")
        if not root_interview_id:
            root_interview_id = str(original_interview["_id"])

        # Count previous attempts
        previous_attempts = interviews.count_documents({
            "user_id": user_id,
            "$or": [
                {
                    "_id": ObjectId(root_interview_id)
                },
                {
                    "root_interview_id": root_interview_id
                }
            ]
        })

        attempt_number = previous_attempts + 1

        # Create new interview
        new_interview = {
            "user_id": user_id,
            "job_role": original_interview.get("job_role",""),
            "experience_level": original_interview.get("experience_level","Fresher"),
            "interview_type": original_interview.get("interview_type","Technical"),
            "difficulty": original_interview.get("difficulty","Medium"),
            "number_of_questions": original_interview.get("number_of_questions",5),

            # New attempt starts with empty questions
            "questions": [],
            "answers": [],
            "evaluations": [],
            "current_question": 0,
            "status": "created",
            "created_at": datetime.utcnow(),
            "retake_of": str(original_interview["_id"]),
            "root_interview_id": root_interview_id,
            "attempt_number": attempt_number
        }

        result = interviews.insert_one(new_interview)
        new_interview_id = str(result.inserted_id)

        return jsonify({
            "success": True,
            "message": "New interview created successfully.",
            "interview_id": new_interview_id,
            "retake_of": str(original_interview["_id"]),
            "interview": {
                "job_role": new_interview["job_role"],
                "experience_level": new_interview["experience_level"],
                "interview_type": new_interview["interview_type"],
                "difficulty": new_interview["difficulty"],
                "number_of_questions": new_interview["number_of_questions"],
                "status": new_interview["status"],
                "attempt_number": new_interview["attempt_number"]
            }
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# DOWNLOAD INTERVIEW PDF REPORT
# ==========================================
@interview_bp.route(
    "/<interview_id>/download-report",
    methods=["GET"]
)
@jwt_required()
def download_interview_report(interview_id):

    try:

        print("\n")
        print("==========================================")
        print("📄 PDF DOWNLOAD REQUEST")
        print("Interview ID:", interview_id)
        print("==========================================")

        user_id = get_jwt_identity()

        print("Logged-in User ID:", user_id)

        # VALIDATE INTERVIEW ID
        try:

            object_id = ObjectId(
                interview_id
            )

        except Exception:

            print("❌ Invalid Interview ID")

            return jsonify({

                "success": False,

                "message":
                    "Invalid interview ID"

            }), 400

        # FIND INTERVIEW
        interview = interviews.find_one({

            "_id": object_id,

            "user_id": user_id

        })

        # INTERVIEW NOT FOUND
        if not interview:

            print("❌ INTERVIEW NOT FOUND")

            print(
                "Searching with:"
            )

            print(
                "_id:",
                object_id
            )

            print(
                "user_id:",
                user_id
            )

            return jsonify({

                "success": False,

                "message":
                    "Interview not found for this user"

            }), 404

        print("✅ Interview found")

        print(
            "Interview user_id:",
            interview.get("user_id")
        )

        print(
            "Interview status:",
            interview.get("status")
        )

        print(
            "Overall result exists:",
            bool(
                interview.get(
                    "overall_result"
                )
            )
        )

        # CHECK OVERALL RESULT
        if not interview.get(
            "overall_result"
        ):

            print(
                "❌ Overall result does not exist"
            )

            return jsonify({

                "success": False,

                "message":
                    "Interview result has not been generated yet"

            }), 400

        # CREATE REPORT DIRECTORY
        reports_folder = os.path.join(

            os.getcwd(),

            "generated_reports"

        )

        os.makedirs(

            reports_folder,

            exist_ok=True

        )

        print(
            "Reports folder:",
            reports_folder
        )

        # PDF FILE NAME
        pdf_file_name = (

            f"interview_report_"
            f"{interview_id}.pdf"

        )

        pdf_path = os.path.join(

            reports_folder,

            pdf_file_name

        )

        print(
            "Expected PDF path:",
            pdf_path
        )


        # ALWAYS GENERATE FRESH PDF
        print("📄 Generating fresh PDF report...")

        try:
            generate_interview_pdf(interview,pdf_path)
            print("✅ Fresh PDF generated")

        except Exception as pdf_error:
            print("❌ PDF GENERATION ERROR:")
            print(repr(pdf_error))

            return jsonify({
                "success": False,
                "message": "Unable to generate PDF report",
                "error": str(pdf_error)
            }), 500

        # FINAL FILE CHECK
        if not os.path.isfile(
            pdf_path
        ):

            print(
                "❌ PDF FILE DOES NOT EXIST AFTER GENERATION"
            )

            return jsonify({

                "success": False,

                "message":
                    "PDF file could not be created",

                "path":
                    pdf_path

            }), 404

        # DOWNLOAD PDF
        print(
            "✅ Sending PDF to browser"
        )

        print(
            "File:",
            pdf_path
        )

        print(
            "=========================================="
        )

        return send_file(

            pdf_path,

            as_attachment=True,

            download_name=
                pdf_file_name,

            mimetype=
                "application/pdf"

        )

    except Exception as e:

        print(
            "=========================================="
        )

        print(
            "❌ PDF DOWNLOAD ERROR"
        )

        print(
            repr(e)
        )

        print(
            "=========================================="
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to download PDF report",

            "error":
                str(e)

        }), 500
