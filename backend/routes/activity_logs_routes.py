from flask import Blueprint, jsonify, request
from database import db
from utils.auth_utils import admin_required

from datetime import datetime, timedelta
from bson import ObjectId
import logging, re

activity_logs_bp = Blueprint("activity_logs", __name__)


# ==========================================
# SERIALIZE ACTIVITY LOG
# ==========================================
def serialize_activity_log(log):

    created_at = log.get("created_at")

    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
    elif created_at is not None:
        created_at = str(created_at)

    return {
        "log_id": log.get("log_id", ""),
        "user_id": log.get("user_id", ""),
        "user_name": log.get("user_name", ""),
        "user_email": log.get("user_email", ""),
        "role": log.get("role", "user"),
        "action": log.get("action", ""),
        "description": log.get("description", ""),
        "ip_address": log.get("ip_address", ""),
        "created_at": created_at,
        "metadata": log.get("metadata", {}),
    }


# ==========================================
# BUILD ACTIVITY LOG FILTER
# ==========================================
def build_activity_filter():

    filters = {}

    user_id = request.args.get("user_id", "").strip()
    action = request.args.get("action", "").strip()
    search = request.args.get("search", "").strip()

    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()
    role = request.args.get("role", "").strip()

    if role:
        filters["role"] = role

    if user_id:
        filters["user_id"] = user_id

    if action:
        filters["action"] = action

    if search:
        safe_search = re.escape(search)

        filters["$or"] = [
            {"user_name": {"$regex": safe_search, "$options": "i"}},
            {"user_email": {"$regex": safe_search, "$options": "i"}},
            {"user_id": {"$regex": safe_search, "$options": "i"}},
            {"description": {"$regex": safe_search, "$options": "i"}},
        ]

    date_filter = {}

    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            date_filter["$gte"] = start
        except ValueError:
            raise ValueError("Invalid start_date. Use YYYY-MM-DD.")

    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d")
            date_filter["$lt"] = end + timedelta(days=1)
        except ValueError:
            raise ValueError("Invalid end_date. Use YYYY-MM-DD.")

    if date_filter:
        filters["created_at"] = date_filter

    return filters


# ==========================================
# GET ALL ACTIVITY LOGS - COMBINED
# ==========================================
@activity_logs_bp.route("/api/admin/activity-logs", methods=["GET"])
@admin_required
def admin_get_activity_logs(current_user):

    try:

        if db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        activity_collection = db["activity_logs"]

        filters = build_activity_filter()

        # PAGINATION
        try:
            page = int(request.args.get("page", 1))
            per_page = int(request.args.get("per_page", 20))
        except ValueError:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Page and per_page must be valid numbers.",
                    }
                ),
                400,
            )

        if page < 1 or per_page < 1 or per_page > 100:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid pagination values. per_page must be between 1 and 100.",
                    }
                ),
                400,
            )

        total = activity_collection.count_documents(filters)

        logs = list(
            activity_collection.find(filters)
            .sort([("created_at", -1), ("_id", -1)])
            .skip((page - 1) * per_page)
            .limit(per_page)
        )

        activity_list = [serialize_activity_log(log) for log in logs]

        return (
            jsonify(
                {
                    "success": True,
                    "total": total,
                    "page": page,
                    "per_page": per_page,
                    "total_pages": (total + per_page - 1) // per_page,
                    "activities": activity_list,
                }
            ),
            200,
        )

    except ValueError as error:

        return jsonify({"success": False, "message": str(error)}), 400

    except Exception:

        logging.exception("Admin activity logs API error")

        return (
            jsonify({"success": False, "message": "Unable to fetch activity logs."}),
            500,
        )


# ==========================================
# GET INDIVIDUAL USER ACTIVITY LOGS
# ==========================================
@activity_logs_bp.route("/api/admin/activity-logs/user/<user_id>", methods=["GET"])
@admin_required
def admin_get_user_activity_logs(current_user, user_id):

    try:

        if db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        users_collection = db["users"]
        activity_collection = db["activity_logs"]

        user = users_collection.find_one(
            {"user_id": user_id},
            {"_id": 0, "user_id": 1, "name": 1, "email": 1, "role": 1},
        )

        if not user:
            return jsonify({"success": False, "message": "User not found."}), 404

        try:
            page = int(request.args.get("page", 1))
            per_page = int(request.args.get("per_page", 20))
        except ValueError:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Page and per_page must be valid numbers.",
                    }
                ),
                400,
            )

        if page < 1 or per_page < 1 or per_page > 100:
            return (
                jsonify({"success": False, "message": "Invalid pagination values."}),
                400,
            )

        filters = build_activity_filter()

        # Always restrict this API to the selected user
        filters["user_id"] = user_id

        total = activity_collection.count_documents(filters)

        logs = list(
            activity_collection.find(filters)
            .sort([("created_at", -1), ("_id", -1)])
            .skip((page - 1) * per_page)
            .limit(per_page)
        )

        activity_list = [serialize_activity_log(log) for log in logs]

        return (
            jsonify(
                {
                    "success": True,
                    "user": user,
                    "total": total,
                    "page": page,
                    "per_page": per_page,
                    "total_pages": (total + per_page - 1) // per_page,
                    "activities": activity_list,
                }
            ),
            200,
        )

    except ValueError as error:

        return jsonify({"success": False, "message": str(error)}), 400

    except Exception:

        logging.exception("Individual user activity logs API error")

        return (
            jsonify(
                {"success": False, "message": "Unable to fetch user activity logs."}
            ),
            500,
        )


# ==========================================
# GET ACTIVITY LOG FILTER OPTIONS
# ==========================================
@activity_logs_bp.route("/api/admin/activity-logs/filters", methods=["GET"])
@admin_required
def admin_get_activity_log_filters(current_user):

    try:

        if db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        activity_collection = db["activity_logs"]
        users_collection = db["users"]

        # GET ALL AVAILABLE ACTIONS
        actions = activity_collection.distinct("action")

        # GET BOTH USERS AND ADMINS
        users = list(
            users_collection.find(
                {},
                {"_id": 0, "user_id": 1, "name": 1, "email": 1, "role": 1},
            ).sort("name", 1)
        )

        return (
            jsonify(
                {
                    "success": True,
                    "actions": sorted(
                        [
                            action
                            for action in actions
                            if isinstance(action, str) and action
                        ]
                    ),
                    "roles": ["user", "admin"],
                    "users": users,
                }
            ),
            200,
        )

    except Exception:

        logging.exception("Activity log filters API error")

        return (
            jsonify(
                {"success": False, "message": "Unable to fetch activity log filters."}
            ),
            500,
        )
