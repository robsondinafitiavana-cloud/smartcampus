"""
paiements/views.py — Module 5
==============================
- EcheancierViewSet : calendrier mensuel par étudiant
- PaiementViewSet   : enregistrement et confirmation des paiements
- generer_echeancier : créer automatiquement le calendrier d'un étudiant
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import date
import uuid

from .models import EcheancierPaiement, Paiement
from .serializers import EcheancierSerializer, PaiementSerializer
from etudiants.models import Etudiant


def generer_echeancier(etudiant, annee_scolaire='2025-2026',
                        montant_inscription=150000, montant_mensuel=80000):
    """
    Créer automatiquement le calendrier de paiement d'un étudiant.
    Appelé à la création de l'étudiant.
    Crée : 1 droit d'inscription + 10 mensualités (M1→M10).
    """
    ECHEANCES = [
        # (code,        mois, jour_limite)
        ('inscription', None,  None),
        ('M1',          10,    15),   # Octobre
        ('M2',          11,    15),   # Novembre
        ('M3',          12,    15),   # Décembre
        ('M4',           1,    15),   # Janvier
        ('M5',           2,    15),   # Février
        ('M6',           3,    15),   # Mars
        ('M7',           4,    15),   # Avril
        ('M8',           5,    15),   # Mai
        ('M9',           6,    15),   # Juin
        ('M10',          7,    15),   # Juillet
    ]

    annee_debut = int(annee_scolaire.split('-')[0])
    creees = []

    for code, mois, jour in ECHEANCES:
        if EcheancierPaiement.objects.filter(
            etudiant=etudiant, type_echeance=code, annee_scolaire=annee_scolaire
        ).exists():
            continue  # Déjà créée

        montant = montant_inscription if code == 'inscription' else montant_mensuel

        # Calculer la date limite
        if mois is not None:
            annee = annee_debut if mois >= 10 else annee_debut + 1
            date_limite = date(annee, mois, jour)
        else:
            date_limite = date(annee_debut, 9, 30)  # 30 septembre pour l'inscription

        echeance = EcheancierPaiement.objects.create(
            etudiant=etudiant,
            type_echeance=code,
            montant=montant,
            annee_scolaire=annee_scolaire,
            date_echeance=date_limite,
            statut='en_attente',
        )
        creees.append(echeance)

    return creees


class EcheancierViewSet(viewsets.ModelViewSet):
    """
    API Calendrier de paiement
    GET  /api/echeancier/?etudiant_id=X  → calendrier d'un étudiant
    GET  /api/echeancier/?annee=2025-2026 → toutes les échéances d'une année
    POST /api/echeancier/{id}/payer/     → admin confirme un paiement
    POST /api/echeancier/generer/        → générer le calendrier d'un étudiant
    """
    serializer_class = EcheancierSerializer

    def get_queryset(self):
        qs = EcheancierPaiement.objects.select_related('etudiant', 'confirme_par')
        etudiant_id = self.request.query_params.get('etudiant_id')
        annee       = self.request.query_params.get('annee')
        statut      = self.request.query_params.get('statut')

        if etudiant_id:
            qs = qs.filter(etudiant_id=etudiant_id)
        if annee:
            qs = qs.filter(annee_scolaire=annee)
        if statut:
            qs = qs.filter(statut=statut)

        # Mettre à jour automatiquement les statuts en retard
        today = timezone.now().date()
        qs.filter(
            statut='en_attente',
            date_echeance__lt=today
        ).update(statut='en_retard')

        return qs

    @action(detail=True, methods=['post'])
    def payer(self, request, pk=None):
        """
        POST /api/echeancier/{id}/payer/
        Admin confirme le paiement d'une échéance.
        Corps: { "mode_paiement": "especes" }
        """
        echeance = self.get_object()

        if echeance.statut == 'paye':
            return Response({"message": "Cette échéance est déjà payée."}, status=400)

        mode = request.data.get('mode_paiement', 'especes')
        ref  = f"SC-{uuid.uuid4().hex[:8].upper()}"

        # Marquer comme payé
        echeance.statut        = 'paye'
        echeance.date_paiement = timezone.now().date()
        echeance.confirme_par  = request.user
        echeance.reference     = ref
        echeance.save()

        # Créer l'entrée dans l'historique
        Paiement.objects.create(
            echeance=echeance,
            etudiant=echeance.etudiant,
            montant=echeance.montant,
            mode_paiement=mode,
            reference=ref,
            enregistre_par=request.user,
        )

        return Response({
            "message": f"✅ Paiement {echeance.get_label()} confirmé",
            "reference": ref,
            "echeance": EcheancierSerializer(echeance).data,
        })

    @action(detail=False, methods=['post'])
    def generer(self, request):
        """
        POST /api/echeancier/generer/
        Corps: { "etudiant_id": 1, "annee_scolaire": "2025-2026",
                 "montant_inscription": 150000, "montant_mensuel": 80000 }
        Génère le calendrier complet pour un étudiant.
        """
        etudiant_id = request.data.get('etudiant_id')
        annee       = request.data.get('annee_scolaire', '2025-2026')
        m_insc      = int(request.data.get('montant_inscription', 150000))
        m_mens      = int(request.data.get('montant_mensuel', 80000))

        try:
            etudiant = Etudiant.objects.get(id=etudiant_id)
        except Etudiant.DoesNotExist:
            return Response({"erreur": "Étudiant introuvable"}, status=404)

        creees = generer_echeancier(etudiant, annee, m_insc, m_mens)
        return Response({
            "message": f"✅ {len(creees)} échéances créées pour {etudiant}",
            "nb_creees": len(creees),
        })

    @action(detail=False, methods=['get'])
    def dashboard_admin(self, request):
        """
        GET /api/echeancier/dashboard_admin/
        Statistiques financières globales pour l'admin.
        """
        annee = request.query_params.get('annee', '2025-2026')
        qs    = EcheancierPaiement.objects.filter(annee_scolaire=annee)

        # Mettre à jour les retards
        today = timezone.now().date()
        qs.filter(statut='en_attente', date_echeance__lt=today).update(statut='en_retard')
        qs = EcheancierPaiement.objects.filter(annee_scolaire=annee)

        total_attendu  = sum(e.montant for e in qs)
        total_paye     = sum(e.montant for e in qs if e.statut == 'paye')
        total_en_retard = sum(e.montant for e in qs if e.statut == 'en_retard')
        nb_retards     = qs.filter(statut='en_retard').count()
        nb_etudiants_retard = qs.filter(statut='en_retard').values('etudiant').distinct().count()

        return Response({
            "total_attendu":         float(total_attendu),
            "total_encaisse":        float(total_paye),
            "montant_restant_du":    float(total_attendu - total_paye),
            "total_en_retard":       float(total_en_retard),
            "nb_retards":            nb_retards,
            "nb_etudiants_en_dette": nb_etudiants_retard,
            "taux_recouvrement":     round(float(total_paye) / float(total_attendu) * 100, 1) if total_attendu > 0 else 0,
        })

    @action(detail=False, methods=['get'])
    def retards(self, request):
        """GET /api/echeancier/retards/ → liste de tous les paiements en retard"""
        annee = request.query_params.get('annee', '2025-2026')
        retards = EcheancierPaiement.objects.filter(
            annee_scolaire=annee, statut='en_retard'
        ).select_related('etudiant').order_by('date_echeance')
        return Response(EcheancierSerializer(retards, many=True).data)


class PaiementViewSet(viewsets.ReadOnlyModelViewSet):
    """Historique des paiements (lecture seule)."""
    serializer_class = PaiementSerializer

    def get_queryset(self):
        qs = Paiement.objects.select_related('etudiant', 'echeance')
        etudiant_id = self.request.query_params.get('etudiant_id')
        if etudiant_id:
            qs = qs.filter(etudiant_id=etudiant_id)
        return qs
