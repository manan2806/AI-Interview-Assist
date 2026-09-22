import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

try:
    client = MongoClient(MONGO_URI)

    # Check connection
    client.admin.command("ping")

    print("✅ MongoDB Connected Successfully!")

    db = client[DB_NAME]

    users = db["users"]
    interviews = db["interviews"]

except Exception as e:
    print("❌ MongoDB Connection Error:", e)
    db = None
    users = None
    interviews = None