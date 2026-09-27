from flask import Blueprint, request, jsonify , redirect , session
from flask_bcrypt import Bcrypt
import uuid
import os 
import secrets
import hashlib
import smtplib
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
from datetime import datetime, timedelta
from email.message import EmailMessage
from google_auth_oauthlib.flow import Flow
import database
from utils.auth_utils import generate_token

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()

# GMAIL API OAUTH CONFIGURATION

GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
GMAIL_CREDENTIALS_FILE = "gmail_oauth_credentials.json"
GMAIL_REDIRECT_URI = ("https://ai-interview-assist-backend.onrender.com" "/oauth2callback")

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
    Send password reset OTP through Gmail API.
    """

    # ==========================================
    # VALIDATION
    # ==========================================

    if not recipient_email:
        raise Exception(
            "Recipient email is missing."
        )

    if not otp:
        raise Exception(
            "OTP is missing."
        )

    # ==========================================
    # EMAIL DETAILS
    # ==========================================

    subject = (
        "AI Interview Assist - Password Reset OTP"
    )

    # ==========================================
    # EMAIL BODY
    # ==========================================

    body = f"""
Hello,

We received a request to reset your
AI Interview Assist account password.

Your OTP is:

{otp}

This OTP is valid for 10 minutes.

Please do not share this OTP with anyone.

If you did not request a password reset,
you can safely ignore this email.

Best Regards,
AI Interview Assist
"""

    # ==========================================
    # IMPORT GMAIL API SERVICE
    # ==========================================

    from utils.gmail_service import send_gmail_email

    # ==========================================
    # SEND EMAIL
    # ==========================================

    print(
        "=========================================="
    )

    print(
        "📧 Sending password reset OTP using Gmail API..."
    )

    print(
        f"RECIPIENT EMAIL: {recipient_email}"
    )

    print(
        "=========================================="
    )

    try:

        email_sent = send_gmail_email(
            recipient_email,
            subject,
            body
        )

        if not email_sent:

            print(
                "❌ Gmail API failed to send OTP email."
            )

            return False

        print(
            "=========================================="
        )

        print(
            "✅ OTP EMAIL SENT SUCCESSFULLY"
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
            "❌ GMAIL API OTP ERROR:",
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

        print("🚀 FORGOT PASSWORD: Calling Gmail SMTP send_otp_email()")
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

# ==========================================
# GMAIL OAUTH AUTHORIZATION
# ==========================================

@auth_bp.route("/gmail-authorize", methods=["GET"])
def gmail_authorize():

    try:

        if not os.path.exists(
            GMAIL_CREDENTIALS_FILE
        ):
            return jsonify({
                "success": False,
                "message": (
                    "gmail_oauth_credentials.json "
                    "not found"
                )
            }), 500

        flow = Flow.from_client_secrets_file(
            GMAIL_CREDENTIALS_FILE,
            scopes=GMAIL_SCOPES
        )

        flow.redirect_uri = (
            "http://localhost:5000/oauth2callback"
        )

        authorization_url, state = (
            flow.authorization_url(
                access_type="offline",
                include_granted_scopes="true",
                prompt="consent"
            )
        )

        # Save OAuth state
        session["gmail_oauth_state"] = state

        # Save PKCE code verifier
        session["gmail_code_verifier"] = (
            flow.code_verifier
        )

        return redirect(
            authorization_url
        )

    except Exception as e:

        print(
            "Gmail authorization error:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==========================================
# GMAIL OAUTH CALLBACK
# ==========================================

@auth_bp.route("/oauth2callback", methods=["GET"])
def oauth2callback():

    try:

        if not os.path.exists(
            GMAIL_CREDENTIALS_FILE
        ):
            return jsonify({
                "success": False,
                "message": (
                    "gmail_oauth_credentials.json "
                    "not found"
                )
            }), 500

        # Get saved OAuth state
        saved_state = session.get(
            "gmail_oauth_state"
        )

        # Get saved PKCE verifier
        code_verifier = session.get(
            "gmail_code_verifier"
        )

        if not saved_state:
            return jsonify({
                "success": False,
                "message": "OAuth state is missing"
            }), 400

        if not code_verifier:
            return jsonify({
                "success": False,
                "message": "OAuth code verifier is missing"
            }), 400

        flow = Flow.from_client_secrets_file(
            GMAIL_CREDENTIALS_FILE,
            scopes=GMAIL_SCOPES,
            state=saved_state
        )

        flow.redirect_uri = (
            "http://localhost:5000/oauth2callback"
        )

        # Restore PKCE verifier
        flow.code_verifier = code_verifier

        authorization_response = request.url

        flow.fetch_token(
            authorization_response=authorization_response
        )

        credentials = flow.credentials

        # Save Gmail token
        with open(
            "gmail_token.json",
            "w"
        ) as token_file:

            token_file.write(
                credentials.to_json()
            )

        # Remove temporary OAuth session data
        session.pop(
            "gmail_oauth_state",
            None
        )

        session.pop(
            "gmail_code_verifier",
            None
        )

        print(
            "=========================================="
        )

        print(
            "✅ GMAIL OAUTH AUTHORIZATION SUCCESSFUL"
        )

        print(
            "✅ gmail_token.json CREATED"
        )

        print(
            "=========================================="
        )

        return """
        <h2>Gmail Authorization Successful ✅</h2>
        <p>You can close this browser window.</p>
        """

    except Exception as e:

        print(
            "Gmail OAuth callback error:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500