from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import random

from database import users, problem_reports
from utils.email_service import send_problem_report_email

support_bp = Blueprint("support", __name__, url_prefix="/api/support")


@support_bp.route("/problem-report", methods=["POST"])
@jwt_required()
def create_problem_report():

    try:
        user_id = get_jwt_identity()

        # GET REQUEST DATA
        data = request.get_json()

        if not data:
            return (
                jsonify({"success": False, "message": "Request data is missing."}),
                400,
            )

        problem_type = data.get("problem_type", "").strip()
        subject = data.get("subject", "").strip()
        description = data.get("description", "").strip()

        if not problem_type:
            return (
                jsonify({"success": False, "message": "Problem type is required."}),
                400,
            )

        if not subject:
            return jsonify({"success": False, "message": "Subject is required."}), 400

        if not description:
            return (
                jsonify(
                    {"success": False, "message": "Problem description is required."}
                ),
                400,
            )

        # FIND USER
        user = users.find_one({"user_id": user_id})

        if not user:
            return jsonify({"success": False, "message": "User not found."}), 404

        user_name = user.get("name", "User")
        user_email = user.get("email")

        if not user_email:
            return jsonify({"success": False, "message": "User email not found."}), 400

        # GENERATE REPORT ID
        report_id = f"PR-{random.randint(100000, 999999)}"

        # CREATE REPORT DOCUMENT
        report = {
            "report_id": report_id,
            "user_id": user_id,
            "user_name": user_name,
            "user_email": user_email,
            "problem_type": problem_type,
            "subject": subject,
            "description": description,
            "status": "Open",
            "created_at": datetime.utcnow(),
        }

        # SAVE TO MONGODB
        problem_reports.insert_one(report)

        # SEND NOTIFICATION EMAIL TO ALL ADMINS
        email_sent = False

        try:
            admins = users.find({"role": "admin"})

            for admin in admins:
                admin_email = admin.get("email")

                if not admin_email:
                    continue

                admin_settings = admin.get("admin_settings", {})

                # Respect each admin's System Alerts setting
                if not admin_settings.get("system_alerts", True):
                    print(f"System alerts disabled for {admin_email}")
                    continue

                try:
                    send_problem_report_email(
                        sender_name=user_name,
                        sender_email=user_email,
                        problem_type=problem_type,
                        subject=subject,
                        description=description,
                        recipient_email=admin_email,
                    )

                    email_sent = True

                    print("Problem report email sent to:", admin_email)

                except Exception as email_error:
                    print(f"Email failed for {admin_email}:", str(email_error))

        except Exception as admin_error:
            print("Unable to fetch admin accounts:", str(admin_error))

        # LOG REPORT DETAILS
        print("==========================================")
        print("PROBLEM REPORT SAVED")
        print("Report ID:", report_id)
        print("User:", user_name)
        print("Email sent:", email_sent)
        print("==========================================")

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Problem report submitted successfully.",
                    "report_id": report_id,
                    "email_sent": email_sent,
                }
            ),
            201,
        )

    except Exception as error:
        print("PROBLEM REPORT ERROR:", str(error))

        return (
            jsonify({"success": False, "message": "Unable to submit problem report."}),
            500,
        )
