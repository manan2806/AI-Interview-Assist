from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
import uuid
import os , resend
import secrets
import hashlib
# import smtplib
from datetime import datetime, timedelta
# from email.message import EmailMessage
import database
from utils.auth_utils import generate_token

auth_bp = Blueprint("auth", __name__)

bcrypt = Bcrypt()

# ==========================================
# USER REGISTER API
# ==========================================
@auth_bp.route("/api/register", methods=["POST"])
def register():

    try:
        # Get JSON safely
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "Please send valid JSON data"
            }), 400

        # GET DATA
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        # VALIDATION
        if not name or not email or not password:
            return jsonify({
                "success": False,
                "message": "Name, email and password are required"
            }), 400

        # CHECK DATABASE
        if database.db is None:
            return jsonify({
                "success": False,
                "message": "Database is not connected"
            }), 500

        users = database.db["users"]

        # CLEAN EMAIL
        email = email.strip().lower()

        # CHECK EXISTING USER
        existing_user = users.find_one({
            "email": email
        })

        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email already registered"
            }), 409

        # HASH PASSWORD
        hashed_password = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

        # CREATE USER
        user = {

            "user_id": "USR-" + str(uuid.uuid4())[:8].upper(),

            "name": name.strip(),

            "email": email,

            "password": hashed_password,

            "skills": [],

            "target_role": "",

            "experience_level": "Fresher"

        }

        # SAVE USER
        result = users.insert_one(user)

        # SUCCESS RESPONSE
        return jsonify({

            "success": True,

            "message": "User registered successfully 🎉",

            "user_id": user["user_id"],

            "mongo_id": str(result.inserted_id)

        }), 201

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


# ==========================================
# USER LOGIN API
# ==========================================
@auth_bp.route("/api/login", methods=["POST"])
def login():

    try:
        # GET JSON
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "Please send valid JSON data"
            }), 400

        # GET LOGIN DATA
        email = data.get("email")
        password = data.get("password")

        # VALIDATION
        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and password are required"
            }), 400

        print("🔍 LOGIN DATABASE OBJECT:", database.db)
        print("🔍 LOGIN DATABASE TYPE:", type(database.db))
        # CHECK DATABASE
        if database.db is None:
            return jsonify({
                "success": False,
                "message": "Database is not connected"
            }), 500

        users = database.db["users"]

        # FIND USER
        user = users.find_one({
            "email": email.strip().lower()
        })

        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        # VERIFY PASSWORD
        password_correct = bcrypt.check_password_hash(
            user["password"],
            password
        )

        if not password_correct:
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        # GENERATE JWT TOKEN
        token = generate_token(user)

        # LOGIN SUCCESS
        return jsonify({

            "success": True,

            "message": "Login successful 🎉",

            "token": token,

            "user": {

                "user_id": user["user_id"],

                "name": user["name"],

                "email": user["email"],

                "skills": user.get("skills", []),

                "target_role": user.get(
                    "target_role",
                    ""
                ),

                "experience_level": user.get(
                    "experience_level",
                    "Fresher"
                )
            }
        }), 200

    except Exception as e:

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500

# ==========================================
# SEND PASSWORD RESET OTP EMAIL
# ==========================================
def send_otp_email(
    recipient_email,
    otp
):
    """
    Send Forgot Password OTP through Resend API.
    """
    # RESEND CONFIGURATION
    resend_api_key = os.getenv(
        "RESEND_API_KEY"
    )

    sender_email = os.getenv(
        "RESEND_FROM_EMAIL"
    )

    # VALIDATION
    if not resend_api_key:
        print(
            "❌ RESEND_API_KEY is missing"
        )
        return False

    if not sender_email:
        print(
            "❌ RESEND_FROM_EMAIL is missing"
        )
        return False

    if not recipient_email:
        print(
            "❌ Recipient email is missing"
        )
        return False

    if not otp:
        print(
            "❌ OTP is missing"
        )
        return False

    # RESEND API KEY
    resend.api_key = resend_api_key

    # EMAIL SUBJECT
    subject = (
        "AI Interview Assist - Password Reset OTP"
    )

    # HTML EMAIL
    html_content = f"""
    <!DOCTYPE html>

    <html>

    <head>

        <meta charset="UTF-8">

        <title>
            Password Reset OTP
        </title>

    </head>

    <body
        style="
            margin:0;
            padding:0;
            background:#f5f5f5;
            font-family:Arial,Helvetica,sans-serif;
        "
    >

        <div
            style="
                max-width:600px;
                margin:40px auto;
                background:#ffffff;
                padding:35px;
                border-radius:12px;
                box-sizing:border-box;
            "
        >

            <h2
                style="
                    margin-top:0;
                    color:#4a148c;
                "
            >
                AI Interview Assist
            </h2>

            <p>
                Hello,
            </p>

            <p>
                We received a request to reset the
                password for your AI Interview Assist
                account.
            </p>

            <p>
                Your One-Time Password (OTP) is:
            </p>

            <div
                style="
                    margin:25px 0;
                    padding:20px;
                    background:#f7f3fa;
                    border-radius:10px;
                    text-align:center;
                "
            >

                <span
                    style="
                        font-size:32px;
                        font-weight:bold;
                        letter-spacing:8px;
                        color:#4a148c;
                    "
                >
                    {otp}
                </span>

            </div>

            <p>
                This OTP is valid for
                <strong>10 minutes</strong>.
            </p>

            <p>
                If you did not request a password reset,
                you can safely ignore this email.
            </p>

            <p>
                Best Regards,<br>
                <strong>
                    AI Interview Assist
                </strong>
            </p>

        </div>

    </body>

    </html>
    """

    # SEND EMAIL
    print(
        "=========================================="
    )

    print(
        "📧 Sending OTP email using Resend API..."
    )

    print(
        f"RECIPIENT EMAIL: {recipient_email}"
    )

    print(
        f"SENDER EMAIL: {sender_email}"
    )

    print(
        "=========================================="
    )

    try:

        response = resend.Emails.send(
            {
                "from": sender_email,

                "to": [
                    recipient_email
                ],

                "subject": subject,

                "html": html_content
            }
        )

        print(
            "=========================================="
        )

        print(
            "✅ OTP EMAIL SENT SUCCESSFULLY"
        )

        print(
            "RESEND RESPONSE:",
            response
        )

        print(
            "=========================================="
        )

        return True

    except Exception as error:

        print(
            "=========================================="
        )

        print(
            "❌ RESEND OTP EMAIL ERROR:",
            str(error)
        )

        print(
            "=========================================="
        )

        return False

# ==========================================
# FORGOT PASSWORD API
# ==========================================
@auth_bp.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "Please send valid JSON data"
            }), 400

        email = data.get("email")

        if not email:
            return jsonify({
                "success": False,
                "message": "Email is required"
            }), 400

        email = email.strip().lower()

        if database.db is None:
            return jsonify({
                "success": False,
                "message": "Database is not connected"
            }), 500

        users = database.db["users"]

        user = users.find_one({
            "email": email
        })

        if not user:
            return jsonify({
                "success": False,
                "message": "No account found with this email"
            }), 404

        otp = f"{secrets.randbelow(1000000):06d}"

        otp_hash = hashlib.sha256(
            otp.encode()
        ).hexdigest()

        otp_expiry = datetime.utcnow() + timedelta(minutes=10)

        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "reset_otp": otp_hash,
                    "reset_otp_expiry": otp_expiry,
                    "reset_otp_verified": False
                }
            }
        )

        print("🚀 FORGOT PASSWORD: Calling NEW Resend send_otp_email()")
        email_sent = send_otp_email(email, otp)
        print("🚀 FORGOT PASSWORD: send_otp_email returned:",email_sent)

        if not email_sent:
            users.update_one(
                {"_id": user["_id"]},
                {
                    "$unset": {
                        "reset_otp": "",
                        "reset_otp_expiry": ""
                    }
                }
            )

            return jsonify({
                "success": False,
                "message": "Unable to send OTP email"
            }), 500

        return jsonify({
            "success": True,
            "message": "OTP sent successfully to your email"
        }), 200

    except Exception as e:
        print("Forgot password error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# VERIFY OTP API
# ==========================================
@auth_bp.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "Please send valid JSON data"
            }), 400

        email = data.get("email")
        otp = data.get("otp")

        if not email or not otp:
            return jsonify({
                "success": False,
                "message": "Email and OTP are required"
            }), 400

        email = email.strip().lower()
        otp = otp.strip()

        if database.db is None:
            return jsonify({
                "success": False,
                "message": "Database is not connected"
            }), 500

        users = database.db["users"]

        user = users.find_one({
            "email": email
        })

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        stored_otp = user.get("reset_otp")
        otp_expiry = user.get("reset_otp_expiry")

        if not stored_otp or not otp_expiry:
            return jsonify({
                "success": False,
                "message": "OTP not found. Please request a new OTP"
            }), 400

        if datetime.utcnow() > otp_expiry:
            users.update_one(
                {"_id": user["_id"]},
                {
                    "$unset": {
                        "reset_otp": "",
                        "reset_otp_expiry": ""
                    }
                }
            )

            return jsonify({
                "success": False,
                "message": "OTP has expired"
            }), 400

        entered_otp_hash = hashlib.sha256(
            otp.encode()
        ).hexdigest()

        if entered_otp_hash != stored_otp:
            return jsonify({
                "success": False,
                "message": "Invalid OTP"
            }), 400

        reset_token = secrets.token_urlsafe(32)

        reset_token_hash = hashlib.sha256(
            reset_token.encode()
        ).hexdigest()

        reset_token_expiry = datetime.utcnow() + timedelta(minutes=10)

        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "reset_otp_verified": True,
                    "reset_token": reset_token_hash,
                    "reset_token_expiry": reset_token_expiry
                },
                "$unset": {
                    "reset_otp": "",
                    "reset_otp_expiry": ""
                }
            }
        )

        return jsonify({
            "success": True,
            "message": "OTP verified successfully",
            "reset_token": reset_token
        }), 200

    except Exception as e:
        print("OTP verification error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# RESET PASSWORD API
# ==========================================
@auth_bp.route("/api/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "Please send valid JSON data"
            }), 400

        email = data.get("email")
        reset_token = data.get("reset_token")
        new_password = data.get("new_password")

        if not email or not reset_token or not new_password:
            return jsonify({
                "success": False,
                "message": "Email, reset token and new password are required"
            }), 400

        email = email.strip().lower()

        if len(new_password) < 6:
            return jsonify({
                "success": False,
                "message": "Password must be at least 6 characters"
            }), 400

        if database.db is None:
            return jsonify({
                "success": False,
                "message": "Database is not connected"
            }), 500

        users = database.db["users"]

        user = users.find_one({
            "email": email
        })

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        stored_token = user.get("reset_token")
        token_expiry = user.get("reset_token_expiry")
        otp_verified = user.get("reset_otp_verified", False)

        if not stored_token or not token_expiry or not otp_verified:
            return jsonify({
                "success": False,
                "message": "Password reset is not authorized"
            }), 400

        if datetime.utcnow() > token_expiry:
            users.update_one(
                {"_id": user["_id"]},
                {
                    "$unset": {
                        "reset_token": "",
                        "reset_token_expiry": "",
                        "reset_otp_verified": ""
                    }
                }
            )

            return jsonify({
                "success": False,
                "message": "Reset session has expired"
            }), 400

        token_hash = hashlib.sha256(
            reset_token.encode()
        ).hexdigest()

        if token_hash != stored_token:
            return jsonify({
                "success": False,
                "message": "Invalid reset token"
            }), 400

        hashed_password = bcrypt.generate_password_hash(
            new_password
        ).decode("utf-8")

        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password": hashed_password
                },
                "$unset": {
                    "reset_token": "",
                    "reset_token_expiry": "",
                    "reset_otp_verified": ""
                }
            }
        )

        return jsonify({
            "success": True,
            "message": "Password reset successfully 🎉"
        }), 200

    except Exception as e:
        print("Reset password error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
