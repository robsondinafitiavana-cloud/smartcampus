"""
cours/views.py - Module 2 & 3
Gestion des cours, notes, devoirs
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from .models import Cours, Note, Devoir, SoumissionDevoir
from .serializers import (
    CoursSerializer, NoteSerializer, NoteSaisieSerializer,
    DevoirSerializer, SoumissionSerializer
)


class CoursViewSet(viewsets.ModelViewSet):
    """API Cours"""
    queryset = Cours.objects.select_related('enseignant', 'filiere')
    serializer_class = CoursSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        filiere  = self.request.query_params.get('filiere')
        niveau   = self.request.query_params.get('niveau')
        if filiere:
            queryset = queryset.filter(filiere__code=filiere)
        if niveau:
            queryset = queryset.filter(niveau=niveau)
        return queryset


class NoteViewSet(viewsets.ModelViewSet):
    """
    API Notes - Module 3
    POST /api/notes/ → saisir une note (enseignant)
    GET  /api/notes/bulletin/?etudiant_id=X → bulletin complet
    GET  /api/notes/statistiques/?cours_id=X → stats d'un cours
    """
    queryset = Note.objects.select_related('etudiant', 'cours')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return NoteSaisieSerializer
        return NoteSerializer

    def create(self, request, *args, **kwargs):
        """Saisir ou mettre à jour une note (la note finale est calculée automatiquement)."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.save(saisi_par=request.user)
        return Response(NoteSerializer(note).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def bulletin(self, request):
        """
        GET /api/notes/bulletin/?etudiant_id=X&annee=2025-2026
        Retourne le bulletin complet d'un étudiant avec les moyennes par semestre.
        """
        etudiant_id = request.query_params.get('etudiant_id')
        annee       = request.query_params.get('annee')
        
        if not etudiant_id:
            return Response({"erreur": "etudiant_id requis"}, status=400)
        
        notes = Note.objects.filter(
            etudiant_id=etudiant_id
        ).select_related('cours')
        
        if annee:
            notes = notes.filter(annee_scolaire=annee)
        
        # Calculer la moyenne générale pondérée
        total_coeff  = sum(float(n.cours.coefficient) for n in notes if n.note_finale)
        total_points = sum(float(n.note_finale) * float(n.cours.coefficient) for n in notes if n.note_finale)
        moyenne_generale = round(total_points / total_coeff, 2) if total_coeff > 0 else 0
        
        # Déterminer la mention
        if moyenne_generale >= 16:
            mention = "Très Bien"
        elif moyenne_generale >= 14:
            mention = "Bien"
        elif moyenne_generale >= 12:
            mention = "Assez Bien"
        elif moyenne_generale >= 10:
            mention = "Passable"
        else:
            mention = "Insuffisant"
        
        return Response({
            "etudiant_id": etudiant_id,
            "annee_scolaire": annee,
            "notes": NoteSerializer(notes, many=True).data,
            "moyenne_generale": moyenne_generale,
            "mention": mention,
            "matieres_non_validees": [
                n.cours.intitule for n in notes if n.est_valide is False
            ]
        })

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """
        GET /api/notes/statistiques/?cours_id=X
        Stats du cours : moyenne, taux réussite, classement
        """
        cours_id = request.query_params.get('cours_id')
        notes    = Note.objects.filter(cours_id=cours_id)
        
        total    = notes.count()
        valides  = notes.filter(est_valide=True).count()
        moyenne  = notes.aggregate(Avg('note_finale'))['note_finale__avg'] or 0
        
        return Response({
            "cours_id": cours_id,
            "total_etudiants": total,
            "nb_valides": valides,
            "taux_reussite_pct": round(valides * 100 / total, 1) if total > 0 else 0,
            "moyenne_classe": round(float(moyenne), 2),
            "alerte_taux_echec": (total - valides) * 100 / total > 70 if total > 0 else False
        })

    @action(detail=False, methods=['get'])
    def etudiants_a_risque(self, request):
        """
        GET /api/notes/etudiants_a_risque/
        Retourne les étudiants avec note finale < 10
        """
        notes_echec = Note.objects.filter(
            est_valide=False
        ).select_related('etudiant', 'cours').order_by('note_finale')
        
        return Response([{
            "etudiant": f"{n.etudiant.nom} {n.etudiant.prenom}",
            "matricule": n.etudiant.matricule,
            "cours": n.cours.intitule,
            "note_finale": n.note_finale,
            "en_rattrapage": n.est_rattrapage
        } for n in notes_echec])


class DevoirViewSet(viewsets.ModelViewSet):
    """API Devoirs"""
    queryset = Devoir.objects.all()
    serializer_class = DevoirSerializer

    @action(detail=True, methods=['post'])
    def soumettre(self, request, pk=None):
        """POST /api/devoirs/{id}/soumettre/ → soumettre un devoir"""
        devoir = self.get_object()
        
        # Trouver le profil étudiant de l'utilisateur connecté
        try:
            etudiant = request.user.profil_etudiant
        except Exception:
            return Response({"erreur": "Seuls les étudiants peuvent soumettre"}, status=403)
        
        soumission, created = SoumissionDevoir.objects.get_or_create(
            devoir=devoir, etudiant=etudiant
        )
        soumission.commentaire = request.data.get('commentaire', '')
        soumission.est_fait    = True
        soumission.save()
        
        return Response({"message": "Devoir soumis avec succès", "id": soumission.id})
