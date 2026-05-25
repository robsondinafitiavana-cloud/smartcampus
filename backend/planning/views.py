"""
planning/views.py — Module 6 + Communiqués
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EmploiDuTemps, Annonce, Communique, LikeCommunique, CommentaireCommunique
from .serializers import (
    EmploiDuTempsSerializer, AnnonceSerializer,
    CommuniqueSerializer, CommentaireSerializer
)


class EmploiDuTempsViewSet(viewsets.ModelViewSet):
    serializer_class = EmploiDuTempsSerializer

    def get_queryset(self):
        qs = EmploiDuTemps.objects.select_related(
            'cours','salle','groupe','enseignant'
        ).filter(est_annule=False)
        for p in ['groupe_id','salle_id','enseignant_id','jour_semaine']:
            val = self.request.query_params.get(p)
            if val:
                qs = qs.filter(**{p: val})
        return qs.order_by('jour_semaine','heure_debut')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=201)
        except Exception as e:
            erreur = str(e)
            if 'no_conflit_salle' in erreur:
                return Response({"erreur": "⚠️ Conflit : salle déjà occupée à cet horaire"}, status=400)
            if 'no_conflit_enseignant' in erreur:
                return Response({"erreur": "⚠️ Conflit : enseignant déjà occupé à cet horaire"}, status=400)
            raise

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        seance = self.get_object()
        seance.est_annule = True
        seance.motif_annulation = request.data.get('motif', '')
        seance.save()
        return Response({"message": "Cours annulé"})


class AnnonceViewSet(viewsets.ModelViewSet):
    queryset         = Annonce.objects.select_related('auteur','filiere','groupe')
    serializer_class = AnnonceSerializer

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)


class CommuniqueViewSet(viewsets.ModelViewSet):
    """
    API Communiqués
    GET    /api/communiques/             → liste (tous les utilisateurs)
    POST   /api/communiques/             → publier (admin seulement)
    GET    /api/communiques/{id}/        → détail avec commentaires
    POST   /api/communiques/{id}/liker/  → liker/unliker
    POST   /api/communiques/{id}/commenter/ → ajouter un commentaire
    DELETE /api/communiques/{id}/supprimer_commentaire/{cid}/ → supprimer
    """
    serializer_class = CommuniqueSerializer

    def get_queryset(self):
        qs = Communique.objects.filter(est_publie=True).select_related(
            'auteur', 'filiere'
        ).prefetch_related('likes', 'commentaires')

        categorie = self.request.query_params.get('categorie')
        if categorie:
            qs = qs.filter(categorie=categorie)
        return qs

    def get_serializer_context(self):
        """Passer le request au serializer pour j_ai_like."""
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        """Seul l'admin peut publier un communiqué."""
        if request.user.role != 'admin':
            return Response(
                {"erreur": "Seul l'administrateur peut publier des communiqués."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(auteur=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"erreur": "Action non autorisée."}, status=403)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"erreur": "Action non autorisée."}, status=403)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def liker(self, request, pk=None):
        """
        POST /api/communiques/{id}/liker/
        Toggle like : si déjà liké → unlike, sinon → like
        """
        communique = self.get_object()
        like, created = LikeCommunique.objects.get_or_create(
            communique=communique,
            utilisateur=request.user
        )
        if not created:
            # Déjà liké → unlike
            like.delete()
            action_faite = 'unlike'
        else:
            action_faite = 'like'

        return Response({
            "action":    action_faite,
            "nb_likes":  communique.nb_likes,
            "j_ai_like": action_faite == 'like',
        })

    @action(detail=True, methods=['post'])
    def commenter(self, request, pk=None):
        """
        POST /api/communiques/{id}/commenter/
        Corps: { "contenu": "...", "parent": null }
        Étudiants et enseignants peuvent commenter.
        """
        communique = self.get_object()
        contenu    = request.data.get('contenu', '').strip()
        parent_id  = request.data.get('parent')

        if not contenu:
            return Response({"erreur": "Le commentaire ne peut pas être vide."}, status=400)

        parent = None
        if parent_id:
            try:
                parent = CommentaireCommunique.objects.get(id=parent_id, communique=communique)
            except CommentaireCommunique.DoesNotExist:
                return Response({"erreur": "Commentaire parent introuvable."}, status=404)

        commentaire = CommentaireCommunique.objects.create(
            communique=communique,
            auteur=request.user,
            contenu=contenu,
            parent=parent,
        )
        return Response(
            CommentaireSerializer(commentaire).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['delete'], url_path='commentaire/(?P<cid>[^/.]+)')
    def supprimer_commentaire(self, request, pk=None, cid=None):
        """
        DELETE /api/communiques/{id}/commentaire/{cid}/
        Seul l'auteur du commentaire ou un admin peut supprimer.
        """
        try:
            commentaire = CommentaireCommunique.objects.get(id=cid)
        except CommentaireCommunique.DoesNotExist:
            return Response({"erreur": "Commentaire introuvable."}, status=404)

        if commentaire.auteur != request.user and request.user.role != 'admin':
            return Response({"erreur": "Vous ne pouvez pas supprimer ce commentaire."}, status=403)

        commentaire.delete()
        return Response({"message": "Commentaire supprimé."})
