"""
SmartCampus — Microservice Flask IA (Port 5001)
===============================================
3 modules IA :
  1. Reconnaissance Faciale (Présences)  → /api/ia/face/*
  2. Prédiction Décrochage (Analyse)     → /api/ia/prediction/*
  3. Test d'Admission Intelligent        → /api/ia/admission/*

Sécurité : header X-SmartCampus-Secret partagé avec Django
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os, logging
from functools import wraps

from modules.face_module     import face_bp
from modules.prediction_module import prediction_bp
from modules.admission_module  import admission_bp

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

SHARED_SECRET = os.environ.get("DJANGO_FLASK_SECRET", "smartcampus-ia-secret-2025")

@app.before_request
def verifier_secret():
    """Middleware : toutes les routes /api/ia/* nécessitent le secret."""
    if request.path.startswith("/api/ia/"):
        secret = request.headers.get("X-SmartCampus-Secret", "")
        if secret != SHARED_SECRET:
            return jsonify({"erreur": "Non autorisé — secret invalide"}), 401

app.register_blueprint(face_bp,       url_prefix="/api/ia/face")
app.register_blueprint(prediction_bp, url_prefix="/api/ia/prediction")
app.register_blueprint(admission_bp,  url_prefix="/api/ia/admission")

@app.route("/health")
def health():
    from datetime import datetime
    return jsonify({
        "status":    "ok",
        "service":   "SmartCampus IA",
        "modules":   ["face", "prediction", "admission"],
        "timestamp": datetime.now().isoformat()
    })

if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
