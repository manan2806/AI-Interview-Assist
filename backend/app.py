import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from datetime import timedelta

from routes.auth_routes import auth_bp, bcrypt
from routes.profile_routes import user_bp
from routes.interview_routes import interview_bp
from routes.support_routes import support_bp


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
                    "https://ai-interview-assist-two.vercel.app",
                ],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
            }
        },
    )

    bcrypt.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(interview_bp, url_prefix="/api/interview")
    app.register_blueprint(support_bp)

    # print("\n========== REGISTERED INTERVIEW ROUTES ==========")

    # for rule in app.url_map.iter_rules():
    #     if str(rule).startswith("/api/interview"):
    #         print(rule)

    # print("=================================================\n")

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
