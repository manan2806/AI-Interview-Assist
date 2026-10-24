from datetime import datetime, timezone
import logging
import random
from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

import database

reviews_bp = Blueprint("reviews", __name__)

ALLOWED_STATUSES = {"pending", "approved", "hidden"}
MAX_COMMENT_LENGTH = 1000


def generate_review_id():
    collection = review_collection()

    while True:
        review_id = f"REV-{random.randint(100000, 999999)}"

        if not collection.find_one({"review_id": review_id}):
            return review_id


def get_current_user():
    """Get the authenticated user from the database."""
    if database.db is None:
        return None

    user_id = get_jwt_identity()

    if not user_id:
        return None

    return database.db["users"].find_one(
        {"user_id": str(user_id)},
        {"_id": 1, "user_id": 1, "name": 1, "role": 1},
    )


def serialize_review(review):
    created_at = review.get("created_at")
    updated_at = review.get("updated_at")

    return {
        "review_id": review.get("review_id", str(review["_id"])),
        "user_id": review.get("user_id", ""),
        "name": review.get("name", "User"),
        "rating": review.get("rating", 0),
        "comment": review.get("comment", ""),
        "status": review.get("status", "pending"),
        "created_at": (
            created_at.isoformat() if isinstance(created_at, datetime) else None
        ),
        "updated_at": (
            updated_at.isoformat() if isinstance(updated_at, datetime) else None
        ),
    }


def review_collection():
    return database.db["reviews"]


def validate_review(data):
    if not isinstance(data, dict):
        return None, None, "Please provide valid JSON data."

    rating = data.get("rating")
    comment = data.get("comment")

    # bool is a subclass of int in Python, so reject it explicitly.
    if isinstance(rating, bool) or not isinstance(rating, int):
        return None, None, "Rating must be a number from 1 to 5."

    if rating not in range(1, 6):
        return None, None, "Rating must be between 1 and 5."

    if not isinstance(comment, str):
        return None, None, "Review comment is required."

    comment = comment.strip()

    if not comment:
        return None, None, "Review comment cannot be empty."

    if len(comment) > MAX_COMMENT_LENGTH:
        return None, None, "Review cannot exceed 1000 characters."

    return rating, comment, None


def find_review_filter(review_id):
    collection = review_collection()

    review = collection.find_one({"review_id": review_id})

    if review:
        return {"review_id": review_id}

    if ObjectId.is_valid(review_id):
        return {"_id": ObjectId(review_id)}

    return None


# ==========================================
# PUBLIC: GET APPROVED REVIEWS
# ==========================================
@reviews_bp.route("/api/reviews", methods=["GET"])
def get_public_reviews():
    try:
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        collection = review_collection()

        reviews = list(
            collection.find({"status": "approved"}).sort("created_at", -1).limit(100)
        )

        total = collection.count_documents({"status": "approved"})

        rating_data = list(
            collection.aggregate(
                [
                    {"$match": {"status": "approved"}},
                    {
                        "$group": {
                            "_id": None,
                            "average_rating": {"$avg": "$rating"},
                            "total_reviews": {"$sum": 1},
                        }
                    },
                ]
            )
        )

        stats = rating_data[0] if rating_data else {}

        return (
            jsonify(
                {
                    "success": True,
                    "reviews": [serialize_review(r) for r in reviews],
                    "total": total,
                    "average_rating": round(stats.get("average_rating", 0), 1),
                }
            ),
            200,
        )

    except Exception:
        logging.exception("Public reviews API error")
        return jsonify({"success": False, "message": "Unable to fetch reviews."}), 500


# ==========================================
# USER: SUBMIT REVIEW
# ==========================================
@reviews_bp.route("/api/reviews", methods=["POST"])
@jwt_required()
def create_review():
    try:
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        user = get_current_user()

        if not user:
            return (
                jsonify({"success": False, "message": "User account not found."}),
                404,
            )

        if user.get("role") != "user":
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Only user accounts can submit reviews.",
                    }
                ),
                403,
            )

        data = request.get_json(silent=True)
        rating, comment, error = validate_review(data)

        if error:
            return jsonify({"success": False, "message": error}), 400

        collection = review_collection()
        user_id = user["user_id"]

        existing = collection.find_one({"user_id": user_id})

        if existing:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": (
                            "You have already submitted a review. "
                            "Please edit your existing review."
                        ),
                        "review_id": str(existing["_id"]),
                    }
                ),
                409,
            )

        now = datetime.now(timezone.utc)

        review = {
            "review_id": generate_review_id(),
            "user_id": user_id,
            "name": user.get("name", "User"),
            "rating": rating,
            "comment": comment,
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        }

        result = collection.insert_one(review)
        review["_id"] = result.inserted_id

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Review submitted and awaiting admin approval.",
                    "review": serialize_review(review),
                }
            ),
            201,
        )

    except Exception:
        logging.exception("Create review API error")
        return jsonify({"success": False, "message": "Unable to submit review."}), 500


# ==========================================
# USER: GET OWN REVIEW
# ==========================================
@reviews_bp.route("/api/reviews/mine", methods=["GET"])
@jwt_required()
def get_my_review():
    try:
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        user = get_current_user()

        if not user:
            return (
                jsonify({"success": False, "message": "User account not found."}),
                404,
            )

        review = review_collection().find_one({"user_id": user["user_id"]})

        return (
            jsonify(
                {
                    "success": True,
                    "review": serialize_review(review) if review else None,
                }
            ),
            200,
        )

    except Exception:
        logging.exception("Get own review API error")
        return (
            jsonify({"success": False, "message": "Unable to fetch your review."}),
            500,
        )


# ==========================================
# USER: EDIT OWN REVIEW
# ==========================================
@reviews_bp.route("/api/reviews/mine", methods=["PUT"])
@jwt_required()
def update_my_review():
    try:
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        user = get_current_user()

        if not user:
            return (
                jsonify({"success": False, "message": "User account not found."}),
                404,
            )

        if user.get("role") != "user":
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Only user accounts can edit reviews.",
                    }
                ),
                403,
            )

        data = request.get_json(silent=True)
        rating, comment, error = validate_review(data)

        if error:
            return jsonify({"success": False, "message": error}), 400

        collection = review_collection()
        now = datetime.now(timezone.utc)

        result = collection.update_one(
            {"user_id": user["user_id"]},
            {
                "$set": {
                    "rating": rating,
                    "comment": comment,
                    "status": "pending",
                    "updated_at": now,
                }
            },
        )

        if result.matched_count == 0:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "You have not submitted a review yet.",
                    }
                ),
                404,
            )

        review = collection.find_one({"user_id": user["user_id"]})

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Review updated. It is awaiting admin approval again.",
                    "review": serialize_review(review),
                }
            ),
            200,
        )

    except Exception:
        logging.exception("Update own review API error")
        return jsonify({"success": False, "message": "Unable to update review."}), 500


# ==========================================
# USER: DELETE OWN REVIEW
# ==========================================
@reviews_bp.route("/api/reviews/mine", methods=["DELETE"])
@jwt_required()
def delete_my_review():
    try:
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        user = get_current_user()

        if not user:
            return (
                jsonify({"success": False, "message": "User account not found."}),
                404,
            )

        if user.get("role") != "user":
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Only user accounts can delete reviews.",
                    }
                ),
                403,
            )

        result = review_collection().delete_one({"user_id": user["user_id"]})

        if result.deleted_count == 0:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "You have not submitted a review yet.",
                    }
                ),
                404,
            )

        return (
            jsonify({"success": True, "message": "Your review has been deleted."}),
            200,
        )

    except Exception:
        logging.exception("Delete own review API error")
        return jsonify({"success": False, "message": "Unable to delete review."}), 500


# ==========================================
# ADMIN: LIST ALL REVIEWS
# ==========================================
@reviews_bp.route("/api/admin/reviews", methods=["GET"])
@jwt_required()
def admin_get_reviews():
    try:
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        admin = get_current_user()

        if not admin or admin.get("role") != "admin":
            return jsonify({"success": False, "message": "Admin access required."}), 403

        collection = review_collection()
        reviews = list(collection.find({}).sort("created_at", -1).limit(500))

        return (
            jsonify(
                {
                    "success": True,
                    "total": collection.count_documents({}),
                    "reviews": [serialize_review(r) for r in reviews],
                }
            ),
            200,
        )

    except Exception:
        logging.exception("Admin list reviews API error")
        return jsonify({"success": False, "message": "Unable to fetch reviews."}), 500


# ==========================================
# ADMIN: APPROVE OR HIDE REVIEW
# ==========================================
@reviews_bp.route(
    "/api/admin/reviews/<review_id>/status",
    methods=["PATCH"],
)
@jwt_required()
def admin_update_review_status(review_id):
    try:
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        admin = get_current_user()

        if not admin or admin.get("role") != "admin":
            return jsonify({"success": False, "message": "Admin access required."}), 403

        review_filter = find_review_filter(review_id)
        if not review_filter:
            return jsonify({"success": False, "message": "Review not found."}), 404

        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return (
                jsonify(
                    {"success": False, "message": "Please provide valid JSON data."}
                ),
                400,
            )

        status = data.get("status")

        if status not in ALLOWED_STATUSES:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Status must be pending, approved or hidden.",
                    }
                ),
                400,
            )

        result = review_collection().update_one(
            review_filter,
            {
                "$set": {
                    "status": status,
                    "moderated_by": admin["user_id"],
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        if result.matched_count == 0:
            return jsonify({"success": False, "message": "Review not found."}), 404

        return (
            jsonify(
                {
                    "success": True,
                    "message": f"Review status updated to {status}.",
                    "status": status,
                }
            ),
            200,
        )

    except Exception:
        logging.exception("Admin review moderation API error")
        return (
            jsonify({"success": False, "message": "Unable to update review status."}),
            500,
        )


# ==========================================
# ADMIN: DELETE REVIEW
# ==========================================
@reviews_bp.route(
    "/api/admin/reviews/<review_id>",
    methods=["DELETE"],
)
@jwt_required()
def admin_delete_review(review_id):
    try:
        if database.db is None:
            return (
                jsonify({"success": False, "message": "Database is not connected."}),
                500,
            )

        admin = get_current_user()

        if not admin or admin.get("role") != "admin":
            return jsonify({"success": False, "message": "Admin access required."}), 403

        review_filter = find_review_filter(review_id)

        if not review_filter:
            return jsonify({"success": False, "message": "Review not found."}), 404

        result = review_collection().delete_one(review_filter)

        if result.deleted_count == 0:
            return jsonify({"success": False, "message": "Review not found."}), 404

        return (
            jsonify({"success": True, "message": "Review deleted successfully."}),
            200,
        )

    except Exception:
        logging.exception("Admin delete review API error")
        return jsonify({"success": False, "message": "Unable to delete review."}), 500
