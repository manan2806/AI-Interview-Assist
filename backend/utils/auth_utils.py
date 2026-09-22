import os
import jwt

from functools import wraps
from flask import request, jsonify

from flask_jwt_extended import create_access_token

from database import db


# ==================================
# GENERATE JWT TOKEN
# ==================================

def generate_token(user):

    token = create_access_token(
        identity=str(user["user_id"])
    )

    return token


# ==================================
# JWT TOKEN REQUIRED DECORATOR
# ==================================

def token_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        token = None

        # ----------------------------------
        # Check Authorization Header
        # ----------------------------------

        auth_header = request.headers.get("Authorization")

        if auth_header:

            parts = auth_header.split(" ")

            if len(parts) == 2 and parts[0] == "Bearer":
                token = parts[1]

        # ----------------------------------
        # Token Missing
        # ----------------------------------

        if not token:
            return jsonify({
                "success": False,
                "message": "Token is missing. Please login first."
            }), 401

        try:

            # ----------------------------------
            # Decode JWT Token
            # ----------------------------------

            data = jwt.decode(
                token,
                os.getenv("JWT_SECRET_KEY"),
                algorithms=["HS256"]
            )

            # ----------------------------------
            # Get User ID from JWT
            # ----------------------------------

            user_id = data.get("sub")

            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "User ID not found in token."
                }), 401

            # ----------------------------------
            # Check Database
            # ----------------------------------

            if db is None:
                return jsonify({
                    "success": False,
                    "message": "Database is not connected."
                }), 500

            users = db["users"]

            current_user = users.find_one({
                "user_id": user_id
            })

            if not current_user:
                return jsonify({
                    "success": False,
                    "message": "User not found."
                }), 404

            # ----------------------------------
            # Pass User to Route
            # ----------------------------------

            return f(current_user, *args, **kwargs)

        except jwt.ExpiredSignatureError:

            return jsonify({
                "success": False,
                "message": "Token has expired. Please login again."
            }), 401

        except jwt.InvalidTokenError:

            return jsonify({
                "success": False,
                "message": "Invalid token."
            }), 401

        except Exception as e:

            return jsonify({
                "success": False,
                "message": str(e)
            }), 500

    return decorated
