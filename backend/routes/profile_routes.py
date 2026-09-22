from flask import Blueprint, jsonify, request
from database import db
from utils.auth_utils import token_required

user_bp = Blueprint("user", __name__)

# ==================================
# GET USER PROFILE
# ==================================
@user_bp.route("/api/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    try:
        if db is None:
            return jsonify({
                "success": False,
                "message": "Database is not connected"
            }), 500

        users = db["users"]

        user = users.find_one({
            "user_id": current_user["user_id"]
        })

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "User profile fetched successfully",
            "user": {
                "user_id": user.get("user_id"),
                "name": user.get("name"),
                "email": user.get("email"),
                "skills": user.get("skills", []),
                "target_role": user.get("target_role", ""),
                "experience_level": user.get("experience_level", "Fresher")
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==================================
# UPDATE USER PROFILE
# ==================================
@user_bp.route("/api/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    try:
        # Get JSON data
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "Please send valid JSON data"
            }), 400

        # Check database
        if db is None:
            return jsonify({
                "success": False,
                "message": "Database is not connected"
            }), 500

        users = db["users"]

        # UPDATE DATA
        update_data = {}

        if "name" in data and data["name"]:
            update_data["name"] = data["name"].strip()

        if "skills" in data:
            update_data["skills"] = data["skills"]

        if "target_role" in data:
            update_data["target_role"] = data["target_role"]

        if "experience_level" in data:
            update_data["experience_level"] = data["experience_level"]

        # Check if anything to update
        if not update_data:
            return jsonify({
                "success": False,
                "message": "No profile data provided to update"
            }), 400

        # UPDATE MONGODB
        result = users.update_one(
            {
                "user_id": current_user["user_id"]
            },
            {
                "$set": update_data
            }
        )

        # User not found
        if result.matched_count == 0:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        # GET UPDATED USER
        updated_user = users.find_one({
            "user_id": current_user["user_id"]
        })

        return jsonify({
            "success": True,
            "message": "Profile updated successfully 🎉",
            "user": {
                "user_id": updated_user.get("user_id"),
                "name": updated_user.get("name"),
                "email": updated_user.get("email"),
                "skills": updated_user.get("skills", []),
                "target_role": updated_user.get("target_role", ""),
                "experience_level": updated_user.get("experience_level", "Fresher")
            }
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500