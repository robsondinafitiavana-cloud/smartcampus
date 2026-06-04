"""
Module 3 — Test d'Admission Intelligent
=========================================
Remplace les questions statiques du TestAdmission.js actuel
par une banque de questions dynamique côté serveur.

ENTRÉE  : POST /api/ia/admission/questions → génère QCM pour une filière
ÉVAL    : POST /api/ia/admission/evaluer   → évalue réponses + score
"""
import os, json, base64, hmac, hashlib, random, logging
from flask import Blueprint, request, jsonify
from datetime import datetime

admission_bp = Blueprint("admission", __name__)
logger = logging.getLogger(__name__)

SESSION_SECRET  = os.environ.get("SESSION_SECRET",   "sc-session-2025")
SEUIL_ADMISSION = int(os.environ.get("SEUIL_ADMISSION", "60"))

# ── Banque de questions (plus complète que le front statique) ──────────────
BANQUE = {
    "INF": [
        {"q":"Qu'est-ce qu'un algorithme ?",
         "r":["Une suite d'instructions pour résoudre un problème","Un langage de programmation","Un type de données","Un système d'exploitation"], "b":0, "pts":2},
        {"q":"Que signifie HTML ?",
         "r":["HyperText Markup Language","High Transfer Markup Language","HyperText Modern Link","Home Tool Markup Language"],"b":0,"pts":2},
        {"q":"Quelle structure de données fonctionne en LIFO ?",
         "r":["File","Pile","Tableau","Liste chaînée"],"b":1,"pts":3},
        {"q":"Quelle est la complexité de la recherche dichotomique ?",
         "r":["O(n)","O(n²)","O(log n)","O(1)"],"b":2,"pts":3},
        {"q":"Qu'est-ce qu'une clé primaire en base de données ?",
         "r":["Un mot de passe","Un identifiant unique pour chaque enregistrement","Un champ obligatoire","Un index de performance"],"b":1,"pts":2},
        {"q":"Quelle est la valeur de 2^10 ?",
         "r":["512","1024","2048","256"],"b":1,"pts":2},
        {"q":"Qu'est-ce que la récursivité ?",
         "r":["Une boucle infinie","Un type de variable","Une fonction qui s'appelle elle-même","Un protocole réseau"],"b":2,"pts":3},
        {"q":"Quel protocole sécurise les échanges sur le web ?",
         "r":["HTTP","FTP","HTTPS","SMTP"],"b":2,"pts":2},
        {"q":"Qu'est-ce qu'un pointeur en programmation ?",
         "r":["Un curseur de souris","Une variable qui stocke une adresse mémoire","Un type de boucle","Un opérateur mathématique"],"b":1,"pts":3},
        {"q":"Que signifie API ?",
         "r":["Application Programming Interface","Applied Program Integration","Automatic Process Indexing","Application Protocol Input"],"b":0,"pts":2},
        {"q":"Qu'est-ce qu'un commit en Git ?",
         "r":["Un type d'erreur","Une sauvegarde d'un état du code","Une branche","Un déploiement"],"b":1,"pts":3},
        {"q":"Quelle est la différence entre TCP et UDP ?",
         "r":["Aucune","TCP est fiable avec accusé de réception, UDP est rapide sans garantie","UDP est plus lent que TCP","TCP est sans connexion"],"b":1,"pts":3},
    ],
    "GST": [
        {"q":"Qu'est-ce que le bilan comptable ?",
         "r":["Un résumé des ventes","Un document présentant actif et passif à une date donnée","Un plan de trésorerie","Un rapport de performance"],"b":1,"pts":2},
        {"q":"Que signifie ROI ?",
         "r":["Return on Investment","Rate of Interest","Risk of Insolvency","Revenue Over Income"],"b":0,"pts":2},
        {"q":"Qu'est-ce que le seuil de rentabilité ?",
         "r":["Le chiffre d'affaires maximum","Le point où l'entreprise couvre tous ses coûts","Le bénéfice net","Le capital minimum"],"b":1,"pts":3},
        {"q":"Qu'est-ce que la méthode FIFO en gestion des stocks ?",
         "r":["Premier entré, premier sorti","Dernier entré, premier sorti","Coût moyen pondéré","Coût standard"],"b":0,"pts":3},
        {"q":"Qu'est-ce qu'un amortissement ?",
         "r":["Une augmentation de valeur","La perte de valeur progressive d'un actif","Un remboursement de dette","Un bénéfice exceptionnel"],"b":1,"pts":3},
        {"q":"Que signifie \"charge fixe\" ?",
         "r":["Une charge qui varie avec le volume de production","Une charge indépendante du niveau d'activité","Une charge exceptionnelle","Un impôt"],"b":1,"pts":3},
        {"q":"Qu'est-ce que le fonds de roulement ?",
         "r":["Le capital social de l'entreprise","L'excédent des ressources stables sur les emplois stables","Le chiffre d'affaires annuel","Le bénéfice distribuable"],"b":1,"pts":3},
        {"q":"Qu'est-ce qu'une charge variable ?",
         "r":["Une charge constante","Une charge qui évolue proportionnellement au niveau d'activité","Un loyer","Un salaire"],"b":1,"pts":3},
        {"q":"Que signifie EBE (Excédent Brut d'Exploitation) ?",
         "r":["Les ventes brutes","Le résultat avant intérêts, impôts, dotations et amortissements","Le résultat net","Le capital investi"],"b":1,"pts":3},
        {"q":"Qu'est-ce que la trésorerie nette ?",
         "r":["Le bénéfice net","Disponibilités moins dettes financières court terme","Le chiffre d'affaires","Le résultat exceptionnel"],"b":1,"pts":2},
    ],
    "DRT": [
        {"q":"Qu'est-ce que la présomption d'innocence ?",
         "r":["Toute personne est coupable jusqu'à preuve du contraire","Toute personne est innocente jusqu'à preuve du contraire","Le droit de garder le silence","Le droit à un avocat"],"b":1,"pts":2},
        {"q":"Quelle est la différence entre droit civil et droit pénal ?",
         "r":["Aucune","Civil: conflits privés; Pénal: infractions contre la société","Civil: infractions; Pénal: contrats","Civil: national; Pénal: international"],"b":1,"pts":3},
        {"q":"Qu'est-ce qu'un contrat synallagmatique ?",
         "r":["Un contrat unilatéral","Un contrat avec obligations réciproques entre les parties","Un contrat verbal","Un contrat international"],"b":1,"pts":3},
        {"q":"Qu'est-ce que la force majeure en droit ?",
         "r":["Un cas prévu au contrat","Un événement imprévisible, irrésistible et extérieur exonérant de responsabilité","Une clause pénale","Un avenant au contrat"],"b":1,"pts":3},
        {"q":"Que signifie \"nullité relative\" d'un contrat ?",
         "r":["Le contrat est nul de plein droit","Seule la partie protégée peut invoquer la nullité","Toute personne peut invoquer la nullité","Le contrat est valable"],"b":1,"pts":3},
        {"q":"Qu'est-ce que la responsabilité délictuelle ?",
         "r":["La responsabilité issue d'un contrat","La responsabilité du fait d'un acte causant un préjudice sans contrat","La responsabilité pénale","La responsabilité administrative"],"b":1,"pts":3},
        {"q":"Qu'est-ce qu'une servitude en droit immobilier ?",
         "r":["Un type de contrat de location","Une charge imposée sur un fonds au profit d'un autre","Un droit de propriété total","Une expropriation"],"b":1,"pts":3},
        {"q":"Que signifie le principe \"non bis in idem\" ?",
         "r":["On ne peut pas condamner deux personnes pour le même fait","On ne peut pas être jugé deux fois pour la même infraction","Un accusé peut faire appel deux fois","La double peine est permise"],"b":1,"pts":3},
        {"q":"Qu'est-ce qu'une hypothèque ?",
         "r":["Un type de contrat de vente","Une garantie réelle immobilière accordée à un créancier","Un acte de donation","Un bail commercial"],"b":1,"pts":2},
        {"q":"Que signifie la personnalité juridique ?",
         "r":["Le droit d'être citoyen","L'aptitude à être titulaire de droits et d'obligations","Le droit de vote","La capacité pénale"],"b":1,"pts":2},
    ]
}


# ── POST /api/ia/admission/questions ──────────────────────────────────────
@admission_bp.route("/questions", methods=["POST"])
def generer_questions():
    """
    Générer un QCM aléatoire pour une filière.
    Body : { "filiere": "INF", "nb_questions": 15, "candidat_id": "abc123" }
    Retour : { questions (sans bonnes réponses), session_token, points_total }
    """
    data         = request.get_json(silent=True) or {}
    filiere      = data.get("filiere", "").upper()
    nb_questions = min(int(data.get("nb_questions", 15)), 15)
    candidat_id  = str(data.get("candidat_id", ""))

    if filiere not in BANQUE:
        return jsonify({"erreur": f"Filière inconnue. Disponibles: {list(BANQUE.keys())}"}), 400
    if not candidat_id:
        return jsonify({"erreur": "candidat_id requis"}), 400

    pool     = BANQUE[filiere].copy()
    random.shuffle(pool)
    selected = pool[:nb_questions]

    questions_client = []
    session_data     = []

    for i, q in enumerate(selected):
        # Mélanger les choix pour éviter que la bonne réponse soit toujours au même index
        idx_melanges = list(range(len(q["r"])))
        random.shuffle(idx_melanges)
        choix_melanges = [q["r"][j] for j in idx_melanges]
        bonne_nouvelle = idx_melanges.index(q["b"])

        questions_client.append({
            "id":        i,
            "question":  q["q"],
            "choix":     choix_melanges,
            "points":    q["pts"],
        })
        session_data.append({
            "id":    i,
            "bonne": bonne_nouvelle,
            "pts":   q["pts"]
        })

    points_total  = sum(q["pts"] for q in selected)
    session_token = _creer_session(session_data, candidat_id, filiere)

    return jsonify({
        "filiere":       filiere,
        "nb_questions":  len(questions_client),
        "points_total":  points_total,
        "duree_minutes": nb_questions * 1 + 5,  # ~1 min/question + 5 min marge
        "questions":     questions_client,
        "session_token": session_token,
        "timestamp":     datetime.now().isoformat()
    })


# ── POST /api/ia/admission/evaluer ────────────────────────────────────────
@admission_bp.route("/evaluer", methods=["POST"])
def evaluer():
    """
    Évaluer les réponses d'un candidat.
    Body : {
      "candidat_id": "abc123",
      "filiere": "INF",
      "session_token": "...",
      "reponses": { "0": 2, "1": 0, "3": 1, ... }  (id_question: index_choisi)
    }
    Retour : { "admis": bool, "score": 73, "nb_bonnes": 11, "detail": [...] }
    """
    data          = request.get_json(silent=True) or {}
    candidat_id   = str(data.get("candidat_id", ""))
    filiere       = data.get("filiere", "").upper()
    session_token = data.get("session_token", "")
    reponses      = data.get("reponses", {})

    if not all([candidat_id, filiere, session_token]):
        return jsonify({"erreur": "candidat_id, filiere et session_token requis"}), 400

    session = _lire_session(session_token, candidat_id, filiere)
    if not session:
        return jsonify({"erreur": "Session invalide ou expirée (30 min max)"}), 400

    pts_obtenu, pts_total, detail = 0, 0, []

    for q in session["questions"]:
        qid     = str(q["id"])
        bonne   = q["bonne"]
        pts     = q["pts"]
        repondu = int(reponses.get(qid, -1))
        correct = repondu == bonne

        if correct:
            pts_obtenu += pts
        pts_total += pts

        detail.append({
            "question_id": q["id"],
            "correct":     correct,
            "points":      pts if correct else 0,
            "points_max":  pts
        })

    score = round((pts_obtenu / pts_total * 100) if pts_total > 0 else 0, 1)
    admis = score >= SEUIL_ADMISSION
    nb_bonnes = sum(1 for d in detail if d["correct"])

    niveau = ("Excellent" if score >= 85 else "Bien" if score >= 70
              else "Passable" if score >= SEUIL_ADMISSION else "Insuffisant")

    logger.info(f"[ADMISSION] candidat={candidat_id} filiere={filiere} score={score}% admis={admis}")

    return jsonify({
        "candidat_id":  candidat_id,
        "filiere":      filiere,
        "admis":        admis,
        "score":        score,
        "nb_bonnes":    nb_bonnes,
        "nb_questions": len(session["questions"]),
        "niveau":       niveau,
        "seuil_requis": SEUIL_ADMISSION,
        "detail":       detail,
        "message": (f"✅ Félicitations ! Admis(e) en {filiere} avec {score}%."
                    if admis else
                    f"❌ Score insuffisant ({score}%). Seuil requis : {SEUIL_ADMISSION}%."),
        "timestamp": datetime.now().isoformat()
    })


# ── Helpers session ─────────────────────────────────────────────────────
def _creer_session(questions: list, candidat_id: str, filiere: str) -> str:
    payload = json.dumps({
        "questions":  questions,
        "cid":        candidat_id,
        "filiere":    filiere,
        "ts":         int(datetime.now().timestamp())
    })
    encoded = base64.b64encode(payload.encode()).decode()
    sig     = hmac.new(SESSION_SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()
    return f"{encoded}.{sig}"

def _lire_session(token: str, candidat_id: str, filiere: str):
    try:
        encoded, sig = token.rsplit(".", 1)
        expected     = hmac.new(SESSION_SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(base64.b64decode(encoded).decode())
        if payload.get("cid") != candidat_id: return None
        if payload.get("filiere") != filiere: return None
        if int(datetime.now().timestamp()) - payload.get("ts", 0) > 1800: return None  # 30 min
        return payload
    except Exception:
        return None
