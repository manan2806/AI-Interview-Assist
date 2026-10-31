import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from datetime import timedelta
from extensions import limiter

from routes.auth_routes import auth_bp, bcrypt
from routes.profile_routes import user_bp
from routes.interview_routes import interview_bp
from routes.support_routes import support_bp
from routes.admin_routes import admin_bp
from routes.announcements_routes import admin_announcements_bp, user_announcements_bp
from routes.reviews_routes import reviews_bp
from routes.reports_routes import reports_bp
from routes.activity_logs_routes import activity_logs_bp


def create_app():
    load_dotenv()

    app = Flask(__name__)

    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
    JWTManager(app)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:5173",
                    "https://interview78.vercel.app",
                ],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
            }
        },
    )

    bcrypt.init_app(app)
    limiter.init_app(app)

    @app.errorhandler(429)
    def handle_rate_limit(error):
        return (
            jsonify(
                {"success": False, "message": "Unable to login. Please try again."}
            ),
            429,
        )

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(interview_bp, url_prefix="/api/interview")
    app.register_blueprint(support_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(admin_announcements_bp)
    app.register_blueprint(user_announcements_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(activity_logs_bp)

    @app.route("/", methods=["GET"])
    def home():
        return jsonify(
            {"success": True, "message": "AI Interview Assist Backend is Running 🚀"}
        )

    return app


app = create_app()
app.secret_key = os.getenv("FLASK_SECRET_KEY", "local-development-secret-key")
if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)
