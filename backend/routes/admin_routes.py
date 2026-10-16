from flask import Blueprint, jsonify, request
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
                {"_id": 1, "user_id": 1, "name": 1, "email": 1, "role": 1},
            ).sort("_id", -1)
        )

        user_list = []

        for user in users:
            user_list.append(
                {
                    "user_id": user.get("user_id", ""),
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


# ==========================================
# ADMIN PROFILE - VIEW AND EDIT
# ==========================================
@admin_bp.route("/api/admin/profile", methods=["GET", "PATCH"])
@admin_required
def admin_profile(current_user):
    try:
        if db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        users_collection = db["users"]

        # token_required already loads the authenticated user
        user_id = current_user.get("user_id")

        if not user_id:
            return (
                jsonify({"success": False, "message": "Admin user ID is missing."}),
                401,
            )

        # Confirm this is the admin's database record
        admin = users_collection.find_one({"user_id": user_id, "role": "admin"})

        if not admin:
            return (
                jsonify({"success": False, "message": "Admin profile not found."}),
                404,
            )

        # VIEW PROFILE
        if request.method == "GET":
            return (
                jsonify(
                    {
                        "success": True,
                        "profile": {
                            "user_id": admin.get("user_id", ""),
                            "name": admin.get("name", ""),
                            "email": admin.get("email", ""),
                            "role": admin.get("role", "admin"),
                        },
                    }
                ),
                200,
            )

        # EDIT PROFILE
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return (
                jsonify(
                    {"success": False, "message": "Please provide valid JSON data."}
                ),
                400,
            )

        name = data.get("name")
        email = data.get("email")

        if not isinstance(name, str) or not isinstance(email, str):
            return (
                jsonify({"success": False, "message": "Name and email must be text."}),
                400,
            )

        name = name.strip()
        email = email.strip().lower()

        if not name or not email:
            return (
                jsonify({"success": False, "message": "Name and email are required."}),
                400,
            )

        if len(name) > 100 or len(email) > 254:
            return (
                jsonify({"success": False, "message": "Name or email is too long."}),
                400,
            )

        # Basic email validation
        if (
            "@" not in email
            or "." not in email.rsplit("@", 1)[-1]
            or email.startswith("@")
        ):
            return (
                jsonify(
                    {"success": False, "message": "Please enter a valid email address."}
                ),
                400,
            )

        # Do not allow another account to use this email
        existing_email = users_collection.find_one(
            {"email": email, "_id": {"$ne": admin["_id"]}}
        )

        if existing_email:
            return (
                jsonify(
                    {"success": False, "message": "This email is already registered."}
                ),
                409,
            )

        users_collection.update_one(
            {"_id": admin["_id"]}, {"$set": {"name": name, "email": email}}
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Admin profile updated successfully.",
                    "profile": {
                        "user_id": admin.get("user_id", ""),
                        "name": name,
                        "email": email,
                        "role": admin.get("role", "admin"),
                    },
                }
            ),
            200,
        )

    except Exception:
        logging.exception("Admin profile API error")
        return (
            jsonify({"success": False, "message": "Unable to process admin profile."}),
            500,
        )
