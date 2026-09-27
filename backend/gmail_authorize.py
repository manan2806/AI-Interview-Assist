import os
import secrets

from flask import redirect
from google_auth_oauthlib.flow import Flow


SCOPES = [
    "https://www.googleapis.com/auth/gmail.send"
]

CREDENTIALS_FILE = "gmail_oauth_credentials.json"

REDIRECT_URI = (
    "https://ai-interview-assist-backend.onrender.com"
    "/oauth2callback"
)


def create_google_flow():

    flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE,
        scopes=SCOPES
    )

    flow.redirect_uri = REDIRECT_URI

    return flow


if __name__ == "__main__":

    flow = create_google_flow()

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=secrets.token_urlsafe(32)
    )

    print()
    print("==========================================")
    print("Google Authorization URL:")
    print()
    print(authorization_url)
    print()
    print("==========================================")