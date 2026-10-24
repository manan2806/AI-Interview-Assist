from flask import Blueprint, jsonify, request
from database import db
from flask_jwt_extended import jwt_required, get_jwt_identity

# from flask_bcrypt import Bcrypt
import logging
from datetime import datetime
from utils.auth_utils import admin_required
from routes.auth_routes import bcrypt

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
        problem_reports = db["problem_reports"]

        stats = {
            "total_users": users.count_documents({}),
            "total_interviews": interviews.count_documents({}),
            "completed_interviews": interviews.count_documents({"status": "completed"}),
            "total_problem_reports": problem_reports.count_documents({}),
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

        user_id = current_user.get("user_id")

        if not user_id:
            return (
                jsonify({"success": False, "message": "Admin user ID is missing."}),
                401,
            )

        # FIND ADMIN PROFILE
        admin = users_collection.find_one({"user_id": user_id, "role": "admin"})

        if not admin:
            return (
                jsonify({"success": False, "message": "Admin profile not found."}),
                404,
            )

        # PREPARE PROFILE RESPONSE
        def get_profile(admin_data):
            return {
                "user_id": admin_data.get("user_id", ""),
                "name": admin_data.get("name", ""),
                "email": admin_data.get("email", ""),
                "role": admin_data.get("role", "admin"),
                "created_at": admin_data.get(
                    "created_at", admin_data.get("createdAt", "")
                ),
            }

        # GET - VIEW ADMIN PROFILE
        if request.method == "GET":
            return jsonify({"success": True, "profile": get_profile(admin)}), 200

        # PATCH - EDIT ADMIN PROFILE
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return (
                jsonify(
                    {"success": False, "message": "Please provide valid JSON data."}
                ),
                400,
            )

        # Only allow name and email updates
        allowed_fields = {"name", "email"}

        if not data:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Please provide profile details to update.",
                    }
                ),
                400,
            )

        if not set(data.keys()).issubset(allowed_fields):
            return (
                jsonify(
                    {"success": False, "message": "Only name and email can be updated."}
                ),
                400,
            )

        # VALIDATE NAME
        name = data.get("name", admin.get("name", ""))

        if not isinstance(name, str):
            return jsonify({"success": False, "message": "Name must be text."}), 400

        name = name.strip()

        if not name:
            return jsonify({"success": False, "message": "Name is required."}), 400

        if len(name) > 100:
            return (
                jsonify(
                    {"success": False, "message": "Name cannot exceed 100 characters."}
                ),
                400,
            )

        # VALIDATE EMAIL
        email = data.get("email", admin.get("email", ""))

        if not isinstance(email, str):
            return jsonify({"success": False, "message": "Email must be text."}), 400

        email = email.strip().lower()

        if not email:
            return jsonify({"success": False, "message": "Email is required."}), 400

        if len(email) > 254:
            return (
                jsonify(
                    {"success": False, "message": "Email cannot exceed 254 characters."}
                ),
                400,
            )

        # Basic email validation
        if (
            "@" not in email
            or email.count("@") != 1
            or "." not in email.rsplit("@", 1)[-1]
            or email.startswith("@")
            or email.endswith("@")
            or any(char.isspace() for char in email)
        ):
            return (
                jsonify(
                    {"success": False, "message": "Please enter a valid email address."}
                ),
                400,
            )

        # CHECK DUPLICATE EMAIL
        existing_email = users_collection.find_one(
            {
                "email": {
                    "$regex": f"^{__import__('re').escape(email)}$",
                    "$options": "i",
                },
                "_id": {"$ne": admin["_id"]},
            }
        )

        if existing_email:
            return (
                jsonify(
                    {"success": False, "message": "This email is already registered."}
                ),
                409,
            )

        # UPDATE PROFILE
        users_collection.update_one(
            {"_id": admin["_id"]}, {"$set": {"name": name, "email": email}}
        )

        # Fetch updated record
        updated_admin = users_collection.find_one({"_id": admin["_id"]})

        if not updated_admin:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Unable to retrieve updated admin profile.",
                    }
                ),
                500,
            )

        # SUCCESS RESPONSE
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Admin profile updated successfully.",
                    "profile": get_profile(updated_admin),
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


# ==========================================
# ADMIN SETTINGS - GET AND UPDATE
# ==========================================
DEFAULT_ADMIN_SETTINGS = {
    "theme": "Light",
    "email_notifications": True,
    "evaluation_alerts": True,
    "system_alerts": True,
}


@admin_bp.route("/api/admin/settings", methods=["GET", "PUT"])
@admin_required
def admin_settings(current_user):
    try:
        if db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        users_collection = db["users"]
        user_id = current_user.get("user_id")

        if not user_id:
            return (
                jsonify({"success": False, "message": "Admin user ID is missing."}),
                401,
            )

        admin = users_collection.find_one({"user_id": user_id, "role": "admin"})

        if not admin:
            return (
                jsonify({"success": False, "message": "Admin account not found."}),
                404,
            )

        # GET: Return saved settings with defaults
        if request.method == "GET":
            saved_settings = admin.get("admin_settings", {})
            settings = {**DEFAULT_ADMIN_SETTINGS, **saved_settings}

            return jsonify({"success": True, "settings": settings}), 200

        # PUT: Update settings
        data = request.get_json(silent=True)

        if not isinstance(data, dict) or not data:
            return (
                jsonify(
                    {"success": False, "message": "Please provide valid settings JSON."}
                ),
                400,
            )

        allowed_fields = set(DEFAULT_ADMIN_SETTINGS.keys())

        if not set(data.keys()).issubset(allowed_fields):
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "One or more settings fields are invalid.",
                    }
                ),
                400,
            )

        updates = {}

        # Validate appearance theme
        if "theme" in data:
            theme = data["theme"]

            if not isinstance(theme, str) or theme not in ("Light", "Dark"):
                return (
                    jsonify(
                        {"success": False, "message": "Theme must be Light or Dark."}
                    ),
                    400,
                )

            updates["admin_settings.theme"] = theme

        # Validate notification toggles
        boolean_fields = [
            "email_notifications",
            "evaluation_alerts",
            "system_alerts",
        ]

        for field in boolean_fields:
            if field in data:
                if not isinstance(data[field], bool):
                    return (
                        jsonify(
                            {
                                "success": False,
                                "message": f"{field} must be true or false.",
                            }
                        ),
                        400,
                    )

                updates[f"admin_settings.{field}"] = data[field]

        if not updates:
            return (
                jsonify({"success": False, "message": "No valid settings provided."}),
                400,
            )

        users_collection.update_one(
            {"_id": admin["_id"], "role": "admin"}, {"$set": updates}
        )

        updated_admin = users_collection.find_one({"_id": admin["_id"]})
        settings = {**DEFAULT_ADMIN_SETTINGS, **updated_admin.get("admin_settings", {})}

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Admin settings updated successfully.",
                    "settings": settings,
                }
            ),
            200,
        )

    except Exception:
        logging.exception("Admin settings API error")
        return (
            jsonify({"success": False, "message": "Unable to process admin settings."}),
            500,
        )


# ==========================================
# ADMIN CHANGE PASSWORD
# ==========================================
@admin_bp.route("/api/admin/change-password", methods=["PUT"])
@admin_required
def admin_change_password(current_user):
    try:
        data = request.get_json(silent=True) or {}

        current_password = data.get("current_password", "")
        new_password = data.get("new_password", "")
        confirm_password = data.get("confirm_password", "")

        if not all([current_password, new_password, confirm_password]):
            return (
                jsonify(
                    {"success": False, "message": "All password fields are required."}
                ),
                400,
            )

        if new_password != confirm_password:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "New password and confirm password do not match.",
                    }
                ),
                400,
            )

        if len(new_password) < 6:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "New password must be at least 6 characters.",
                    }
                ),
                400,
            )

        if current_password == new_password:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "New password must be different from current password.",
                    }
                ),
                400,
            )

        user_id = current_user.get("user_id")

        if not user_id:
            return jsonify({"sussecc": False, "message": "Admin User ID is missing."})

        admin = db.users.find_one({"user_id": user_id, "role": "admin"})

        if not admin:
            return (
                jsonify({"success": False, "message": "Admin account not found."}),
                404,
            )

        stored_password = admin.get("password", "")

        if not bcrypt.check_password_hash(stored_password, current_password):
            return (
                jsonify(
                    {"success": False, "message": "Current password is incorrect."}
                ),
                400,
            )

        hashed_password = bcrypt.generate_password_hash(new_password).decode("utf-8")

        db.users.update_one(
            {"user_id": user_id, "role": "admin"},
            {"$set": {"password": hashed_password}},
        )

        return (
            jsonify({"success": True, "message": "Password changed successfully."}),
            200,
        )

    except Exception:
        logging.exception("Admin Change Password API Error")

        return (
            jsonify(
                {
                    "success": False,
                    "message": "Unable to change password. Please try again.",
                }
            ),
            500,
        )


# ==========================================
# ADMIN DELETE ACCOUNT
# ==========================================
@admin_bp.route("/api/admin/delete-account", methods=["DELETE"])
@admin_required
def admin_delete_account(current_user):
    try:
        data = request.get_json(silent=True) or {}

        current_password = data.get("current_password", "")
        confirm_delete = data.get("confirm_delete", False)

        if not current_password:
            return (
                jsonify(
                    {"success": False, "message": "Please enter your current password."}
                ),
                400,
            )

        if confirm_delete is not True:
            return (
                jsonify(
                    {"success": False, "message": "Please confirm account deletion."}
                ),
                400,
            )

        user_id = current_user.get("user_id")
        if not user_id:
            return (
                jsonify({"success": False, "message": "Admin user ID is missing."}),
                401,
            )

        admin = db.users.find_one({"user_id": user_id, "role": "admin"})

        if not admin:
            return (
                jsonify({"success": False, "message": "Admin account not found."}),
                404,
            )

        stored_password = admin.get("password", "")

        if not bcrypt.check_password_hash(stored_password, current_password):
            return (
                jsonify(
                    {"success": False, "message": "Current password is incorrect."}
                ),
                400,
            )

        result = db.users.delete_one({"user_id": user_id, "role": "admin"})

        if result.deleted_count != 1:
            return (
                jsonify(
                    {"success": False, "message": "Unable to delete admin account."}
                ),
                500,
            )

        return (
            jsonify(
                {"success": True, "message": "Admin account deleted successfully."}
            ),
            200,
        )

    except Exception as error:
        print("Admin Delete Account Error:", error)

        return (
            jsonify(
                {
                    "success": False,
                    "message": "Unable to delete account. Please try again.",
                }
            ),
            500,
        )


# ==========================================
# ADMIN PROBLEM REPORTS - LIST, DETAILS, STATUS
# ==========================================
ALLOWED_PROBLEM_REPORT_STATUSES = [
    "Open",
    "In Progress",
    "Resolved",
]


def serialize_problem_report(report):
    report["_id"] = str(report["_id"])

    created_at = report.get("created_at")
    if isinstance(created_at, datetime):
        report["created_at"] = created_at.isoformat()

    updated_at = report.get("updated_at")
    if isinstance(updated_at, datetime):
        report["updated_at"] = updated_at.isoformat()

    return report


# ==========================================
# GET ALL PROBLEM REPORTS
# ==========================================
@admin_bp.route("/api/admin/problem-reports", methods=["GET"])
@admin_required
def admin_get_problem_reports(current_user):
    try:
        if db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        reports_collection = db["problem_reports"]
        reports = list(reports_collection.find({}).sort("created_at", -1).limit(500))
        report_list = [serialize_problem_report(report) for report in reports]

        return (
            jsonify(
                {"success": True, "total": len(report_list), "reports": report_list}
            ),
            200,
        )

    except Exception:
        logging.exception("Admin problem report list API error")
        return (
            jsonify({"success": False, "message": "Unable to fetch problem reports."}),
            500,
        )


# ==========================================
# GET SINGLE PROBLEM REPORT DETAILS
# ==========================================
@admin_bp.route("/api/admin/problem-reports/<report_id>", methods=["GET"])
@admin_required
def admin_get_problem_report_details(current_user, report_id):
    try:
        if db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        report = db["problem_reports"].find_one({"report_id": report_id})

        if not report:
            return (
                jsonify({"success": False, "message": "Problem report not found."}),
                404,
            )

        return (
            jsonify({"success": True, "report": serialize_problem_report(report)}),
            200,
        )

    except Exception:
        logging.exception("Admin problem report details API error")
        return (
            jsonify(
                {"success": False, "message": "Unable to fetch problem report details."}
            ),
            500,
        )


# ==========================================
# UPDATE PROBLEM REPORT STATUS
# ==========================================
@admin_bp.route("/api/admin/problem-reports/<report_id>/status", methods=["PATCH"])
@admin_required
def admin_update_problem_report_status(current_user, report_id):
    try:
        if db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return (
                jsonify(
                    {"success": False, "message": "Please provide valid JSON data."}
                ),
                400,
            )

        status = data.get("status")

        if not isinstance(status, str):
            return jsonify({"success": False, "message": "Status is required."}), 400

        status = status.strip()

        if status not in ALLOWED_PROBLEM_REPORT_STATUSES:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Invalid problem report status.",
                        "allowed_statuses": ALLOWED_PROBLEM_REPORT_STATUSES,
                    }
                ),
                400,
            )

        result = db["problem_reports"].update_one(
            {"report_id": report_id},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}},
        )

        if result.matched_count == 0:
            return (
                jsonify({"success": False, "message": "Problem report not found."}),
                404,
            )

        logging.info(
            "Problem report %s status updated to %s by admin %s",
            report_id,
            status,
            current_user.get("user_id", "unknown"),
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Problem report status updated successfully.",
                    "report_id": report_id,
                    "status": status,
                }
            ),
            200,
        )

    except Exception:
        logging.exception("Admin problem report status update API error")
        return (
            jsonify(
                {"success": False, "message": "Unable to update problem report status."}
            ),
            500,
        )
