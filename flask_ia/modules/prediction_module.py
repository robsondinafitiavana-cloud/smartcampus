"""
Module 2 — Prédiction Décrochage Étudiant (Module 7 Analyse & Data IA)
=======================================================================
Algorithme : Random Forest + fallback heuristique si sklearn absent
Features : taux_presence, moyenne_notes, nb_matieres_echec,
           retard_paiement, nb_absences_non_justifiees
"""
import os, pickle, logging
import numpy as np
from flask import Blueprint, request, jsonify
from datetime import datetime

prediction_bp = Blueprint("prediction", __name__)
logger = logging.getLogger(__name__)

MODEL_DIR   = os.environ.get("MODEL_DIR", "/tmp/sc_models")
MODEL_PATH  = os.path.join(MODEL_DIR, "risque_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "risque_scaler.pkl")
SEUIL_RISQUE = float(os.environ.get("PREDICTION_SEUIL", "0.45"))
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = ["taux_presence", "moyenne_notes", "nb_matieres_echec",
            "retard_paiement", "nb_absences_non_justifiees"]

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score
    SKLEARN_OK = True
except ImportError:
    SKLEARN_OK = False
    logger.warning("scikit-learn absent — mode heuristique activé")


# ── POST /api/ia/prediction/etudiant ──────────────────────────────────────
@prediction_bp.route("/etudiant", methods=["POST"])
def predict_etudiant():
    """
    Prédire le risque de décrochage d'UN étudiant.
    Body : {
      "etudiant_id": 5,
      "taux_presence": 62.5,           (% présence sur l'année)
      "moyenne_notes": 8.3,            (moyenne générale /20)
      "nb_matieres_echec": 4,          (matières avec note < 10)
      "retard_paiement": 1,            (0=non, 1=oui)
      "nb_absences_non_justifiees": 8
    }
    Réponse : { "risque": "eleve/moyen/faible", "probabilite": 0.78,
                "facteurs": [...], "recommandations": [...] }
    """
    data        = request.get_json(silent=True) or {}
    etudiant_id = data.get("etudiant_id")

    manquants = [f for f in FEATURES if f not in data]
    if manquants:
        return jsonify({"erreur": f"Champs manquants : {manquants}"}), 400

    features = [data[f] for f in FEATURES]
    result   = _predire(features, data)
    result["etudiant_id"] = etudiant_id

    logger.info(f"[PREDICTION] etudiant={etudiant_id} risque={result['risque']} prob={result['probabilite']}")
    return jsonify(result)


# ── POST /api/ia/prediction/batch ─────────────────────────────────────────
@prediction_bp.route("/batch", methods=["POST"])
def predict_batch():
    """
    Prédire le risque pour toute une promotion.
    Body : { "etudiants": [ {"etudiant_id":1, "taux_presence":70, ...}, ... ] }
    → Utilisé par le tableau de bord Direction (Module 7)
    """
    data      = request.get_json(silent=True) or {}
    etudiants = data.get("etudiants", [])

    if not etudiants:
        return jsonify({"erreur": "Liste etudiants vide"}), 400

    resultats, nb_eleve, nb_moyen, nb_faible = [], 0, 0, 0

    for etudiant in etudiants:
        eid      = etudiant.get("etudiant_id")
        manquants = [f for f in FEATURES if f not in etudiant]
        if manquants:
            resultats.append({"etudiant_id": eid, "erreur": f"Champs manquants: {manquants}"}); continue

        features = [etudiant[f] for f in FEATURES]
        r        = _predire(features, etudiant)
        r["etudiant_id"] = eid
        resultats.append(r)

        if   r["risque"] == "eleve":  nb_eleve  += 1
        elif r["risque"] == "moyen":  nb_moyen  += 1
        else:                          nb_faible += 1

    return jsonify({
        "total": len(resultats),
        "nb_risque_eleve":  nb_eleve,
        "nb_risque_moyen":  nb_moyen,
        "nb_risque_faible": nb_faible,
        "resultats":        resultats,
        "timestamp":        datetime.now().isoformat()
    })


# ── POST /api/ia/prediction/entrainer ─────────────────────────────────────
@prediction_bp.route("/entrainer", methods=["POST"])
def entrainer():
    """
    Entraîner le modèle sur l'historique.
    Body : {
      "donnees": [
        {"taux_presence":65,"moyenne_notes":8,...,"a_decroche":1},
        {"taux_presence":88,"moyenne_notes":14,...,"a_decroche":0},
        ...  (min. 20 exemples)
      ]
    }
    """
    if not SKLEARN_OK:
        return jsonify({"success": False, "message": "scikit-learn non installé"}), 500

    data    = request.get_json(silent=True) or {}
    donnees = data.get("donnees", [])

    if len(donnees) < 20:
        return jsonify({"success": False, "message": "Minimum 20 exemples requis"}), 400

    X = np.array([[d[f] for f in FEATURES] for d in donnees])
    y = np.array([d["a_decroche"] for d in donnees])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    scaler  = StandardScaler()
    X_tr_s  = scaler.fit_transform(X_train)
    X_te_s  = scaler.transform(X_test)

    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
    model.fit(X_tr_s, y_train)
    acc = accuracy_score(y_test, model.predict(X_te_s))

    with open(MODEL_PATH,  "wb") as f: pickle.dump(model,  f)
    with open(SCALER_PATH, "wb") as f: pickle.dump(scaler, f)

    importances = dict(zip(FEATURES, model.feature_importances_.tolist()))
    logger.info(f"[TRAIN] accuracy={acc:.3f} samples={len(donnees)}")

    return jsonify({
        "success": True, "accuracy": round(acc, 4),
        "nb_samples": len(donnees),
        "feature_importance": importances,
        "timestamp": datetime.now().isoformat()
    })


# ── GET /api/ia/prediction/info ────────────────────────────────────────────
@prediction_bp.route("/info", methods=["GET"])
def info():
    existe = os.path.exists(MODEL_PATH)
    return jsonify({
        "model_existe": existe,
        "sklearn_ok":   SKLEARN_OK,
        "features":     FEATURES,
        "seuil_risque": SEUIL_RISQUE,
        "mode": "production" if (existe and SKLEARN_OK) else "heuristique",
        "derniere_maj": datetime.fromtimestamp(os.path.getmtime(MODEL_PATH)).isoformat() if existe else None
    })


# ── Helpers ────────────────────────────────────────────────────────────────
def _predire(features: list, data: dict) -> dict:
    """Prédire via ML (si dispo) ou heuristique."""
    if SKLEARN_OK and os.path.exists(MODEL_PATH):
        return _predire_ml(features, data)
    return _predire_heuristique(data)

def _predire_ml(features: list, data: dict) -> dict:
    with open(MODEL_PATH,  "rb") as f: model  = pickle.load(f)
    with open(SCALER_PATH, "rb") as f: scaler = pickle.load(f)

    X      = scaler.transform([features])
    proba  = model.predict_proba(X)[0]
    prob   = float(proba[1])
    niveau = "eleve" if prob >= 0.65 else "moyen" if prob >= SEUIL_RISQUE else "faible"

    return {
        "risque": niveau, "probabilite": round(prob, 3),
        "facteurs": _facteurs(data), "recommandations": _recommandations(niveau, data),
        "mode": "ml"
    }

def _predire_heuristique(data: dict) -> dict:
    """Calcul de score de risque basé sur des règles métier SmartCampus."""
    score = 0.0
    if data.get("taux_presence", 100) < 70:         score += 0.30
    if data.get("taux_presence", 100) < 50:         score += 0.15
    if data.get("moyenne_notes", 20)   < 10:        score += 0.25
    if data.get("moyenne_notes", 20)   < 7:         score += 0.15
    if data.get("nb_matieres_echec", 0) >= 3:       score += 0.15
    if data.get("retard_paiement", 0)  == 1:        score += 0.10
    if data.get("nb_absences_non_justifiees", 0)>5: score += 0.10
    score  = min(score, 0.99)
    niveau = "eleve" if score >= 0.65 else "moyen" if score >= 0.45 else "faible"

    return {
        "risque": niveau, "probabilite": round(score, 3),
        "facteurs": _facteurs(data), "recommandations": _recommandations(niveau, data),
        "mode": "heuristique"
    }

def _facteurs(data: dict) -> list:
    f = []
    if data.get("taux_presence", 100) < 70:
        f.append({"facteur": "Absentéisme", "valeur": f"{data['taux_presence']}%", "gravite": "haute"})
    if data.get("moyenne_notes", 20) < 10:
        f.append({"facteur": "Résultats insuffisants", "valeur": f"{data['moyenne_notes']}/20", "gravite": "haute"})
    if data.get("nb_matieres_echec", 0) >= 3:
        f.append({"facteur": "Échecs multiples", "valeur": f"{data['nb_matieres_echec']} matières", "gravite": "moyenne"})
    if data.get("retard_paiement", 0):
        f.append({"facteur": "Retard paiement", "valeur": "Oui", "gravite": "moyenne"})
    if not f:
        f.append({"facteur": "Aucun facteur critique détecté", "valeur": "—", "gravite": "faible"})
    return f

def _recommandations(niveau: str, data: dict) -> list:
    r = []
    if niveau == "eleve":
        r += ["🚨 Convoquer immédiatement en entretien", "📞 Notifier les parents/tuteurs"]
    if data.get("taux_presence", 100) < 70:
        r += ["📋 Analyser les raisons des absences", "🗓️ Mettre en place un suivi hebdomadaire"]
    if data.get("moyenne_notes", 20) < 10:
        r += ["📚 Proposer des séances de rattrapage", "👥 Orienter vers le tutorat par les pairs"]
    if data.get("retard_paiement", 0):
        r.append("💳 Contacter le service financier pour un échéancier")
    return r if r else ["✅ Suivi normal — aucune action urgente"]
