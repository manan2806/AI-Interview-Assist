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

    # ACTIVITY LOGS INDEXES
    activity_logs.create_index([("user_id", 1), ("created_at", -1)])
    activity_logs.create_index([("created_at", -1)])
    activity_logs.create_index([("action", 1)])

    print("✅ MongoDB Connected Successfully!")
except Exception as e:

    print("❌ MongoDB Connection Error:", e)

    client = None
    db = None
    users = None
    interviews = None
    problem_reports = None
    activity_logs = None
