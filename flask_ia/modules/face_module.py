"""
Module 1 — Reconnaissance Faciale
==================================
ENTRÉE : verify-face → reconnaître visage à la sortie de cours
ADMIN  : register   → enregistrer visage à l'inscription
"""
import os, pickle, logging
from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.image_utils import decode_base64_image

face_bp = Blueprint("face", __name__)
logger  = logging.getLogger(__name__)

ENCODINGS_DIR  = os.environ.get("FACE_ENCODINGS_DIR", "/tmp/sc_encodings")
UPLOAD_DIR     = os.environ.get("FACE_UPLOAD_DIR",    "/tmp/sc_faces")
SEUIL_DISTANCE = float(os.environ.get("FACE_SEUIL", "0.50"))

os.makedirs(ENCODINGS_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR,    exist_ok=True)

# Import optionnel — mode simulation si non installé
try:
    import face_recognition as fr
    import numpy as np
    FACE_OK = True
except ImportError:
    FACE_OK = False
    logger.warning("face_recognition non installé — mode simulation activé")


# ── POST /api/ia/face/register ─────────────────────────────────────────────
@face_bp.route("/register", methods=["POST"])
def register():
    """
    Enregistrer le visage d'un étudiant (appelé après approuver() dans users/views.py).
    Body : { "etudiant_id": 5, "images_base64": ["...", "...", "..."] }
    → Sauvegarde les encodages dans /tmp/sc_encodings/etudiant_5.pkl
    """
    data        = request.get_json(silent=True) or {}
    etudiant_id = data.get("etudiant_id")
    images      = data.get("images_base64", [])

    if not etudiant_id or not images:
        return jsonify({"success": False, "message": "etudiant_id + images_base64 requis"}), 400

    if not FACE_OK:
        return jsonify({
            "success": True, "nb_encodages": len(images),
            "message": f"[SIMULATION] {len(images)} visage(s) enregistré(s) pour étudiant {etudiant_id}"
        })

    encodings, erreurs = [], []
    for i, b64 in enumerate(images):
        path = decode_base64_image(b64, UPLOAD_DIR, prefix=f"reg_{etudiant_id}_{i}")
        if not path:
            erreurs.append(f"Image {i+1} illisible"); continue
        try:
            img = fr.load_image_file(path)
            enc = fr.face_encodings(img)
            if not enc:       erreurs.append(f"Image {i+1} : aucun visage")
            elif len(enc) > 1: erreurs.append(f"Image {i+1} : plusieurs visages")
            else:             encodings.append(enc[0])
        except Exception as e:
            erreurs.append(f"Image {i+1} : {e}")
        finally:
            if os.path.exists(path): os.remove(path)

    if not encodings:
        return jsonify({"success": False, "message": "Aucun encodage valide", "erreurs": erreurs}), 400

    with open(os.path.join(ENCODINGS_DIR, f"etudiant_{etudiant_id}.pkl"), "wb") as f:
        pickle.dump(encodings, f)

    logger.info(f"[FACE REGISTER] etudiant={etudiant_id} nb={len(encodings)}")
    return jsonify({
        "success": True, "nb_encodages": len(encodings),
        "message": f"{len(encodings)} visage(s) enregistré(s)", "avertissements": erreurs
    })


# ── POST /api/ia/face/verify ───────────────────────────────────────────────
@face_bp.route("/verify", methods=["POST"])
def verify():
    """
    Reconnaître le visage à la SORTIE d'un cours.
    Appelé par Django : PointageFacialeView
    Body JSON   : { "image_base64": "...", "etudiant_id": 5 }
    OU multipart: champ 'image' + form 'etudiant_id'
    Réponse : { "reconnu": bool, "confiance": float, "message": str }
    """
    # Accepter JSON ou multipart
    if request.is_json:
        data        = request.get_json(silent=True) or {}
        etudiant_id = data.get("etudiant_id")
        b64         = data.get("image_base64")
        if not b64:
            return jsonify({"reconnu": False, "message": "image_base64 manquant"}), 400
        img_path = decode_base64_image(b64, UPLOAD_DIR, prefix=f"verify_{etudiant_id}")
    else:
        etudiant_id = request.form.get("etudiant_id")
        f           = request.files.get("image")
        if not f:
            return jsonify({"reconnu": False, "message": "image manquante"}), 400
        img_path = os.path.join(UPLOAD_DIR, f"verify_{etudiant_id}_{datetime.now().timestamp():.0f}.jpg")
        f.save(img_path)

    if not img_path:
        return jsonify({"reconnu": False, "message": "Image invalide"}), 400

    result = _reconnaitre(img_path, etudiant_id)

    if os.path.exists(img_path):
        os.remove(img_path)

    logger.info(f"[FACE VERIFY] etudiant={etudiant_id} reconnu={result['reconnu']} conf={result.get('confiance')}")
    return jsonify(result), 200 if result["reconnu"] else 400


# ── Helper ─────────────────────────────────────────────────────────────────
def _reconnaitre(img_path: str, etudiant_id) -> dict:
    enc_path = os.path.join(ENCODINGS_DIR, f"etudiant_{etudiant_id}.pkl")

    if not FACE_OK:
        # Mode simulation : accepte toujours avec 92% de confiance
        return {"reconnu": True, "confiance": 0.92, "etudiant_id": etudiant_id,
                "heure_sortie": datetime.now().isoformat(),
                "message": "[SIMULATION] Sortie validée — reconnaissance faciale (92.0%)"}

    if not os.path.exists(enc_path):
        return {"reconnu": False, "confiance": 0.0,
                "message": f"Aucun visage enregistré pour l'étudiant {etudiant_id}. Passez au bureau d'administration."}

    try:
        with open(enc_path, "rb") as f:
            refs = pickle.load(f)

        img  = fr.load_image_file(img_path)
        encs = fr.face_encodings(img)

        if not encs:
            return {"reconnu": False, "confiance": 0.0, "message": "Aucun visage détecté dans l'image"}

        distances = fr.face_distance(refs, encs[0])
        min_dist  = float(np.min(distances))
        confiance = round(1.0 - min_dist, 4)
        reconnu   = min_dist <= SEUIL_DISTANCE

        return {
            "reconnu":     reconnu,
            "confiance":   confiance,
            "etudiant_id": etudiant_id,
            "heure_sortie": datetime.now().isoformat(),
            "message": (f"Sortie validée ({confiance*100:.1f}%)" if reconnu
                        else f"Visage non reconnu — confiance {confiance*100:.1f}% (seuil {(1-SEUIL_DISTANCE)*100:.0f}%)")
        }
    except Exception as e:
        return {"reconnu": False, "confiance": 0.0, "message": f"Erreur IA : {e}"}
