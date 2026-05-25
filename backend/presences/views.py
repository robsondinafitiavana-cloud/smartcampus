"""
presences/views.py — Module 4 : Gestion des Présences
=======================================================
Système hybride :
  ENTRÉE → Scan QR Code de la carte étudiant
  SORTIE → Reconnaissance faciale (Flask IA)
"""
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.utils import timezone
from .models import Salle, Presence
from .serializers import SalleSerializer, PresenceSerializer
from etudiants.models import Etudiant


class SalleViewSet(viewsets.ModelViewSet):
    """API Salles — CRUD complet"""
    queryset           = Salle.objects.all()
    serializer_class   = SalleSerializer


class PointageQRCodeView(APIView):
    """
    POST /api/presences/qr/
    Corps: { "qr_code": "...", "emploi_du_temps_id": 1 }
    → Enregistre l'ENTRÉE de l'étudiant (QR Code scanné)
    → emploi_du_temps_id est optionnel
    """
    def post(self, request):
        qr_code   = request.data.get('qr_code', '').strip()
        emploi_id = request.data.get('emploi_du_temps_id')  # Peut être null

        if not qr_code:
            return Response(
                {"erreur": "QR Code manquant"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Trouver l'étudiant par son QR Code unique
        try:
            etudiant = Etudiant.objects.get(qr_code=qr_code)
        except Etudiant.DoesNotExist:
            return Response(
                {"erreur": "QR Code non reconnu. Vérifiez la carte de l'étudiant."},
                status=status.HTTP_404_NOT_FOUND
            )

        aujourd_hui = timezone.now().date()
        heure_now   = timezone.now().time()

        # Créer ou récupérer la présence du jour
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
                "message": f"⚠️ {etudiant.nom} {etudiant.prenom} est déjà pointé aujourd'hui",
                "heure_entree": str(presence.heure_entree),
                "statut": presence.statut,
            })

        return Response({
            "message":    f"✅ Entrée enregistrée — {etudiant.nom} {etudiant.prenom}",
            "matricule":  etudiant.matricule,
            "heure":      str(heure_now),
            "statut":     "present",
        }, status=status.HTTP_201_CREATED)


class PointageFacialeView(APIView):
    """
    POST /api/presences/faciale/
    Corps: { "etudiant_id": 1, "emploi_du_temps_id": 1 }
    → Appelé par le microservice Flask IA après reconnaissance faciale
    → Enregistre la SORTIE de l'étudiant
    """
    def post(self, request):
        etudiant_id = request.data.get('etudiant_id')
        if not etudiant_id:
            return Response(
                {"erreur": "etudiant_id manquant"},
                status=status.HTTP_400_BAD_REQUEST
            )

        aujourd_hui = timezone.now().date()
        heure_now   = timezone.now().time()

        try:
            presence = Presence.objects.get(
                etudiant_id=etudiant_id,
                date_seance=aujourd_hui,
            )
            presence.heure_sortie   = heure_now
            presence.methode_sortie = 'faciale'
            presence.save(update_fields=['heure_sortie', 'methode_sortie'])

            return Response({
                "message": "✅ Sortie enregistrée par reconnaissance faciale",
                "heure":   str(heure_now),
            })

        except Presence.DoesNotExist:
            return Response(
                {"erreur": "Aucune présence d'entrée trouvée pour cet étudiant aujourd'hui"},
                status=status.HTTP_404_NOT_FOUND
            )


class PresenceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API Présences — lecture seule
    GET /api/presences/?etudiant_id=X  → présences d'un étudiant
    GET /api/presences/?date=2026-05-01 → présences d'une date
    """
    serializer_class = PresenceSerializer

    def get_queryset(self):
        queryset    = Presence.objects.select_related('etudiant', 'emploi_du_temps')
        etudiant_id = self.request.query_params.get('etudiant_id')
        date        = self.request.query_params.get('date')
        statut      = self.request.query_params.get('statut')

        if etudiant_id:
            queryset = queryset.filter(etudiant_id=etudiant_id)
        if date:
            queryset = queryset.filter(date_seance=date)
        if statut:
            queryset = queryset.filter(statut=statut)

        return queryset.order_by('-date_seance')
