from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send"
]

CREDENTIALS_FILE = "gmail_oauth_credentials.json"
TOKEN_FILE = "gmail_token.json"


flow = InstalledAppFlow.from_client_secrets_file(
    CREDENTIALS_FILE,
    SCOPES
)

credentials = flow.run_local_server(
    port=0,
    access_type="offline",
    prompt="consent"
)

with open(TOKEN_FILE, "w") as token_file:
    token_file.write(credentials.to_json())

print("==========================================")
print("✅ NEW GMAIL TOKEN GENERATED")
print("✅ Saved as:", TOKEN_FILE)
print("==========================================")