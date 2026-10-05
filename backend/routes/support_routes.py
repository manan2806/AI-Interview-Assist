from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import random
from database import users, problem_reports
from utils.email_service import send_problem_report_email

support_bp = Blueprint("support",__name__,url_prefix="/api/support")

@support_bp.route("/problem-report", methods=["POST"])
@jwt_required()
def create_problem_report():

    try:
        # GET LOGGED-IN USER
        user_id = get_jwt_identity()

        # GET REQUEST DATA
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "Request data is missing."
            }), 400

        problem_type = data.get("problem_type", "").strip()
        subject = data.get("subject", "").strip()
        description = data.get("description", "").strip()

        # VALIDATION
        if not problem_type:
            return jsonify({
                "success": False,
                "message": "Problem type is required."
            }), 400

        if not subject:
            return jsonify({
                "success": False,
                "message": "Subject is required."
            }), 400

        if not description:
            return jsonify({
                "success": False,
                "message": "Problem description is required."
            }), 400

        # FIND USER
        user = users.find_one({
            "user_id": user_id
        })

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found."
            }), 404

        user_name = user.get("name", "User")
        user_email = user.get("email")

        if not user_email:
            return jsonify({
                "success": False,
                "message": "User email not found."
            }), 400

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
            "created_at": datetime.utcnow()
        }

        # SAVE TO MONGODB
        problem_reports.insert_one(report)

        # SEND PROBLEM REPORT EMAIL
        try:
            send_problem_report_email(
                sender_name=user_name,
                sender_email=user_email,
                problem_type=problem_type,
                subject=subject,
                description=description
            )

            email_sent = True
            print("✅ Problem report email sent successfully")

        except Exception as email_error:
            
            email_sent = False
            print("❌ Problem report email error:",str(email_error))

        print("==========================================")
        print("✅ PROBLEM REPORT SAVED")
        print("Report ID:", report_id)
        print("User:", user_name)
        print("Email:", user_email)
        print("==========================================")

        # SUCCESS RESPONSE
        return jsonify({
            "success": True,
            "message": "Problem report submitted successfully.",
            "report_id": report_id,
            "email_sent": email_sent
        }), 201

    except Exception as error:

        print("==========================================")
        print("❌ PROBLEM REPORT ERROR:", str(error))
        print("==========================================")

        return jsonify({
            "success": False,
            "message": "Unable to submit problem report."
        }), 500