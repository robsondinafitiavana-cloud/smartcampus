"""
presences/views.py — Module 4 : Gestion des Présences
=======================================================
Système hybride :
  ENTRÉE → Scan QR Code de la carte étudiant (inchangé)
  SORTIE → Reconnaissance faciale via Flask IA  ← NOUVEAU
  ALERTE → Si taux de présence < 70%            ← NOUVEAU
"""
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.utils import timezone
from django.db.models import Count, Q

from .models import Salle, Presence
from .serializers import SalleSerializer, PresenceSerializer
from .ia_client import verifier_visage, flask_health
from etudiants.models import Etudiant

import base64, logging
logger = logging.getLogger(__name__)

SEUIL_PRESENCE = 0.70  # Alerte si taux < 70%


class SalleViewSet(viewsets.ModelViewSet):
    """API Salles — CRUD complet"""
    queryset         = Salle.objects.all()
    serializer_class = SalleSerializer


# ── ENTRÉE : QR Code (inchangé, logique préservée) ────────────────────────
class PointageQRCodeView(APIView):
    """
    POST /api/presences/qr/
    Corps: { "qr_code": "...", "emploi_du_temps_id": 1 }
    → Enregistre l'ENTRÉE via QR Code de la carte étudiant
    """
    def post(self, request):
        qr_code   = request.data.get('qr_code', '').strip()
        emploi_id = request.data.get('emploi_du_temps_id')

        if not qr_code:
            return Response({"erreur": "QR Code manquant"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            etudiant = Etudiant.objects.get(qr_code=qr_code)
        except Etudiant.DoesNotExist:
            return Response({"erreur": "QR Code non reconnu."}, status=status.HTTP_404_NOT_FOUND)

        aujourd_hui = timezone.now().date()
        heure_now   = timezone.now().time()

        presence, created = Presence.objects.get_or_create(
            etudiant=etudiant,
            date_seance=aujourd_hui,
            defaults={
                'emploi_du_temps_id': emploi_id if emploi_id else None,
                'heure_entree':       heure_now,
                'methode_entree':     'qr_code',
                'statut':             'present',
            }
        )

        if not created:
            return Response({
                "message":     f"⚠️ {etudiant.nom} {etudiant.prenom} est déjà pointé aujourd'hui",
                "heure_entree": str(presence.heure_entree),
                "statut":      presence.statut,
            })

        # ── Vérification alerte taux présence ─────────────────────────────
        taux = _calculer_taux_presence(etudiant.id)
        alerte = taux < SEUIL_PRESENCE if taux is not None else False

        return Response({
            "message":   f"✅ Entrée enregistrée — {etudiant.nom} {etudiant.prenom}",
            "matricule": etudiant.matricule,
            "heure":     str(heure_now),
            "statut":    "present",
            "taux_presence": round(taux * 100, 1) if taux is not None else None,
            "alerte_presence": alerte,
            "alerte_message":  f"⚠️ Taux de présence {round(taux*100,1)}% < 70%" if alerte else None,
        }, status=status.HTTP_201_CREATED)


# ── SORTIE : Reconnaissance Faciale via Flask IA ──── NOUVEAU ────────────
class PointageFacialeView(APIView):
    """
    POST /api/presences/faciale/
    Deux modes :
      Mode A (depuis caméra React) : { "image_base64": "data:image/...", "etudiant_id": 5 }
      Mode B (depuis Flask — rétrocompat) : { "etudiant_id": 5, "emploi_du_temps_id": 1 }

    Mode A : envoie l'image à Flask IA pour reconnaissance, puis enregistre la sortie
    Mode B : enregistre la sortie sans vérification (appelé directement par Flask)
    """
    def post(self, request):
        etudiant_id  = request.data.get('etudiant_id')
        image_base64 = request.data.get('image_base64')
        emploi_id    = request.data.get('emploi_du_temps_id')

        if not etudiant_id:
            return Response({"erreur": "etudiant_id manquant"}, status=400)

        aujourd_hui = timezone.now().date()
        heure_now   = timezone.now().time()

        # ── Mode A : image envoyée → Flask IA ────────────────────────────
        if image_base64:
            # Appel Flask IA pour reconnaissance faciale
            ia_result = verifier_visage(image_base64, etudiant_id)

            if not ia_result.get("reconnu", False):
                return Response({
                    "erreur":    "Reconnaissance faciale échouée",
                    "message":   ia_result.get("message", "Visage non reconnu"),
                    "confiance": ia_result.get("confiance", 0),
                    "ia_status": ia_result.get("_status")
                }, status=status.HTTP_400_BAD_REQUEST)

            # Reconnu → enregistrer la sortie
            try:
                presence = Presence.objects.get(etudiant_id=etudiant_id, date_seance=aujourd_hui)
                presence.heure_sortie   = heure_now
                presence.methode_sortie = 'faciale'
                presence.save(update_fields=['heure_sortie', 'methode_sortie'])

                logger.info(f"[FACIALE IA] étudiant={etudiant_id} confiance={ia_result.get('confiance')}")

                return Response({
                    "message":      "✅ Sortie enregistrée par reconnaissance faciale",
                    "heure":        str(heure_now),
                    "confiance_ia": ia_result.get("confiance"),
                    "methode":      "reconnaissance_faciale_ia",
                })

            except Presence.DoesNotExist:
                return Response({
                    "erreur": "Aucune entrée enregistrée aujourd'hui pour cet étudiant"
                }, status=status.HTTP_404_NOT_FOUND)

        # ── Mode B : rétrocompatibilité (pas d'image) ─────────────────────
        try:
            presence = Presence.objects.get(etudiant_id=etudiant_id, date_seance=aujourd_hui)
            presence.heure_sortie   = heure_now
            presence.methode_sortie = 'faciale'
            presence.save(update_fields=['heure_sortie', 'methode_sortie'])
            return Response({"message": "✅ Sortie enregistrée", "heure": str(heure_now)})
        except Presence.DoesNotExist:
            return Response({"erreur": "Aucune présence d'entrée trouvée"}, status=404)


# ── Enregistrer le visage d'un étudiant ──── NOUVEAU ─────────────────────
class EnregistrerVisageView(APIView):
    """
    POST /api/presences/register-face/
    Appelé après la création d'un compte étudiant (approbation demande).
    Corps : { "etudiant_id": 5, "images_base64": ["...", "...", "..."] }
    → Transmet les images à Flask IA pour créer l'encodage facial
    """
    def post(self, request):
        etudiant_id = request.data.get("etudiant_id")
        images      = request.data.get("images_base64", [])

        if not etudiant_id or len(images) < 1:
            return Response({"erreur": "etudiant_id + images_base64 (min 1) requis"}, status=400)

        from .ia_client import enregistrer_visage
        result = enregistrer_visage(etudiant_id, images)
        return Response(result, status=200 if result.get("success") else 400)


# ── Taux de présence d'un étudiant ──── NOUVEAU ───────────────────────────
class TauxPresenceView(APIView):
    """
    GET /api/presences/taux/<etudiant_id>/
    Retourne le taux de présence calculé depuis la DB.
    Utilisé par le Dashboard et Module 7 (données pour prédiction IA).
    """
    def get(self, request, etudiant_id):
        total   = Presence.objects.filter(etudiant_id=etudiant_id).count()
        present = Presence.objects.filter(
            etudiant_id=etudiant_id,
            statut__in=['present', 'retard']
        ).count()

        taux  = (present / total) if total > 0 else None
        alerte = taux is not None and taux < SEUIL_PRESENCE

        return Response({
            "etudiant_id":     etudiant_id,
            "nb_seances":      total,
            "nb_present":      present,
            "taux":            round(taux * 100, 1) if taux is not None else None,
            "sous_seuil":      alerte,
            "seuil":           int(SEUIL_PRESENCE * 100),
            "message":         f"⚠️ Taux de présence {round(taux*100,1)}% < 70%" if alerte else "✅ Présence satisfaisante"
        })


# ── Statut Flask IA ──── NOUVEAU ──────────────────────────────────────────
class IAStatusView(APIView):
    """GET /api/presences/ia-status/ — Vérifie si Flask IA est opérationnel"""
    def get(self, request):
        ok = flask_health()
        return Response({
            "flask_ia_online": ok,
            "message": "✅ Service IA opérationnel" if ok else "❌ Service IA hors ligne"
        }, status=200 if ok else 503)


# ── ReadOnly ViewSet (inchangé) ────────────────────────────────────────────
class PresenceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PresenceSerializer

    def get_queryset(self):
        qs          = Presence.objects.select_related('etudiant', 'emploi_du_temps')
        etudiant_id = self.request.query_params.get('etudiant_id')
        date        = self.request.query_params.get('date')
        statut      = self.request.query_params.get('statut')

        if etudiant_id: qs = qs.filter(etudiant_id=etudiant_id)
        if date:        qs = qs.filter(date_seance=date)
        if statut:      qs = qs.filter(statut=statut)
        return qs.order_by('-date_seance')


# ── Helper ─────────────────────────────────────────────────────────────────
def _calculer_taux_presence(etudiant_id: int):
    """Calcule le taux de présence depuis la DB."""
    total   = Presence.objects.filter(etudiant_id=etudiant_id).count()
    present = Presence.objects.filter(etudiant_id=etudiant_id, statut__in=['present','retard']).count()
    return (present / total) if total > 0 else None
