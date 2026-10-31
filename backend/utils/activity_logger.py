from datetime import datetime
from flask import request
from database import db
import logging, random


def log_activity(
    user_id,
    action,
    description,
    user_name="",
    user_email="",
    role="user",
    metadata=None,
):
    try:
        if db is None:
            return

        activity_collection = db["activity_logs"]

        log_id = "LOG-" + str(random.randint(100000, 999999))

        activity_collection.insert_one(
            {
                "log_id": log_id,
                "user_id": user_id,
                "user_name": user_name,
                "user_email": user_email,
                "role": role,
                "action": action,
                "description": description,
                "ip_address": request.headers.get(
                    "X-Forwarded-For", request.remote_addr
                ),
                "created_at": datetime.utcnow(),
                "metadata": metadata or {},
            }
        )

    except Exception:
        logging.exception("Activity log save failed")
