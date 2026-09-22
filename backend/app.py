import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from datetime import timedelta

from routes.auth_routes import auth_bp, bcrypt
from routes.profile_routes import user_bp
from routes.interview_routes import interview_bp

def create_app():

    load_dotenv()

    app = Flask(__name__)

    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

    JWTManager(app)

    CORS(app)

    bcrypt.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(
        interview_bp,
        url_prefix="/api/interview"
    )

    @app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "success": True,
            "message": "AI Interview Assist Backend is Running 🚀"
        })

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0",debug=True, port=5000)