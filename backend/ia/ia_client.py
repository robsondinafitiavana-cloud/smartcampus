"""
ia/ia_client.py — Client HTTP Django → Flask IA
Prédiction décrochage + Test admission
"""
import requests, os, logging

logger  = logging.getLogger(__name__)
FLASK   = os.environ.get("FLASK_IA_URL",        "http://localhost:5001")
SECRET  = os.environ.get("DJANGO_FLASK_SECRET",  "smartcampus-ia-secret-2025")
TIMEOUT = int(os.environ.get("FLASK_IA_TIMEOUT", "15"))
HEADERS = {"X-SmartCampus-Secret": SECRET, "Content-Type": "application/json"}


def _post(endpoint: str, payload: dict) -> dict:
    url = f"{FLASK}{endpoint}"
    try:
        r = requests.post(url, json=payload, headers=HEADERS, timeout=TIMEOUT)
        d = r.json(); d["_status"] = r.status_code; return d
    except requests.ConnectionError:
        return {"erreur": "Flask IA inaccessible", "_status": 503}
    except requests.Timeout:
        return {"erreur": "Flask IA timeout", "_status": 504}
    except Exception as e:
        return {"erreur": str(e), "_status": 500}

def _get(endpoint: str) -> dict:
    try:
        r = requests.get(f"{FLASK}{endpoint}", headers=HEADERS, timeout=TIMEOUT)
        return r.json()
    except Exception as e:
        return {"erreur": str(e)}

# ── Prédiction ─────────────────────────────────────────────────────────────
def predire_etudiant(etudiant_id, taux_presence, moyenne_notes,
                     nb_matieres_echec, retard_paiement, nb_absences):
    return _post("/api/ia/prediction/etudiant", {
        "etudiant_id": etudiant_id,
        "taux_presence": taux_presence,
        "moyenne_notes": moyenne_notes,
        "nb_matieres_echec": nb_matieres_echec,
        "retard_paiement": retard_paiement,
        "nb_absences_non_justifiees": nb_absences
    })

def predire_batch(etudiants: list):
    return _post("/api/ia/prediction/batch", {"etudiants": etudiants})

def entrainer_modele(donnees: list):
    return _post("/api/ia/prediction/entrainer", {"donnees": donnees})

def info_modele():
    return _get("/api/ia/prediction/info")

# ── Admission ──────────────────────────────────────────────────────────────
def generer_questions(filiere: str, nb_questions: int, candidat_id: str):
    return _post("/api/ia/admission/questions", {
        "filiere": filiere, "nb_questions": nb_questions, "candidat_id": candidat_id
    })

def evaluer_admission(candidat_id: str, filiere: str, session_token: str, reponses: dict):
    return _post("/api/ia/admission/evaluer", {
        "candidat_id": candidat_id, "filiere": filiere,
        "session_token": session_token, "reponses": reponses
    })
