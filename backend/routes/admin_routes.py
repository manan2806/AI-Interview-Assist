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
