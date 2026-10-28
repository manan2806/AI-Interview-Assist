from datetime import datetime, timezone
from functools import wraps
import random

from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from database import db

admin_announcements_bp = Blueprint(
    "admin_announcements",
    __name__,
    url_prefix="/api/admin/announcements",
)

user_announcements_bp = Blueprint(
    "user_announcements",
    __name__,
    url_prefix="/api/announcements",
)

announcements = db["announcements"]
users = db["users"]

ANNOUNCEMENT_TYPES = {
    "general",
    "maintenance",
    "feature",
    "important",
}

ANNOUNCEMENT_STATUSES = {
    "draft",
    "scheduled",
    "published",
}


def generate_announcement_code():
    while True:
        code = f"ANC-{random.randint(100000, 999999)}"

        existing = announcements.find_one({"announcement_code": code})

        if not existing:
            return code


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def parse_datetime(value):
    if not value:
        return None

    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))

        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)

        return parsed

    except (ValueError, TypeError, AttributeError):
        return None


def serialize_announcement(item, user_id=None):
    read_by = item.get("read_by", [])

    publish_at = item.get("publish_at")
    created_at = item.get("created_at")
    updated_at = item.get("updated_at")

    return {
        "id": str(item["_id"]),
        "announcement_code": item.get("announcement_code", ""),
        "title": item.get("title", ""),
        "message": item.get("message", ""),
        "type": item.get("type", "general"),
        "status": item.get("status", "draft"),
        "publish_at": (publish_at.isoformat() + "Z" if publish_at else None),
        "created_at": (created_at.isoformat() + "Z" if created_at else None),
        "updated_at": (updated_at.isoformat() + "Z" if updated_at else None),
        "created_by": item.get("created_by", ""),
        "created_by_name": item.get("created_by_name", "Admin"),
        "is_read": (user_id in read_by if user_id is not None else None),
    }


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()

        admin = users.find_one(
            {
                "user_id": str(identity),
                "role": "admin",
            }
        )

        if not admin:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Admin access required.",
                    }
                ),
                403,
            )

        return fn(*args, **kwargs)

    return wrapper


def current_user():
    identity = get_jwt_identity()

    return users.find_one(
        {
            "user_id": str(identity),
        }
    )


def activate_due_announcements():
    now = utc_now()

    announcements.update_many(
        {
            "status": "scheduled",
            "publish_at": {"$lte": now},
        },
        {
            "$set": {
                "status": "published",
                "updated_at": now,
            }
        },
    )


def validate_announcement_data(data, existing=None):
    existing = existing or {}

    title = data.get("title", existing.get("title", ""))
    message = data.get("message", existing.get("message", ""))
    kind = data.get("type", existing.get("type", "general"))
    status = data.get("status", existing.get("status", "draft"))

    if not isinstance(title, str) or not title.strip():
        return None, "Title is required."

    if len(title.strip()) > 150:
        return None, "Title must be 150 characters or fewer."

    if not isinstance(message, str) or not message.strip():
        return None, "Message is required."

    if len(message.strip()) > 5000:
        return None, "Message must be 5000 characters or fewer."

    if kind not in ANNOUNCEMENT_TYPES:
        return None, "Invalid announcement type."

    if status not in ANNOUNCEMENT_STATUSES:
        return None, "Invalid announcement status."

    raw_publish_at = data.get(
        "publish_at",
        existing.get("publish_at"),
    )

    publish_at = None

    if raw_publish_at:
        if isinstance(raw_publish_at, datetime):
            publish_at = raw_publish_at
        elif isinstance(raw_publish_at, str):
            publish_at = parse_datetime(raw_publish_at)

            if publish_at is None:
                return None, "Invalid publish date and time."

    if status == "scheduled":
        if publish_at is None:
            return None, "Select a date and time for scheduling."

        if publish_at <= utc_now():
            return None, "Scheduled date and time must be in the future."

    elif status == "published":
        publish_at = utc_now()

    return {
        "title": title.strip(),
        "message": message.strip(),
        "type": kind,
        "status": status,
        "publish_at": publish_at,
    }, None


# ==========================================
# ADMIN: LIST ANNOUNCEMENTS
# ==========================================
@admin_announcements_bp.route("", methods=["GET"])
@admin_required
def list_announcements():
    activate_due_announcements()

    items = list(announcements.find().sort("created_at", -1))

    return (
        jsonify(
            {
                "success": True,
                "announcements": [serialize_announcement(item) for item in items],
                "total": len(items),
            }
        ),
        200,
    )


# ==========================================
# ADMIN: CREATE ANNOUNCEMENT
# ==========================================
@admin_announcements_bp.route("", methods=["POST"])
@admin_required
def create_announcement():
    data = request.get_json(silent=True) or {}

    validated, error = validate_announcement_data(data)

    if error:
        return (
            jsonify(
                {
                    "success": False,
                    "message": error,
                }
            ),
            400,
        )

    admin = current_user()

    if not admin:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Admin account not found.",
                }
            ),
            404,
        )

    now = utc_now()

    item = {
        **validated,
        "announcement_code": generate_announcement_code(),
        "created_by": admin.get("user_id", ""),
        "created_by_name": admin.get("name", "Admin"),
        "created_at": now,
        "updated_at": now,
        "read_by": [],
    }

    result = announcements.insert_one(item)
    item["_id"] = result.inserted_id

    return (
        jsonify(
            {
                "success": True,
                "message": "Announcement created successfully.",
                "announcement": serialize_announcement(item),
            }
        ),
        201,
    )


# ==========================================
# ADMIN: UPDATE ANNOUNCEMENT
# ==========================================
@admin_announcements_bp.route(
    "/<announcement_id>",
    methods=["PUT"],
)
@admin_required
def update_announcement(announcement_id):
    if not ObjectId.is_valid(announcement_id):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Invalid announcement ID.",
                }
            ),
            400,
        )

    # Find existing announcement
    item = announcements.find_one(
        {
            "_id": ObjectId(announcement_id),
        }
    )

    if not item:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Announcement not found.",
                }
            ),
            404,
        )

    data = request.get_json(silent=True) or {}
    validated, error = validate_announcement_data(data, item)

    if error:
        return (
            jsonify(
                {
                    "success": False,
                    "message": error,
                }
            ),
            400,
        )

    # Update timestamp
    now = utc_now()
    validated["updated_at"] = now
    validated["read_by"] = []

    # Update announcement in MongoDB
    announcements.update_one(
        {"_id": item["_id"]},
        {"$set": validated},
    )

    updated = announcements.find_one(
        {
            "_id": item["_id"],
        }
    )

    return (
        jsonify(
            {
                "success": True,
                "message": (
                    "Announcement updated successfully. "
                    "It is now unread for all users."
                ),
                "announcement": serialize_announcement(updated),
            }
        ),
        200,
    )


# ==========================================
# ADMIN: DELETE ANNOUNCEMENT
# ==========================================
@admin_announcements_bp.route(
    "/<announcement_id>",
    methods=["DELETE"],
)
@admin_required
def delete_announcement(announcement_id):
    if not ObjectId.is_valid(announcement_id):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Invalid announcement ID.",
                }
            ),
            400,
        )

    result = announcements.delete_one(
        {
            "_id": ObjectId(announcement_id),
        }
    )

    if result.deleted_count == 0:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Announcement not found.",
                }
            ),
            404,
        )

    return (
        jsonify(
            {
                "success": True,
                "message": "Announcement deleted successfully.",
            }
        ),
        200,
    )


# ==========================================
# USER: VIEW PUBLISHED ANNOUNCEMENTS
# ==========================================
@user_announcements_bp.route("", methods=["GET"])
@jwt_required()
def get_user_announcements():
    user = current_user()

    if not user:
        return (
            jsonify({
                "success": False,
                "message": "User account not found.",
            }),
            404,
        )

    activate_due_announcements()

    now = utc_now()
    user_id = str(user.get("user_id", ""))

    def normalize_datetime(value):
        """Convert datetime or ISO date string to UTC-naive datetime."""
        if isinstance(value, str):
            try:
                value = datetime.fromisoformat(
                    value.replace("Z", "+00:00")
                )
            except (ValueError, TypeError):
                return None

        if not isinstance(value, datetime):
            return None

        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)

        return value

    # User registration date
    registered_at = normalize_datetime(user.get("created_at"))

    # Without a valid registration date, don't expose announcements.
    if registered_at is None:
        return (
            jsonify({
                "success": True,
                "announcements": [],
                "unread_count": 0,
            }),
            200,
        )

    # Fetch currently published announcements only.
    items = list(
        announcements.find({
            "status": "published",
            "$or": [
                {"publish_at": None},
                {"publish_at": {"$lte": now}},
            ],
        }).sort("publish_at", -1)
    )

    visible_items = []

    for item in items:
        # Prefer the actual publication/scheduled publication date.
        published_at = normalize_datetime(item.get("publish_at"))

        # Legacy announcements may not have publish_at.
        if published_at is None:
            published_at = normalize_datetime(item.get("created_at"))

        if published_at is None:
            continue

        # Only show announcements published at or after registration.
        if published_at >= registered_at:
            visible_items.append(item)

    result = [
        serialize_announcement(item, user_id=user_id)
        for item in visible_items
    ]

    unread_count = sum(
        1 for item in result if not item.get("is_read", False)
    )

    return (
        jsonify({
            "success": True,
            "announcements": result,
            "unread_count": unread_count,
        }),
        200,
    )


# ==========================================
# USER: MARK ANNOUNCEMENT AS READ
# ==========================================
@user_announcements_bp.route(
    "/<announcement_id>/read",
    methods=["POST"],
)
@jwt_required()
def mark_announcement_read(announcement_id):
    user = current_user()

    if not user:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "User account not found.",
                }
            ),
            404,
        )

    if not ObjectId.is_valid(announcement_id):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Invalid announcement ID.",
                }
            ),
            400,
        )

    user_id = str(user.get("user_id", ""))

    result = announcements.update_one(
        {
            "_id": ObjectId(announcement_id),
            "status": "published",
        },
        {
            "$addToSet": {"read_by": user_id},
        },
    )

    if result.matched_count == 0:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Published announcement not found.",
                }
            ),
            404,
        )

    return (
        jsonify(
            {
                "success": True,
                "message": "Announcement marked as read.",
            }
        ),
        200,
    )
