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
