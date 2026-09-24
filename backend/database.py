import os
from pymongo import MongoClient
from dotenv import load_dotenv

# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

# ==========================================
# DEFAULT VALUES
# ==========================================

client = None
db = None
users = None
interviews = None


# ==========================================
# MONGODB CONNECTION
# ==========================================

try:

    if not MONGO_URI:
        raise Exception("MONGO_URI is missing")

    if not DB_NAME:
        raise Exception("DB_NAME is missing")

    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=10000
    )

    # Test connection
    client.admin.command("ping")

    # Select database
    db = client[DB_NAME]

    # Collections
    users = db["users"]
    interviews = db["interviews"]

    print("✅ MongoDB Connected Successfully!")

except Exception as e:

    print("❌ MongoDB Connection Error:", e)

    client = None
    db = None
    users = None
    interviews = None