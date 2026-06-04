"""users/serializers.py"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Utilisateur, DemandeInscription


class ConnexionSerializer(serializers.Serializer):
    email        = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, data):
        utilisateur = authenticate(username=data['email'], password=data['mot_de_passe'])
        if not utilisateur:
            raise serializers.ValidationError("Email ou mot de passe incorrect")
        if not utilisateur.est_actif:
            raise serializers.ValidationError("Compte désactivé. Contactez l'administration.")
        data['utilisateur'] = utilisateur
        return data


class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Utilisateur
        fields = ['id', 'email', 'role', 'est_actif', 'date_creation']
        read_only_fields = ['date_creation']


class CreationUtilisateurSerializer(serializers.ModelSerializer):
    mot_de_passe = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = Utilisateur
        fields = ['email', 'mot_de_passe', 'role']

    def create(self, validated_data):
        mot_de_passe = validated_data.pop('mot_de_passe')
        utilisateur  = Utilisateur(**validated_data)
        utilisateur.set_password(mot_de_passe)
        utilisateur.save()
        return utilisateur


class DemandeInscriptionSerializer(serializers.ModelSerializer):
    """Sérialise une demande d'inscription."""
    filiere_nom     = serializers.ReadOnlyField(source='get_filiere_nom')
    traite_par_email = serializers.CharField(source='traite_par.email', read_only=True)

    class Meta:
        model  = DemandeInscription
        fields = '__all__'
        read_only_fields = ['date_demande', 'traite_par', 'date_traitement', 'compte_cree']


class SoumettreDemandeSerializer(serializers.ModelSerializer):
    """Pour soumettre une nouvelle demande (public, sans auth)."""
    class Meta:
        model  = DemandeInscription
        fields = ['nom', 'prenom', 'email', 'contact', 'filiere', 'score_test', 'nb_bonnes', 'nb_questions']

    def validate_email(self, value):
        # Vérifier qu'il n'y a pas déjà une demande approuvée pour cet email
        if DemandeInscription.objects.filter(email=value, statut='approuvee').exists():
            raise serializers.ValidationError("Une demande approuvée existe déjà pour cet email.")
        return value

    def validate_score_test(self, value):
        if value < 60:
            raise serializers.ValidationError("Le score doit être ≥ 60% pour soumettre une demande.")
        return value