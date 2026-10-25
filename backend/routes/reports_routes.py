import csv, io, logging
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request, make_response

from database import db
from utils.auth_utils import admin_required

reports_bp = Blueprint("reports", __name__)

# ==========================================
# REPORT CONFIGURATION
# ==========================================
REPORT_CONFIG = {
    "users": {
        "collection": "users",
        "fields": [
            "user_id",
            "name",
            "email",
            "target_role",
            "experience_level",
            "created_at",
        ],
        "date_field": "created_at",
        "exclude_admins": True,
    },
    "interviews": {
        "collection": "interviews",
        "fields": [
            "interview_code",
            "user_id",
            "job_role",
            "experience_level",
            "interview_type",
            "difficulty",
            "status",
            "score",
            "created_at",
            "duration",
        ],
        "date_field": "created_at",
        "exclude_admins": False,
    },
    "problem-reports": {
        "collection": "problem_reports",
        "fields": [
            "report_id",
            "user_id",
            "title",
            "category",
            "status",
            "created_at",
            "updated_at",
        ],
        "date_field": "created_at",
        "exclude_admins": False,
    },
    "reviews": {
        "collection": "reviews",
        "fields": [
            "review_id",
            "user_id",
            "name",
            "rating",
            "comment",
            "status",
            "created_at",
            "updated_at",
        ],
        "date_field": "created_at",
        "exclude_admins": False,
    },
}

# ==========================================
# CSV VALUE HELPER
# ==========================================
def report_value(value):
    """Convert MongoDB values into CSV-friendly text."""
    if value is None:
        return ""

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, (dict, list, tuple)):
        value = str(value)
    else:
        value = str(value)

    # Reduce spreadsheet formula-injection risk.
    if value.lstrip().startswith(("=", "+", "-", "@")):
        value = "'" + value

    return value

# ==========================================
# ADMIN REPORTS CENTER - CSV EXPORT
# ==========================================
@reports_bp.route(
    "/api/admin/reports/<report_type>/export",
    methods=["GET"],
)
@admin_required
def export_admin_report(current_user, report_type):
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

        config = REPORT_CONFIG.get(report_type)

        if not config:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Unsupported report type.",
                        "allowed_types": list(REPORT_CONFIG.keys()),
                    }
                ),
                400,
            )

        export_format = request.args.get("format", "csv").strip().lower()

        if export_format != "csv":
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Currently, only CSV export is supported.",
                    }
                ),
                400,
            )

        query = {}

        # Exclude admin accounts from the users report.
        if config["exclude_admins"]:
            query["role"] = {"$ne": "admin"}

        start_date = request.args.get("start_date", "").strip()
        end_date = request.args.get("end_date", "").strip()
        date_query = {}

        if start_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d")
                date_query["$gte"] = start
            except ValueError:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Invalid start_date. Use YYYY-MM-DD.",
                        }
                    ),
                    400,
                )

        if end_date:
            try:
                end = datetime.strptime(end_date, "%Y-%m-%d")
                date_query["$lt"] = end + timedelta(days=1)
            except ValueError:
                return (
                    jsonify(
                        {
                            "success": False,
                            "message": "Invalid end_date. Use YYYY-MM-DD.",
                        }
                    ),
                    400,
                )

        if start_date and end_date and start_date > end_date:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Start date cannot be after end date.",
                    }
                ),
                400,
            )

        if date_query:
            query[config["date_field"]] = date_query

        collection = db[config["collection"]]
        fields = config["fields"]
        cursor = collection.find(
            query,
            {field: 1 for field in fields},
        ).sort(config["date_field"], -1)

        output = io.StringIO(newline="")
        writer = csv.writer(output)
        writer.writerow(fields)
        exported_count = 0

        for document in cursor:
            writer.writerow([report_value(document.get(field)) for field in fields])
            exported_count += 1

        response = make_response("\ufeff" + output.getvalue())
        response.headers["Content-Type"] = "text/csv; charset=utf-8"
        response.headers["Content-Disposition"] = (
            f'attachment; filename="{report_type}-report.csv"'
        )

        response.headers["X-Exported-Count"] = str(exported_count)
        return response

    except Exception:
        logging.exception("Admin CSV report export error")

        return (
            jsonify(
                {
                    "success": False,
                    "message": "Unable to export report.",
                }
            ),
            500,
        )
