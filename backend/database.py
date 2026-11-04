import os
from pymongo import MongoClient
from dotenv import load_dotenv

# LOAD ENVIRONMENT VARIABLES
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# DEFAULT VALUES
client = None
db = None
users = None
interviews = None
problem_reports = None
activity_logs = None
coding_interviews = None

# MONGODB CONNECTION
try:
    if not MONGO_URI:
        raise Exception("MONGO_URI is missing")

    if not DB_NAME:
        raise Exception("DB_NAME is missing")

    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)

    # Test connection
    client.admin.command("ping")

    # Select database
    db = client[DB_NAME]

    # COLLECTIONS
    users = db["users"]
    interviews = db["interviews"]
    problem_reports = db["problem_reports"]
    activity_logs = db["activity_logs"]
    coding_interviews = db["coding_interviews"]

    # ACTIVITY LOGS INDEXES
    activity_logs.create_index([("user_id", 1), ("created_at", -1)])
    activity_logs.create_index([("created_at", -1)])
    activity_logs.create_index([("action", 1)])

    # CODING INTERVIEW INDEXES
    coding_interviews.create_index([("user_id", 1), ("created_at", -1)])
    coding_interviews.create_index([("coding_interview_id", 1)], unique=True)
    coding_interviews.create_index([("status", 1)])

    print("✅ MongoDB Connected Successfully!")
except Exception as e:

    print("❌ MongoDB Connection Error:", e)

    client = None
    db = None
    users = None
    interviews = None
    problem_reports = None
    activity_logs = None
    coding_interviews = None
