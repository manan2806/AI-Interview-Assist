import os
import jwt

from datetime import datetime, timedelta


def generate_token(user):

    payload = {

        "user_id": user["user_id"],

        "email": user["email"],

        "exp": datetime.utcnow() + timedelta(hours=24)

    }

    token = jwt.encode(

        payload,

        os.getenv("JWT_SECRET_KEY"),

        algorithm="HS256"

    )

    return token