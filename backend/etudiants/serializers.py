"""etudiants/serializers.py"""
from rest_framework import serializers
from .models import Filiere, Etudiant, Enseignant, Groupe


class FiliereSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Filiere
        fields = '__all__'


class EtudiantSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    filiere_nom = serializers.CharField(source='filiere.nom', read_only=True)

    class Meta:
        model  = Etudiant
        fields = '__all__'
        extra_kwargs = {
            'photo': {'required': False},
        }

class EnseignantSerializer(serializers.ModelSerializer):
    class Meta:
        model   = Enseignant
        fields  = '__all__'
        # utilisateur est géré automatiquement - pas envoyé par le formulaire
        read_only_fields = ['utilisateur']


class GroupeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Groupe
        fields = '__all__'


class EtudiantCreationSerializer(serializers.ModelSerializer):
    """Créer un étudiant + son compte utilisateur en une seule requête."""
    email        = serializers.EmailField(write_only=True)
    mot_de_passe = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model   = Etudiant
        exclude = ['utilisateur', 'qr_code']
        extra_kwargs = {
            'annee_scolaire': {'required': False},
            'filiere': {'required': False, 'allow_null': True},
            'photo': {'required': False},
        }

    def validate(self, data):
        # Si annee_scolaire non fourni, mettre la valeur par défaut
        if not data.get('annee_scolaire'):
            data['annee_scolaire'] = '2025-2026'
        # Si filiere est vide string, mettre None
        if data.get('filiere') == '' or data.get('filiere') is None:
            data['filiere'] = None
        return data

    def create(self, validated_data):
        from users.models import Utilisateur
        import uuid, hashlib

        email        = validated_data.pop('email')
        mot_de_passe = validated_data.pop('mot_de_passe')

        # 1. Créer le compte utilisateur
        utilisateur = Utilisateur.objects.create_user(
            email=email, mot_de_passe=mot_de_passe, role='etudiant'
        )
        # 2. Générer QR Code unique
        matricule = validated_data.get('matricule', str(uuid.uuid4())[:8])
        qr_data   = hashlib.sha256(f"{matricule}{uuid.uuid4()}".encode()).hexdigest()

        # 3. Créer le profil étudiant
        etudiant = Etudiant.objects.create(
            utilisateur=utilisateur,
            qr_code=qr_data,
            **validated_data
        )
        return etudiant


class EnseignantCreationSerializer(serializers.ModelSerializer):
    """Créer un enseignant + son compte utilisateur en une seule requête."""
    email        = serializers.EmailField(write_only=True)
    mot_de_passe = serializers.CharField(
        write_only=True, min_length=8, required=False, default='smartcampus123'
    )

    class Meta:
        model   = Enseignant
        exclude = ['utilisateur']

    def create(self, validated_data):
        from users.models import Utilisateur

        email        = validated_data.pop('email')
        mot_de_passe = validated_data.pop('mot_de_passe', 'smartcampus123')

        # 1. Créer le compte utilisateur enseignant
        utilisateur = Utilisateur.objects.create_user(
            email=email, mot_de_passe=mot_de_passe, role='enseignant'
        )
        # 2. Créer le profil enseignant
        enseignant = Enseignant.objects.create(
            utilisateur=utilisateur,
            **validated_data
        )
        return enseignant
