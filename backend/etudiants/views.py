"""
etudiants/views.py - Module 1 & 2
CRUD Étudiants, Enseignants, Groupes, Filières
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Filiere, Etudiant, Enseignant, Groupe
from .serializers import (
    FiliereSerializer, EtudiantSerializer, EnseignantSerializer,
    EnseignantCreationSerializer, GroupeSerializer, EtudiantCreationSerializer
)


class IsAdminOuLecture(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == 'admin'


class FiliereViewSet(viewsets.ModelViewSet):
    queryset           = Filiere.objects.filter(est_active=True)
    serializer_class   = FiliereSerializer
    permission_classes = [IsAdminOuLecture]


class GroupeViewSet(viewsets.ModelViewSet):
    serializer_class   = GroupeSerializer
    permission_classes = [IsAdminOuLecture]

    def get_queryset(self):
        queryset   = Groupe.objects.select_related('filiere')
        filiere_id = self.request.query_params.get('filiere_id')
        annee      = self.request.query_params.get('annee')
        if filiere_id:
            queryset = queryset.filter(filiere_id=filiere_id)
        if annee:
            queryset = queryset.filter(annee_scolaire=annee)
        return queryset


class EtudiantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOuLecture]

    def get_serializer_class(self):
        if self.action == 'create':
            return EtudiantCreationSerializer
        return EtudiantSerializer

    def get_queryset(self):
        queryset  = Etudiant.objects.select_related('utilisateur', 'filiere')
        filiere   = self.request.query_params.get('filiere')
        niveau    = self.request.query_params.get('niveau')
        statut    = self.request.query_params.get('statut')
        recherche = self.request.query_params.get('q')

        if filiere:
            queryset = queryset.filter(filiere__code=filiere)
        if niveau:
            queryset = queryset.filter(niveau=niveau)
        if statut:
            queryset = queryset.filter(statut=statut)
        if recherche:
            queryset = queryset.filter(
                Q(nom__icontains=recherche) |
                Q(prenom__icontains=recherche) |
                Q(matricule__icontains=recherche)
            )
        return queryset

    @action(detail=True, methods=['get'])
    def notes(self, request, pk=None):
        etudiant = self.get_object()
        from cours.models import Note
        from cours.serializers import NoteSerializer
        notes = Note.objects.filter(etudiant=etudiant).select_related('cours')
        return Response(NoteSerializer(notes, many=True).data)

    @action(detail=True, methods=['get'])
    def taux_presence(self, request, pk=None):
        etudiant  = self.get_object()
        presences = etudiant.presences.all()
        total     = presences.count()
        presents  = presences.filter(statut='present').count()
        taux      = round(presents * 100 / total, 1) if total > 0 else 0
        alerte    = taux < 70
        return Response({
            "etudiant":          etudiant.matricule,
            "total_seances":     total,
            "seances_presentes": presents,
            "taux_presence_pct": taux,
            "alerte":            alerte,
            "message": "⚠️ Taux insuffisant!" if alerte else "✅ Présence correcte"
        })

    @action(detail=True, methods=['get'])
    def situation_financiere(self, request, pk=None):
        etudiant   = self.get_object()
        paiements  = etudiant.paiements.all()
        total_paye = sum(p.montant for p in paiements if p.statut == 'paye')
        total_du   = sum(p.montant for p in paiements if p.statut in ['en_attente','en_retard'])
        return Response({
            "total_paye":         total_paye,
            "total_du":           total_du,
            "peut_passer_examen": total_du == 0,
            "message": "❌ Paiement requis" if total_du > 0 else "✅ Paiements à jour"
        })


class EnseignantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOuLecture]

    def get_serializer_class(self):
        # Utiliser le serializer de création quand on crée un enseignant
        if self.action == 'create':
            return EnseignantCreationSerializer
        return EnseignantSerializer

    def get_queryset(self):
        return Enseignant.objects.select_related('utilisateur')

    @action(detail=True, methods=['get'])
    def mes_cours(self, request, pk=None):
        enseignant = self.get_object()
        from cours.models import Cours
        from cours.serializers import CoursSerializer
        cours = Cours.objects.filter(enseignant=enseignant)
        return Response(CoursSerializer(cours, many=True).data)
