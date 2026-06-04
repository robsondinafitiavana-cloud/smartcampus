"""
presences/ia_client.py
======================
Client HTTP Django → Flask IA
Appelé par PointageFacialeView et RegisterFaceView dans views.py
"""
import requests, os, logging

logger = logging.getLogger(__name__)

FLASK_URL = os.environ.get("FLASK_IA_URL",         "http://localhost:5001")
SECRET    = os.environ.get("DJANGO_FLASK_SECRET",   "smartcampus-ia-secret-2025")
TIMEOUT   = int(os.environ.get("FLASK_IA_TIMEOUT", "15"))

HEADERS = {
    "X-SmartCampus-Secret": SECRET,
    "Content-Type":         "application/json"
}


def verifier_visage(image_base64: str, etudiant_id: int) -> dict:
    """
    Appelle Flask IA pour reconnaître le visage à la sortie.
    Retourne { "reconnu": bool, "confiance": float, "message": str }
    """
    url = f"{FLASK_URL}/api/ia/face/verify"
    try:
        r = requests.post(url, json={
            "image_base64": image_base64,
            "etudiant_id":  etudiant_id
        }, headers=HEADERS, timeout=TIMEOUT)
        data = r.json()
        data["_status"] = r.status_code
        return data
    except requests.ConnectionError:
        logger.error(f"[IA Client] Flask IA inaccessible : {url}")
        return {"reconnu": False, "message": "Service IA indisponible", "_status": 503}
    except requests.Timeout:
        logger.error(f"[IA Client] Flask IA timeout ({TIMEOUT}s)")
        return {"reconnu": False, "message": "Service IA timeout", "_status": 504}
    except Exception as e:
        return {"reconnu": False, "message": str(e), "_status": 500}


def enregistrer_visage(etudiant_id: int, images_base64: list) -> dict:
    """
    Appelle Flask IA pour enregistrer le visage d'un étudiant.
    Appelé dans users/views.py → DemandeInscriptionViewSet.approuver()
    Retourne { "success": bool, "nb_encodages": int, "message": str }
    """
    url = f"{FLASK_URL}/api/ia/face/register"
    try:
        r = requests.post(url, json={
            "etudiant_id":  etudiant_id,
            "images_base64": images_base64
        }, headers=HEADERS, timeout=TIMEOUT)
        return r.json()
    except Exception as e:
        logger.error(f"[IA Client] Erreur enregistrement visage : {e}")
        return {"success": False, "message": str(e)}


def flask_health() -> bool:
    """Vérifie si Flask IA est en ligne."""
    try:
        r = requests.get(f"{FLASK_URL}/health", timeout=3)
        return r.status_code == 200
    except Exception:
        return False
