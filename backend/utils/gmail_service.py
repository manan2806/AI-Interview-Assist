import os
import json
import base64

from email.message import EmailMessage

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build


# ==========================================
# GMAIL API CONFIGURATION
# ==========================================

GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send"
]

GMAIL_TOKEN_FILE = "gmail_token.json"


# ==========================================
# GET GMAIL CREDENTIALS
# ==========================================

def get_gmail_credentials():

    try:

        # ------------------------------------------
        # PRODUCTION: Render Environment Variable
        # ------------------------------------------

        token_json = os.getenv(
            "GMAIL_TOKEN_JSON"
        )

        if token_json:

            token_data = json.loads(
                token_json
            )

            credentials = (
                Credentials.from_authorized_user_info(
                    token_data,
                    GMAIL_SCOPES
                )
            )

        # ------------------------------------------
        # LOCAL DEVELOPMENT
        # ------------------------------------------

        elif os.path.exists(
            GMAIL_TOKEN_FILE
        ):

            credentials = (
                Credentials.from_authorized_user_file(
                    GMAIL_TOKEN_FILE,
                    GMAIL_SCOPES
                )
            )

        else:

            raise FileNotFoundError(
                "gmail_token.json not found"
            )

        # ------------------------------------------
        # REFRESH EXPIRED TOKEN
        # ------------------------------------------

        if credentials.expired and credentials.refresh_token:

            credentials.refresh(
                Request()
            )

            # Save refreshed token locally
            if os.path.exists(
                GMAIL_TOKEN_FILE
            ):

                with open(
                    GMAIL_TOKEN_FILE,
                    "w"
                ) as token_file:

                    token_file.write(
                        credentials.to_json()
                    )

        return credentials

    except Exception as e:

        print(
            "❌ Gmail credentials error:",
            str(e)
        )

        raise


# ==========================================
# CREATE GMAIL SERVICE
# ==========================================

def get_gmail_service():

    credentials = get_gmail_credentials()

    service = build(
        "gmail",
        "v1",
        credentials=credentials
    )

    return service


# ==========================================
# SEND EMAIL
# ==========================================

def send_gmail_email(
    recipient_email,
    subject,
    body
):

    try:

        print(
            "📧 Gmail API: Preparing email..."
        )

        message = EmailMessage()

        message["To"] = recipient_email

        message["Subject"] = subject

        message.set_content(
            body
        )

        encoded_message = (
            base64.urlsafe_b64encode(
                message.as_bytes()
            )
            .decode()
        )

        gmail_service = (
            get_gmail_service()
        )

        result = (
            gmail_service
            .users()
            .messages()
            .send(
                userId="me",
                body={
                    "raw": encoded_message
                }
            )
            .execute()
        )

        print(
            "✅ Gmail API email sent successfully"
        )

        print(
            "📨 Gmail Message ID:",
            result.get("id")
        )

        return True

    except Exception as e:

        print(
            "❌ Gmail API email error:",
            str(e)
        )

        return False