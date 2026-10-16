from flask import Blueprint, jsonify
from database import db
import logging
from utils.auth_utils import admin_required

admin_bp = Blueprint("admin", __name__)


# ==================================
# ADMIN DASHBOARD STATISTICS
# ==================================
@admin_bp.route("/api/admin/stats", methods=["GET"])
@admin_required
def admin_stats(current_user):
    try:
        if db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        users = db["users"]
        interviews = db["interviews"]

        stats = {
            "total_users": users.count_documents({}),
            "total_interviews": interviews.count_documents({}),
            "completed_interviews": interviews.count_documents({"status": "completed"}),
            "pending_evaluations": interviews.count_documents(
                {"status": "evaluation_pending"}
            ),
            "in_progress_interviews": interviews.count_documents(
                {"status": "in_progress"}
            ),
        }

        return jsonify({"success": True, "stats": stats}), 200

    except Exception:
        logging.exception("Admin stats API error")

        return (
            jsonify({"success": False, "message": "Unable to fetch admin statistics."}),
            500,
        )


# ==================================
# ADMIN USER MANAGEMENT - LIST USERS
# ==================================
@admin_bp.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_get_users(current_user):
    try:
        if db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        users_collection = db["users"]

        users = list(
            users_collection.find(
                {"role": {"$ne": "admin"}},
                {"_id": 1, "name": 1, "email": 1, "role": 1},
            ).sort("_id", -1)
        )

        user_list = []

        for user in users:
            user_list.append(
                {
                    "user_id": str(user["_id"]),
                    "name": user.get("name", ""),
                    "email": user.get("email", ""),
                    "role": user.get("role", "user"),
                }
            )

        return (
            jsonify(
                {
                    "success": True,
                    "total": len(user_list),
                    "users": user_list,
                }
            ),
            200,
        )

    except Exception:
        logging.exception("Admin user list API error")
        return (
            jsonify({"success": False, "message": "Unable to fetch users."}),
            500,
        )


# ==========================================
# ADMIN INTERVIEW MANAGEMENT - LIST INTERVIEWS
# ==========================================
@admin_bp.route("/api/admin/interviews", methods=["GET"])
@admin_required
def admin_get_interviews(current_user):
    try:
        if db is None:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Database is not connected.",
                    }
                ),
                500,
            )

        interviews_collection = db["interviews"]

        interviews = list(
            interviews_collection.find(
                {},
                {
                    "_id": 1,
                    "user_id": 1,
                    "job_role": 1,
                    "experience_level": 1,
                    "interview_type": 1,
                    "difficulty": 1,
                    "number_of_questions": 1,
                    "status": 1,
                    "created_at": 1,
                    "duration": 1,
                },
            )
            .sort("_id", -1)
            .limit(200)
        )

        interview_list = []

        for interview in interviews:
            created_at = interview.get("created_at")

            if created_at and hasattr(created_at, "isoformat"):
                created_at = created_at.isoformat()
            elif created_at is not None:
                created_at = str(created_at)

            interview_list.append(
                {
                    "interview_id": str(interview["_id"]),
                    "user_id": str(interview.get("user_id", "")),
                    "job_role": interview.get("job_role", ""),
                    "experience_level": interview.get("experience_level", ""),
                    "interview_type": interview.get("interview_type", ""),
                    "difficulty": interview.get("difficulty", ""),
                    "number_of_questions": interview.get("number_of_questions", 0),
                    "status": interview.get("status", "unknown"),
                    "created_at": created_at,
                    "duration": interview.get("duration", ""),
                }
            )

        return (
            jsonify(
                {
                    "success": True,
                    "total": len(interview_list),
                    "interviews": interview_list,
                }
            ),
            200,
        )

    except Exception:
        logging.exception("Admin interview list API error")
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Unable to fetch interviews.",
                }
            ),
            500,
        )
