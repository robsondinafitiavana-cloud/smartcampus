"""
users/serializers.py
Convertit les objets Python en JSON (et vice-versa) pour les APIs.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Utilisateur


class ConnexionSerializer(serializers.Serializer):
    """
    Sérialiseur pour la connexion.
    Reçoit email + mot_de_passe, retourne le token JWT.
    """
    email       = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True)  # Ne jamais retourner le mot de passe

    def validate(self, data):
        """Vérifier que l'email et le mot de passe sont corrects."""
        utilisateur = authenticate(
            username=data['email'],
            password=data['mot_de_passe']
        )
        if not utilisateur:
            raise serializers.ValidationError("Email ou mot de passe incorrect")
        if not utilisateur.est_actif:
            raise serializers.ValidationError("Compte désactivé. Contactez l'administration.")
        data['utilisateur'] = utilisateur
        return data


class UtilisateurSerializer(serializers.ModelSerializer):
    """Sérialiseur basique pour afficher un utilisateur."""
    class Meta:
        model  = Utilisateur
        fields = ['id', 'email', 'role', 'est_actif', 'date_creation']
        read_only_fields = ['date_creation']


class CreationUtilisateurSerializer(serializers.ModelSerializer):
    """Pour créer un nouvel utilisateur (admin uniquement)."""
    mot_de_passe = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = Utilisateur
        fields = ['email', 'mot_de_passe', 'role']

    def create(self, validated_data):
        mot_de_passe = validated_data.pop('mot_de_passe')
        utilisateur  = Utilisateur(**validated_data)
        utilisateur.set_password(mot_de_passe)  # Hash du mot de passe
        utilisateur.save()
        return utilisateur
