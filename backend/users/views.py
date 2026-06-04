"""users/views.py — Auth + Demandes d'inscription"""
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .models import Utilisateur, DemandeInscription
from .serializers import (
    ConnexionSerializer, UtilisateurSerializer,
    CreationUtilisateurSerializer, DemandeInscriptionSerializer,
    SoumettreDemandeSerializer
)


class ConnexionView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ConnexionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        utilisateur = serializer.validated_data['utilisateur']
        refresh     = RefreshToken.for_user(utilisateur)
        utilisateur.derniere_connexion = timezone.now()
        utilisateur.save(update_fields=['derniere_connexion'])

        data_user = UtilisateurSerializer(utilisateur).data
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
    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh")).blacklist()
        except Exception:
            pass
        return Response({"message": "Déconnexion réussie"})


class MonProfilView(APIView):
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
    def post(self, request):
        if request.user.role != 'admin':
            return Response({"erreur": "Action réservée aux administrateurs"}, status=403)
        serializer = CreationUtilisateurSerializer(data=request.data)
        if serializer.is_valid():
            return Response(
                UtilisateurSerializer(serializer.save()).data,
                status=201
            )
        return Response(serializer.errors, status=400)


# ══════════════════════════════════════════════════════════════
# DEMANDES D'INSCRIPTION
# ══════════════════════════════════════════════════════════════

class SoumettreDemandeView(APIView):
    """
    POST /api/demandes/soumettre/
    PUBLIC — Pas besoin d'être connecté.
    Soumis automatiquement après réussite du test d'admission.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SoumettreDemandeSerializer(data=request.data)
        if serializer.is_valid():
            demande = serializer.save()
            return Response({
                "message": f"✅ Votre demande a été envoyée à l'administration. "
                           f"Vous recevrez une réponse à l'adresse {demande.email}.",
                "demande_id": demande.id,
                "statut":     demande.statut,
            }, status=201)
        return Response(serializer.errors, status=400)


class DemandeInscriptionViewSet(ModelViewSet):
    """
    API Demandes d'inscription — ADMIN SEULEMENT
    GET  /api/demandes/              → liste toutes les demandes
    GET  /api/demandes/?statut=en_attente → filtrer
    POST /api/demandes/{id}/approuver/  → approuver + créer compte étudiant
    POST /api/demandes/{id}/refuser/    → refuser avec motif
    """
    serializer_class   = DemandeInscriptionSerializer
    http_method_names  = ['get', 'post', 'delete']

    def get_queryset(self):
        qs     = DemandeInscription.objects.select_related('traite_par', 'compte_cree')
        statut = self.request.query_params.get('statut')
        filiere = self.request.query_params.get('filiere')
        if statut:
            qs = qs.filter(statut=statut)
        if filiere:
            qs = qs.filter(filiere=filiere)
        return qs

    def approuver(self, request, pk=None):
        """
        POST /api/demandes/{id}/approuver/
        1. Crée un compte Utilisateur (rôle=etudiant)
        2. Crée le profil Etudiant
        3. Envoie un email de confirmation (simulé)
        4. Marque la demande comme approuvée
        """
        try:
            demande = DemandeInscription.objects.get(pk=pk)
        except DemandeInscription.DoesNotExist:
            return Response({"erreur": "Demande introuvable"}, status=404)

        if demande.statut != 'en_attente':
            return Response({"erreur": f"Cette demande est déjà {demande.statut}"}, status=400)

        # Vérifier que l'email n'existe pas déjà
        if Utilisateur.objects.filter(email=demande.email).exists():
            return Response({
                "erreur": f"Un compte existe déjà pour l'email {demande.email}"
            }, status=400)

        try:
            import uuid, hashlib
            from etudiants.models import Etudiant, Filiere

            # Mot de passe temporaire
            mot_de_passe_temp = f"SC{uuid.uuid4().hex[:8].upper()}"

            # 1. Créer le compte utilisateur
            compte = Utilisateur.objects.create_user(
                email=demande.email,
                mot_de_passe=mot_de_passe_temp,
                role='etudiant'
            )

            # 2. Générer le matricule
            annee   = timezone.now().year
            nb      = Etudiant.objects.filter(annee_scolaire__startswith=str(annee)).count() + 1
            matricule = f"{demande.filiere}{annee}{nb:04d}"

            # 3. Trouver la filière
            filiere_obj = Filiere.objects.filter(code=demande.filiere).first()

            # 4. Créer le profil étudiant
            qr_data = hashlib.sha256(f"{matricule}{uuid.uuid4()}".encode()).hexdigest()
            Etudiant.objects.create(
                utilisateur=compte,
                nom=demande.nom,
                prenom=demande.prenom,
                contact=demande.contact,
                matricule=matricule,
                filiere=filiere_obj,
                niveau='L1',
                annee_scolaire=f"{annee}-{annee+1}",
                qr_code=qr_data,
            )

            # 5. Marquer la demande comme approuvée
            demande.statut          = 'approuvee'
            demande.traite_par      = request.user
            demande.date_traitement = timezone.now()
            demande.compte_cree     = compte
            demande.save()

            return Response({
                "message":          f"✅ Compte créé pour {demande.prenom} {demande.nom}",
                "email":            demande.email,
                "matricule":        matricule,
                "mot_de_passe_temp": mot_de_passe_temp,
                "note":             "⚠️ Communiquez ce mot de passe temporaire à l'étudiant. Il devra le changer à la première connexion.",
            })

        except Exception as e:
            return Response({"erreur": f"Erreur lors de la création : {str(e)}"}, status=500)

    def refuser(self, request, pk=None):
        """
        POST /api/demandes/{id}/refuser/
        Corps: { "motif": "..." }
        """
        try:
            demande = DemandeInscription.objects.get(pk=pk)
        except DemandeInscription.DoesNotExist:
            return Response({"erreur": "Demande introuvable"}, status=404)

        if demande.statut != 'en_attente':
            return Response({"erreur": f"Cette demande est déjà {demande.statut}"}, status=400)

        demande.statut          = 'refusee'
        demande.traite_par      = request.user
        demande.date_traitement = timezone.now()
        demande.motif_refus     = request.data.get('motif', '')
        demande.save()

        return Response({
            "message": f"Demande de {demande.prenom} {demande.nom} refusée.",
            "motif":   demande.motif_refus,
        })