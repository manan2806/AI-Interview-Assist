from flask import Blueprint, request, jsonify, redirect, session
from flask_bcrypt import Bcrypt
import uuid
import os
import secrets
import hashlib
from flask_jwt_extended import jwt_required, get_jwt_identity

os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
from datetime import datetime, timedelta
from email.message import EmailMessage
from google_auth_oauthlib.flow import Flow
import database
import base64
from utils.auth_utils import generate_token
from utils.gmail_service import get_gmail_service

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

# GMAIL API OAUTH CONFIGURATION
GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
GMAIL_CREDENTIALS_FILE = "gmail_oauth_credentials.json"
GMAIL_REDIRECT_URI = (
    "https://ai-interview-assist-backend.onrender.com" "/oauth2callback"
)


# ==========================================
# USER REGISTER API
# ==========================================
@auth_bp.route("/api/register", methods=["POST"])
def register():

    try:
        # Get JSON safely
        data = request.get_json(silent=True)

        if not data:
            return (
                jsonify({"success": False, "message": "Please send valid JSON data"}),
                400,
            )

        # GET DATA
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        # VALIDATION
        if not name or not email or not password:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Name, email and password are required",
                    }
                ),
                400,
            )

        # CHECK DATABASE
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected"}),
                500,
            )

        users = database.db["users"]

        # CLEAN EMAIL
        email = email.strip().lower()

        # CHECK EXISTING USER
        existing_user = users.find_one({"email": email})

        if existing_user:
            return (
                jsonify({"success": False, "message": "Email already registered"}),
                409,
            )

        # HASH PASSWORD
        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

        # CREATE USER
        user = {
            "user_id": "USR-" + str(uuid.uuid4())[:8].upper(),
            "name": name.strip(),
            "email": email,
            "password": hashed_password,
            "skills": [],
            "target_role": "",
            "experience_level": "Fresher",
        }

        # SAVE USER
        result = users.insert_one(user)

        # SUCCESS RESPONSE
        return (
            jsonify(
                {
                    "success": True,
                    "message": "User registered successfully 🎉",
                    "user_id": user["user_id"],
                    "mongo_id": str(result.inserted_id),
                }
            ),
            201,
        )

    except Exception as e:

        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# USER LOGIN API
# ==========================================
@auth_bp.route("/api/login", methods=["POST"])
def login():

    try:
        # GET JSON
        data = request.get_json(silent=True)

        if not data:
            return (
                jsonify({"success": False, "message": "Please send valid JSON data"}),
                400,
            )

        # GET LOGIN DATA
        email = data.get("email")
        password = data.get("password")

        # VALIDATION
        if not email or not password:
            return (
                jsonify(
                    {"success": False, "message": "Email and password are required"}
                ),
                400,
            )

        print("🔍 LOGIN DATABASE OBJECT:", database.db)
        print("🔍 LOGIN DATABASE TYPE:", type(database.db))
        # CHECK DATABASE
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected"}),
                500,
            )

        users = database.db["users"]

        # FIND USER
        user = users.find_one({"email": email.strip().lower()})

        if not user:
            return (
                jsonify({"success": False, "message": "Invalid email or password"}),
                401,
            )

        # VERIFY PASSWORD
        password_correct = bcrypt.check_password_hash(user["password"], password)

        if not password_correct:
            return (
                jsonify({"success": False, "message": "Invalid email or password"}),
                401,
            )

        # GENERATE JWT TOKEN
        token = generate_token(user)

        # LOGIN SUCCESS
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Login successful 🎉",
                    "token": token,
                    "user": {
                        "user_id": user["user_id"],
                        "name": user["name"],
                        "email": user["email"],
                        "skills": user.get("skills", []),
                        "target_role": user.get("target_role", ""),
                        "experience_level": user.get("experience_level", "Fresher"),
                    },
                }
            ),
            200,
        )

    except Exception as e:

        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# SEND PASSWORD RESET OTP EMAIL
# ==========================================
def send_otp_email(recipient_email, otp):

    # VALIDATION
    if not recipient_email:
        raise Exception("Recipient email is missing.")

    if not otp:
        raise Exception("OTP is missing.")

    # EMAIL DETAILS
    subject = "AI Interview Assist - Password Reset OTP"

    # ==========================================
    # PROFESSIONAL HTML EMAIL
    # ==========================================
    html_body = f"""
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>AI Interview Assist - Password Reset</title>
</head>

<body
    style="
        margin:0;
        padding:0;
        background-color:#f5f3f8;
        font-family:Arial,Helvetica,sans-serif;
    "
>

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        width:100%;
        background-color:#f5f3f8;
        padding:40px 15px;
    "
>
    <tr>
        <td align="center">

            <!-- MAIN CARD -->

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                    max-width:560px;
                    background-color:#ffffff;
                    border-radius:16px;
                    overflow:hidden;
                "
            >

                <!-- HEADER -->

                <tr>
                    <td
                        align="center"
                        style="
                            background-color:#4a148c;
                            padding:32px 25px;
                        "
                    >

                        <div
                            style="
                                width:60px;
                                height:60px;
                                line-height:60px;
                                background-color:#ffffff;
                                border-radius:50%;
                                color:#4a148c;
                                font-size:24px;
                                font-weight:bold;
                                margin:0 auto 15px auto;
                            "
                        >
                            AI
                        </div>

                        <h1
                            style="
                                margin:0;
                                color:#ffffff;
                                font-size:24px;
                                font-weight:700;
                                line-height:1.3;
                            "
                        >
                            AI Interview Assist
                        </h1>

                        <p
                            style="
                                margin:8px 0 0 0;
                                color:#e9dff2;
                                font-size:14px;
                                line-height:1.5;
                            "
                        >
                            Password Reset Verification
                        </p>

                    </td>
                </tr>

                <!-- CONTENT -->

                <tr>
                    <td
                        style="
                            padding:35px;
                        "
                    >

                        <h2
                            style="
                                margin:0 0 18px 0;
                                color:#333333;
                                font-size:22px;
                                font-weight:700;
                            "
                        >
                            Reset Your Password
                        </h2>

                        <p
                            style="
                                margin:0 0 15px 0;
                                color:#555555;
                                font-size:15px;
                                line-height:1.7;
                            "
                        >
                            Hello,
                        </p>

                        <p
                            style="
                                margin:0 0 22px 0;
                                color:#555555;
                                font-size:15px;
                                line-height:1.7;
                            "
                        >
                            We received a request to reset the password
                            for your
                            <strong>AI Interview Assist</strong>
                            account.
                        </p>

                        <!-- OTP LABEL -->

                        <p
                            align="center"
                            style="
                                margin:0 0 10px 0;
                                color:#666666;
                                font-size:14px;
                                line-height:1.5;
                            "
                        >
                            Your One-Time Password (OTP) is
                        </p>

                        <!-- OTP BOX -->

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                                margin:15px 0 20px 0;
                            "
                        >
                            <tr>
                                <td
                                    align="center"
                                    style="
                                        background-color:#f7f1fb;
                                        border:2px solid #e1cfee;
                                        border-radius:12px;
                                        padding:24px 15px;
                                    "
                                >

                                    <div
                                        style="
                                            color:#4a148c;
                                            font-size:36px;
                                            font-weight:700;
                                            letter-spacing:8px;
                                            line-height:1.2;
                                        "
                                    >
                                        {otp}
                                    </div>

                                </td>
                            </tr>
                        </table>

                        <!-- OTP EXPIRY -->

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                                margin:0 0 25px 0;
                            "
                        >
                            <tr>
                                <td
                                    align="center"
                                    style="
                                        background-color:#fff8e8;
                                        border-radius:8px;
                                        padding:13px;
                                        color:#8a6500;
                                        font-size:13px;
                                        line-height:1.5;
                                    "
                                >

                                    <strong>⏱ OTP Validity:</strong>

                                    This OTP is valid for
                                    <strong>10 minutes</strong>.

                                </td>
                            </tr>
                        </table>

                        <!-- INSTRUCTIONS -->

                        <p
                            style="
                                margin:0 0 15px 0;
                                color:#555555;
                                font-size:14px;
                                line-height:1.7;
                            "
                        >
                            Enter this OTP on the password reset
                            page to verify your identity and
                            continue resetting your password.
                        </p>

                        <!-- SECURITY MESSAGE -->

                        <table
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                                margin:20px 0 0 0;
                            "
                        >
                            <tr>
                                <td
                                    style="
                                        background-color:#f8f8f8;
                                        border-left:4px solid #4a148c;
                                        padding:14px 16px;
                                        color:#666666;
                                        font-size:13px;
                                        line-height:1.7;
                                    "
                                >

                                    <strong style="color:#333333;">
                                        Security Reminder
                                    </strong>

                                    <br>

                                    Never share this OTP with anyone.
                                    The AI Interview Assist team will
                                    never ask you to share your OTP.

                                </td>
                            </tr>
                        </table>

                        <!-- UNREQUESTED RESET MESSAGE -->

                        <p
                            style="
                                margin:22px 0 0 0;
                                color:#777777;
                                font-size:13px;
                                line-height:1.7;
                            "
                        >
                            If you did not request a password reset,
                            you can safely ignore this email.
                            Your account will remain secure.
                        </p>

                        <!-- SIGNATURE -->

                        <p
                            style="
                                margin:28px 0 0 0;
                                color:#555555;
                                font-size:14px;
                                line-height:1.6;
                            "
                        >
                            Best Regards,<br>

                            <strong style="color:#4a148c;">
                                AI Interview Assist Team
                            </strong>
                        </p>

                    </td>
                </tr>

                <!-- FOOTER -->

                <tr>
                    <td
                        align="center"
                        style="
                            background-color:#fafafa;
                            border-top:1px solid #eeeeee;
                            padding:20px 25px;
                        "
                    >

                        <p
                            style="
                                margin:0 0 7px 0;
                                color:#777777;
                                font-size:12px;
                                line-height:1.5;
                            "
                        >
                            AI Interview Assist
                        </p>

                        <p
                            style="
                                margin:0;
                                color:#999999;
                                font-size:11px;
                                line-height:1.5;
                            "
                        >
                            This is an automated email.
                            Please do not reply to this message.
                        </p>

                    </td>
                </tr>

            </table>

        </td>
    </tr>
</table>

</body>
</html>
"""

    # CREATE HTML EMAIL
    message = EmailMessage()

    message["To"] = recipient_email
    message["Subject"] = subject

    # HTML ONLY
    message.set_content(html_body, subtype="html")

    # GMAIL API SEND
    print("==========================================")
    print("📧 Sending password reset OTP using Gmail API...")
    print(f"RECIPIENT EMAIL: {recipient_email}")
    print("==========================================")

    try:

        gmail_service = get_gmail_service()

        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        result = (
            gmail_service.users()
            .messages()
            .send(userId="me", body={"raw": encoded_message})
            .execute()
        )

        print("==========================================")
        print("✅ OTP EMAIL SENT SUCCESSFULLY")
        print("📨 Gmail Message ID:", result.get("id"))
        print("==========================================")

        return True

    except Exception as error:

        print("==========================================")
        print("❌ GMAIL API OTP ERROR:", str(error))
        print("==========================================")

        return False


# ==========================================
# FORGOT PASSWORD API
# ==========================================
@auth_bp.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json(silent=True)

        if not data:
            return (
                jsonify({"success": False, "message": "Please send valid JSON data"}),
                400,
            )

        email = data.get("email")

        if not email:
            return jsonify({"success": False, "message": "Email is required"}), 400

        email = email.strip().lower()

        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected"}),
                500,
            )

        users = database.db["users"]

        user = users.find_one({"email": email})

        if not user:
            return (
                jsonify(
                    {"success": False, "message": "No account found with this email"}
                ),
                404,
            )

        otp = f"{secrets.randbelow(1000000):06d}"

        otp_hash = hashlib.sha256(otp.encode()).hexdigest()

        otp_expiry = datetime.utcnow() + timedelta(minutes=10)

        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "reset_otp": otp_hash,
                    "reset_otp_expiry": otp_expiry,
                    "reset_otp_verified": False,
                }
            },
        )

        print("🚀 FORGOT PASSWORD: Calling Gmail SMTP send_otp_email()")
        email_sent = send_otp_email(email, otp)
        print("🚀 FORGOT PASSWORD: send_otp_email returned:", email_sent)

        if not email_sent:
            users.update_one(
                {"_id": user["_id"]},
                {"$unset": {"reset_otp": "", "reset_otp_expiry": ""}},
            )

            return (
                jsonify({"success": False, "message": "Unable to send OTP email"}),
                500,
            )

        return (
            jsonify(
                {"success": True, "message": "OTP sent successfully to your email"}
            ),
            200,
        )

    except Exception as e:
        print("Forgot password error:", e)

        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# VERIFY OTP API
# ==========================================
@auth_bp.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json(silent=True)

        if not data:
            return (
                jsonify({"success": False, "message": "Please send valid JSON data"}),
                400,
            )

        email = data.get("email")
        otp = data.get("otp")

        if not email or not otp:
            return (
                jsonify({"success": False, "message": "Email and OTP are required"}),
                400,
            )

        email = email.strip().lower()
        otp = otp.strip()

        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected"}),
                500,
            )

        users = database.db["users"]

        user = users.find_one({"email": email})

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        stored_otp = user.get("reset_otp")
        otp_expiry = user.get("reset_otp_expiry")

        if not stored_otp or not otp_expiry:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "OTP not found. Please request a new OTP",
                    }
                ),
                400,
            )

        if datetime.utcnow() > otp_expiry:
            users.update_one(
                {"_id": user["_id"]},
                {"$unset": {"reset_otp": "", "reset_otp_expiry": ""}},
            )

            return jsonify({"success": False, "message": "OTP has expired"}), 400

        entered_otp_hash = hashlib.sha256(otp.encode()).hexdigest()

        if entered_otp_hash != stored_otp:
            return jsonify({"success": False, "message": "Invalid OTP"}), 400

        reset_token = secrets.token_urlsafe(32)

        reset_token_hash = hashlib.sha256(reset_token.encode()).hexdigest()

        reset_token_expiry = datetime.utcnow() + timedelta(minutes=10)

        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "reset_otp_verified": True,
                    "reset_token": reset_token_hash,
                    "reset_token_expiry": reset_token_expiry,
                },
                "$unset": {"reset_otp": "", "reset_otp_expiry": ""},
            },
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "OTP verified successfully",
                    "reset_token": reset_token,
                }
            ),
            200,
        )

    except Exception as e:
        print("OTP verification error:", e)

        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# RESET PASSWORD API
# ==========================================
@auth_bp.route("/api/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json(silent=True)

        if not data:
            return (
                jsonify({"success": False, "message": "Please send valid JSON data"}),
                400,
            )

        email = data.get("email")
        reset_token = data.get("reset_token")
        new_password = data.get("new_password")

        if not email or not reset_token or not new_password:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Email, reset token and new password are required",
                    }
                ),
                400,
            )

        email = email.strip().lower()

        if len(new_password) < 6:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Password must be at least 6 characters",
                    }
                ),
                400,
            )

        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected"}),
                500,
            )

        users = database.db["users"]

        user = users.find_one({"email": email})

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        stored_token = user.get("reset_token")
        token_expiry = user.get("reset_token_expiry")
        otp_verified = user.get("reset_otp_verified", False)

        if not stored_token or not token_expiry or not otp_verified:
            return (
                jsonify(
                    {"success": False, "message": "Password reset is not authorized"}
                ),
                400,
            )

        if datetime.utcnow() > token_expiry:
            users.update_one(
                {"_id": user["_id"]},
                {
                    "$unset": {
                        "reset_token": "",
                        "reset_token_expiry": "",
                        "reset_otp_verified": "",
                    }
                },
            )

            return (
                jsonify({"success": False, "message": "Reset session has expired"}),
                400,
            )

        token_hash = hashlib.sha256(reset_token.encode()).hexdigest()

        if token_hash != stored_token:
            return jsonify({"success": False, "message": "Invalid reset token"}), 400

        hashed_password = bcrypt.generate_password_hash(new_password).decode("utf-8")

        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password": hashed_password},
                "$unset": {
                    "reset_token": "",
                    "reset_token_expiry": "",
                    "reset_otp_verified": "",
                },
            },
        )

        return (
            jsonify({"success": True, "message": "Password reset successfully 🎉"}),
            200,
        )

    except Exception as e:
        print("Reset password error:", e)

        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# GET USER SETTINGS API
# ==========================================
@auth_bp.route("/api/settings", methods=["GET"])
@jwt_required()
def get_settings():

    try:
        user_id = get_jwt_identity()
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected"}),
                500,
            )

        users = database.db["users"]
        user = users.find_one({"user_id": user_id})
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        settings = user.get("settings", {})
        return (
            jsonify(
                {
                    "success": True,
                    "settings": {
                        "interview_type": settings.get("interview_type", "Technical"),
                        "difficulty": settings.get("difficulty", "Medium"),
                        "number_of_questions": settings.get("number_of_questions", 10),
                        "theme": settings.get("theme", "Light"),
                    },
                }
            ),
            200,
        )

    except Exception as e:
        print("Get settings error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# UPDATE USER SETTINGS API
# ==========================================
@auth_bp.route("/api/settings", methods=["PUT"])
@jwt_required()
def update_settings():
    try:
        user_id = get_jwt_identity()
        data = request.get_json(silent=True)

        if not data:
            return (
                jsonify({"success": False, "message": "Please send valid JSON data"}),
                400,
            )

        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected"}),
                500,
            )

        # GET SETTINGS
        interview_type = data.get("interview_type", "Technical")
        difficulty = data.get("difficulty", "Medium")
        number_of_questions = data.get("number_of_questions", 10)
        theme = data.get("theme", "Light")

        # VALIDATION
        allowed_interview_types = ["Technical", "HR", "Mixed"]
        allowed_difficulties = ["Easy", "Medium", "Hard"]
        allowed_themes = ["Light", "Dark", "System"]

        if interview_type not in allowed_interview_types:
            return jsonify({"success": False, "message": "Invalid interview type"}), 400

        if difficulty not in allowed_difficulties:
            return jsonify({"success": False, "message": "Invalid difficulty"}), 400

        if theme not in allowed_themes:
            return jsonify({"success": False, "message": "Invalid theme"}), 400

        try:
            number_of_questions = int(number_of_questions)
        except (TypeError, ValueError):
            return (
                jsonify({"success": False, "message": "Invalid number of questions"}),
                400,
            )
        if number_of_questions not in [5, 10, 15, 20]:
            return (
                jsonify({"success": False, "message": "Invalid number of questions"}),
                400,
            )

        # UPDATE USER
        users = database.db["users"]
        result = users.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "settings": {
                        "interview_type": interview_type,
                        "difficulty": difficulty,
                        "number_of_questions": number_of_questions,
                        "theme": theme,
                    }
                }
            },
        )

        if result.matched_count == 0:
            return jsonify({"success": False, "message": "User not found"}), 404

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Settings saved successfully",
                    "settings": {
                        "interview_type": interview_type,
                        "difficulty": difficulty,
                        "number_of_questions": number_of_questions,
                        "theme": theme,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        print("Update settings error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# GMAIL OAUTH AUTHORIZATION
# ==========================================
@auth_bp.route("/gmail-authorize", methods=["GET"])
def gmail_authorize():

    try:

        if not os.path.exists(GMAIL_CREDENTIALS_FILE):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": ("gmail_oauth_credentials.json " "not found"),
                    }
                ),
                500,
            )

        flow = Flow.from_client_secrets_file(
            GMAIL_CREDENTIALS_FILE, scopes=GMAIL_SCOPES
        )

        flow.redirect_uri = "http://localhost:5000/oauth2callback"

        authorization_url, state = flow.authorization_url(
            access_type="offline", include_granted_scopes="true", prompt="consent"
        )

        # Save OAuth state
        session["gmail_oauth_state"] = state

        # Save PKCE code verifier
        session["gmail_code_verifier"] = flow.code_verifier

        return redirect(authorization_url)

    except Exception as e:

        print("Gmail authorization error:", str(e))

        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# GMAIL OAUTH CALLBACK
# ==========================================
@auth_bp.route("/oauth2callback", methods=["GET"])
def oauth2callback():

    try:

        if not os.path.exists(GMAIL_CREDENTIALS_FILE):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": ("gmail_oauth_credentials.json " "not found"),
                    }
                ),
                500,
            )

        # Get saved OAuth state
        saved_state = session.get("gmail_oauth_state")

        # Get saved PKCE verifier
        code_verifier = session.get("gmail_code_verifier")

        if not saved_state:
            return jsonify({"success": False, "message": "OAuth state is missing"}), 400

        if not code_verifier:
            return (
                jsonify(
                    {"success": False, "message": "OAuth code verifier is missing"}
                ),
                400,
            )

        flow = Flow.from_client_secrets_file(
            GMAIL_CREDENTIALS_FILE, scopes=GMAIL_SCOPES, state=saved_state
        )

        flow.redirect_uri = "http://localhost:5000/oauth2callback"
        # flow.redirect_uri = (
        #     "https://ai-interview-assist-backend.onrender.com"
        #     "/oauth2callback"
        # )

        # Restore PKCE verifier
        flow.code_verifier = code_verifier

        authorization_response = request.url

        flow.fetch_token(authorization_response=authorization_response)

        credentials = flow.credentials

        # Save Gmail token
        with open("gmail_token.json", "w") as token_file:

            token_file.write(credentials.to_json())

        # Remove temporary OAuth session data
        session.pop("gmail_oauth_state", None)

        session.pop("gmail_code_verifier", None)

        print("==========================================")

        print("✅ GMAIL OAUTH AUTHORIZATION SUCCESSFUL")

        print("✅ gmail_token.json CREATED")

        print("==========================================")

        return """
        <h2>Gmail Authorization Successful ✅</h2>
        <p>You can close this browser window.</p>
        """

    except Exception as e:
        print("Gmail OAuth callback error:", str(e))
        return jsonify({"success": False, "message": str(e)}), 500


# ==========================================
# CHANGE PASSWORD
# ==========================================
@auth_bp.route("/api/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    try:
        user_id = get_jwt_identity()

        data = request.get_json(silent=True)

        if not data:
            return (
                jsonify({"success": False, "message": "Please send valid JSON data."}),
                400,
            )

        current_password = data.get("current_password", "").strip()
        new_password = data.get("new_password", "").strip()
        confirm_password = data.get("confirm_password", "").strip()

        # Required fields
        if not current_password or not new_password or not confirm_password:
            return (
                jsonify(
                    {"success": False, "message": "All password fields are required."}
                ),
                400,
            )

        # Confirm password
        if new_password != confirm_password:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "New password and confirm password do not match.",
                    }
                ),
                400,
            )

        # Minimum password length
        if len(new_password) < 6:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "New password must be at least 6 characters.",
                    }
                ),
                400,
            )

        # Same password check
        if current_password == new_password:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "New password must be different from current password.",
                    }
                ),
                400,
            )

        # Database check
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        users = database.db["users"]

        # Find logged-in user
        user = users.find_one({"user_id": user_id})

        if not user:
            return jsonify({"success": False, "message": "User not found."}), 404

        # Check current password
        stored_password = user.get("password", "")

        if not stored_password:
            return (
                jsonify(
                    {"success": False, "message": "Password information not found."}
                ),
                500,
            )

        if not bcrypt.check_password_hash(stored_password, current_password):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "The current password you entered is incorrect.",
                    }
                ),
                400,
            )

        # Generate new password hash
        hashed_password = bcrypt.generate_password_hash(new_password).decode("utf-8")

        # Update password
        result = users.update_one(
            {"user_id": user_id}, {"$set": {"password": hashed_password}}
        )

        if result.modified_count == 0:
            return (
                jsonify(
                    {"success": False, "message": "Password could not be updated."}
                ),
                500,
            )

        return (
            jsonify({"success": True, "message": "Password changed successfully."}),
            200,
        )

    except Exception as e:
        print("Change password error:", repr(e))

        return jsonify({"success": False, "message": "Unable to change password."}), 500


# ==========================================
# CHANGE PASSWORD
# ==========================================
@auth_bp.route("/api/delete-account", methods=["DELETE"])
@jwt_required()
def delete_account():
    try:
        user_id = get_jwt_identity()
        data = request.get_json(silent=True)

        if not data:
            return (
                jsonify({"success": False, "message": "Please send valid JSON data."}),
                400,
            )

        current_password = data.get("current_password", "").strip()

        if not current_password:
            return (
                jsonify({"success": False, "message": "Current password is required."}),
                400,
            )

        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        users = database.db["users"]
        interviews = database.db["interviews"]
        problem_reports = database.db["problem_reports"]

        # Find user
        user = users.find_one({"user_id": user_id})

        if not user:
            return jsonify({"success": False, "message": "User not found."}), 404

        # Get stored password
        stored_password = user.get("password", "")

        if not stored_password:
            return (
                jsonify(
                    {"success": False, "message": "Password information not found."}
                ),
                500,
            )

        # Verify current password
        if not bcrypt.check_password_hash(stored_password, current_password):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "The current password you entered is incorrect.",
                    }
                ),
                400,
            )

        # Delete all interviews belonging to this user
        interview_delete_result = interviews.delete_many({"user_id": user_id})

        # Delete all problem report belonging to this user
        problem_report_delete_result = problem_reports.delete_many({"user_id": user_id})

        # Delete user account
        user_delete_result = users.delete_one({"user_id": user_id})

        if user_delete_result.deleted_count == 0:
            return (
                jsonify({"success": False, "message": "Account could not be deleted."}),
                500,
            )

        print(
            f"Account deleted successfully: {user_id} | "
            f"Interviews deleted: {interview_delete_result.deleted_count} | "
            f"Problem reports deleted: {problem_report_delete_result.deleted_count}"
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Account, interviews, and associated problem reports deleted successfully.",
                }
            ),
            200,
        )

    except Exception as e:
        print("Delete account error:", repr(e))

        return jsonify({"success": False, "message": "Unable to delete account."}), 500
