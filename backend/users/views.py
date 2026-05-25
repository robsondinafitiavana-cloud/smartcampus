"""
users/views.py - Authentification JWT
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .serializers import ConnexionSerializer, UtilisateurSerializer, CreationUtilisateurSerializer
from .models import Utilisateur


class ConnexionView(APIView):
    """
    POST /api/auth/connexion/
    Corps: { "email": "...", "mot_de_passe": "..." }
    Retourne: { "access", "refresh", "utilisateur": { ...+ profil_id } }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ConnexionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        utilisateur = serializer.validated_data['utilisateur']
        refresh     = RefreshToken.for_user(utilisateur)

        utilisateur.derniere_connexion = timezone.now()
        utilisateur.save(update_fields=['derniere_connexion'])

        # Données de base
        data_user = UtilisateurSerializer(utilisateur).data

        # FIX BUG 4: Ajouter l'ID du profil (etudiant ou enseignant) dans la réponse
        # Cela permet au frontend de savoir quel profil_id utiliser
        if utilisateur.role == 'etudiant':
            try:
                data_user['profil_id'] = utilisateur.profil_etudiant.id
            except Exception:
                data_user['profil_id'] = None
        elif utilisateur.role == 'enseignant':
            try:
                data_user['profil_id'] = utilisateur.profil_enseignant.id
            except Exception:
                data_user['profil_id'] = None
        else:
            data_user['profil_id'] = None

        return Response({
            "message":     "Connexion réussie",
            "access":      str(refresh.access_token),
            "refresh":     str(refresh),
            "utilisateur": data_user,
        })


class DeconnexionView(APIView):
    """POST /api/auth/deconnexion/ — Invalide le refresh token"""
    def post(self, request):
        try:
            token = RefreshToken(request.data.get("refresh"))
            token.blacklist()
        except Exception:
            pass
        return Response({"message": "Déconnexion réussie"})


class MonProfilView(APIView):
    """GET /api/auth/profil/ — Profil complet de l'utilisateur connecté"""
    def get(self, request):
        data = UtilisateurSerializer(request.user).data

        if request.user.role == 'etudiant':
            try:
                from etudiants.serializers import EtudiantSerializer
                profil = request.user.profil_etudiant
                data['profil_id'] = profil.id
                data['profil']    = EtudiantSerializer(profil).data
            except Exception:
                data['profil_id'] = None
        elif request.user.role == 'enseignant':
            try:
                from etudiants.serializers import EnseignantSerializer
                profil = request.user.profil_enseignant
                data['profil_id'] = profil.id
                data['profil']    = EnseignantSerializer(profil).data
            except Exception:
                data['profil_id'] = None

        return Response(data)


class CreerUtilisateurView(APIView):
    """POST /api/auth/creer/ — Créer un compte (admin uniquement)"""
    def post(self, request):
        if request.user.role != 'admin':
            return Response(
                {"erreur": "Action réservée aux administrateurs"},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = CreationUtilisateurSerializer(data=request.data)
        if serializer.is_valid():
            utilisateur = serializer.save()
            return Response(UtilisateurSerializer(utilisateur).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
