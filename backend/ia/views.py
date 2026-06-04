"""
ia/views.py — Django REST Views Module IA
==========================================
Prédiction décrochage (Module 7) + Test admission intelligent (Module 1)
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from .models import PredictionRisque, ResultatAdmission
from . import ia_client as ia

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════
# PRÉDICTION DÉCROCHAGE (Module 7 — Analyse & Data IA)
# ══════════════════════════════════════════════════════════

class PredictionEtudiantView(APIView):
    """
    POST /api/ia/prediction/etudiant/
    Prédire le risque de décrochage d'un étudiant.
    Agrège les données depuis presences + notes + paiements
    puis appelle Flask IA.

    Corps : {
      "etudiant_id": 5,
      "taux_presence": 62.5,
      "moyenne_notes": 8.3,
      "nb_matieres_echec": 4,
      "retard_paiement": 1,
      "nb_absences_non_justifiees": 8
    }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        d = request.data
        champs = ["etudiant_id","taux_presence","moyenne_notes",
                  "nb_matieres_echec","retard_paiement","nb_absences_non_justifiees"]
        manquants = [c for c in champs if c not in d]
        if manquants:
            return Response({"erreur": f"Champs manquants : {manquants}"}, status=400)

        result = ia.predire_etudiant(
            etudiant_id=d["etudiant_id"],
            taux_presence=float(d["taux_presence"]),
            moyenne_notes=float(d["moyenne_notes"]),
            nb_matieres_echec=int(d["nb_matieres_echec"]),
            retard_paiement=int(d["retard_paiement"]),
            nb_absences=int(d["nb_absences_non_justifiees"])
        )

        if result.get("_status", 200) >= 400:
            return Response({"erreur": result.get("erreur", "Erreur IA")}, status=503)

        # Sauvegarder en DB
        if "risque" in result:
            PredictionRisque.objects.create(
                etudiant_id=d["etudiant_id"],
                risque=result["risque"],
                probabilite=result["probabilite"],
                facteurs=result.get("facteurs", []),
                recommandations=result.get("recommandations", []),
                mode_calcul=result.get("mode", "heuristique")
            )
        return Response(result)


class PredictionBatchView(APIView):
    """
    POST /api/ia/prediction/batch/
    Analyser toute une promotion — tableau de bord Direction.
    Corps : { "etudiants": [ {"etudiant_id":1, ...}, ... ] }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        etudiants = request.data.get("etudiants", [])
        if not etudiants:
            return Response({"erreur": "Liste etudiants vide"}, status=400)

        result = ia.predire_batch(etudiants)

        # Sauvegarder les risques élevés et moyens
        for r in result.get("resultats", []):
            if "risque" in r and r["risque"] in ("moyen", "eleve"):
                PredictionRisque.objects.update_or_create(
                    etudiant_id=r["etudiant_id"],
                    defaults={
                        "risque":      r["risque"],
                        "probabilite": r["probabilite"],
                        "facteurs":    r.get("facteurs", []),
                    }
                )
        return Response(result)


class PredictionHistoriqueView(APIView):
    """
    GET /api/ia/prediction/historique/?etudiant_id=5&risque=eleve
    Historique des prédictions sauvegardées.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = PredictionRisque.objects.all()
        if request.query_params.get("etudiant_id"):
            qs = qs.filter(etudiant_id=request.query_params["etudiant_id"])
        if request.query_params.get("risque"):
            qs = qs.filter(risque=request.query_params["risque"])
        qs = qs[:50]
        return Response([{
            "id": p.id, "etudiant_id": p.etudiant_id,
            "risque": p.risque, "probabilite": p.probabilite,
            "facteurs": p.facteurs, "recommandations": p.recommandations,
            "mode_calcul": p.mode_calcul,
            "created_at": p.created_at.isoformat()
        } for p in qs])


class EntrainerModeleView(APIView):
    """
    POST /api/ia/prediction/entrainer/
    Entraîner le modèle ML sur l'historique (admin uniquement).
    Corps : { "donnees": [...] }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'admin':
            return Response({"erreur": "Réservé aux administrateurs"}, status=403)
        donnees = request.data.get("donnees", [])
        if len(donnees) < 20:
            return Response({"erreur": "Minimum 20 exemples requis"}, status=400)
        result = ia.entrainer_modele(donnees)
        return Response(result)


# ══════════════════════════════════════════════════════════
# TEST D'ADMISSION INTELLIGENT (Module 1)
# ══════════════════════════════════════════════════════════

class AdmissionQuestionsView(APIView):
    """
    POST /api/ia/admission/questions/
    PUBLIC — Générer un QCM pour le test d'admission.
    Remplace les questions statiques du TestAdmission.js.
    Corps : { "filiere": "INF", "nb_questions": 15, "candidat_id": "email@..." }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        filiere      = request.data.get("filiere")
        nb_questions = int(request.data.get("nb_questions", 15))
        candidat_id  = request.data.get("candidat_id")

        if not filiere or not candidat_id:
            return Response({"erreur": "filiere et candidat_id requis"}, status=400)

        result = ia.generer_questions(filiere.upper(), nb_questions, str(candidat_id))

        if result.get("_status", 200) >= 400 or "erreur" in result:
            return Response({"erreur": result.get("erreur", "Erreur IA")}, status=400)

        return Response(result)


class AdmissionEvaluerView(APIView):
    """
    POST /api/ia/admission/evaluer/
    PUBLIC — Évaluer les réponses et donner la décision d'admission.
    Corps : {
      "candidat_id": "email@...",
      "filiere": "INF",
      "session_token": "...",
      "reponses": { "0": 2, "1": 0, ... }
    }
    → Si admis : sauvegarde en DB pour que l'admin voit les candidats admis
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        d = request.data
        champs = ["candidat_id", "filiere", "session_token", "reponses"]
        manquants = [c for c in champs if c not in d]
        if manquants:
            return Response({"erreur": f"Champs manquants : {manquants}"}, status=400)

        result = ia.evaluer_admission(
            candidat_id=str(d["candidat_id"]),
            filiere=d["filiere"].upper(),
            session_token=d["session_token"],
            reponses={str(k): int(v) for k, v in d["reponses"].items()}
        )

        if result.get("_status", 200) >= 400 or "erreur" in result:
            return Response({"erreur": result.get("erreur", "Erreur évaluation")}, status=400)

        # Sauvegarder le résultat
        if "admis" in result:
            ResultatAdmission.objects.update_or_create(
                candidat_id=str(d["candidat_id"]),
                filiere=d["filiere"].upper(),
                defaults={
                    "score":        result["score"],
                    "nb_bonnes":    result.get("nb_bonnes", 0),
                    "nb_questions": result.get("nb_questions", 15),
                    "admis":        result["admis"],
                    "niveau":       result.get("niveau", ""),
                    "detail":       result.get("detail", []),
                }
            )
        return Response(result)


class AdmissionStatsView(APIView):
    """
    GET /api/ia/admission/stats/
    Statistiques des admissions (admin).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total  = ResultatAdmission.objects.count()
        admis  = ResultatAdmission.objects.filter(admis=True).count()
        par_filiere = {}
        for f in ["INF", "GST", "DRT"]:
            t = ResultatAdmission.objects.filter(filiere=f).count()
            a = ResultatAdmission.objects.filter(filiere=f, admis=True).count()
            par_filiere[f] = {"total": t, "admis": a, "taux": round(a/t*100,1) if t else 0}

        return Response({
            "total_passes":   total,
            "total_admis":    admis,
            "taux_admission": round(admis/total*100, 1) if total else 0,
            "par_filiere":    par_filiere,
        })
