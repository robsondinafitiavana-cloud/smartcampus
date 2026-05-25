"""planning/serializers.py"""
from rest_framework import serializers
from .models import EmploiDuTemps, Annonce, Communique, LikeCommunique, CommentaireCommunique


class EmploiDuTempsSerializer(serializers.ModelSerializer):
    cours_nom      = serializers.CharField(source='cours.intitule', read_only=True)
    salle_nom      = serializers.CharField(source='salle.nom', read_only=True)
    groupe_nom     = serializers.CharField(source='groupe.nom', read_only=True)
    enseignant_nom = serializers.CharField(source='enseignant.__str__', read_only=True)
    jour_display   = serializers.CharField(source='get_jour_semaine_display', read_only=True)

    class Meta:
        model  = EmploiDuTemps
        fields = '__all__'


class AnnonceSerializer(serializers.ModelSerializer):
    auteur_email = serializers.CharField(source='auteur.email', read_only=True)
    class Meta:
        model  = Annonce
        fields = '__all__'


class CommentaireSerializer(serializers.ModelSerializer):
    """Sérialise un commentaire avec les infos de l'auteur."""
    auteur_email = serializers.CharField(source='auteur.email', read_only=True)
    auteur_role  = serializers.CharField(source='auteur.role', read_only=True)
    nb_reponses  = serializers.SerializerMethodField()

    class Meta:
        model  = CommentaireCommunique
        fields = '__all__'
        read_only_fields = ['auteur', 'date_creation', 'est_modifie']

    def get_nb_reponses(self, obj):
        return obj.reponses.count()


class CommuniqueSerializer(serializers.ModelSerializer):
    """Sérialise un communiqué avec likes, commentaires et infos auteur."""
    auteur_email    = serializers.CharField(source='auteur.email', read_only=True)
    auteur_role     = serializers.CharField(source='auteur.role', read_only=True)
    nb_likes        = serializers.ReadOnlyField()
    nb_commentaires = serializers.ReadOnlyField()
    # L'utilisateur connecté a-t-il liké ce communiqué ?
    j_ai_like       = serializers.SerializerMethodField()
    # Commentaires racine seulement (pas les réponses)
    commentaires    = serializers.SerializerMethodField()
    filiere_nom     = serializers.CharField(source='filiere.nom', read_only=True)

    class Meta:
        model  = Communique
        fields = '__all__'
        read_only_fields = ['auteur', 'date_creation', 'date_modification']

    def get_j_ai_like(self, obj):
        """Vérifier si l'utilisateur connecté a liké."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(utilisateur=request.user).exists()
        return False

    def get_commentaires(self, obj):
        """Retourner seulement les commentaires racine (parent=None)."""
        commentaires = obj.commentaires.filter(parent=None).order_by('date_creation')
        return CommentaireSerializer(commentaires, many=True).data
