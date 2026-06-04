"""
users/models.py — Modèle Utilisateur + DemandeInscription
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


class UtilisateurManager(BaseUserManager):
    def create_user(self, email, mot_de_passe=None, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        utilisateur = self.model(email=email, **extra_fields)
        utilisateur.set_password(mot_de_passe)
        utilisateur.save(using=self._db)
        return utilisateur

    def create_superuser(self, email, mot_de_passe=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, mot_de_passe, **extra_fields)


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('admin',      'Administrateur'),
        ('enseignant', 'Enseignant'),
        ('etudiant',   'Étudiant'),
    ]
    email              = models.EmailField(unique=True)
    role               = models.CharField(max_length=20, choices=ROLES)
    est_actif          = models.BooleanField(default=True)
    date_creation      = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)
    is_staff           = models.BooleanField(default=False)
    is_superuser       = models.BooleanField(default=False)

    objects = UtilisateurManager()
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['role']

    class Meta:
        db_table = 'utilisateurs'

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_active(self):
        return self.est_actif


class DemandeInscription(models.Model):
    """
    Demande d'inscription soumise après réussite du test d'admission.
    L'admin voit cette demande et peut l'approuver ou la refuser.
    """
    STATUTS = [
        ('en_attente', 'En attente'),
        ('approuvee',  'Approuvée'),
        ('refusee',    'Refusée'),
    ]
    FILIERES = [
        ('INF', 'Informatique'),
        ('GST', 'Gestion'),
        ('DRT', 'Droit'),
    ]

    # Infos du candidat
    nom            = models.CharField(max_length=100)
    prenom         = models.CharField(max_length=100)
    email          = models.EmailField()
    contact        = models.CharField(max_length=20, blank=True)
    filiere        = models.CharField(max_length=10, choices=FILIERES)

    # Résultat du test
    score_test     = models.IntegerField()           # Score en %
    nb_bonnes      = models.IntegerField(default=0)
    nb_questions   = models.IntegerField(default=15)

    # Statut de la demande
    statut         = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    date_demande   = models.DateTimeField(auto_now_add=True)

    # Traitement par l'admin
    traite_par     = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='demandes_traitees'
    )
    date_traitement = models.DateTimeField(null=True, blank=True)
    motif_refus     = models.TextField(blank=True)

    # Compte créé après approbation
    compte_cree    = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='demande_origine'
    )

    class Meta:
        db_table = 'demandes_inscription'
        ordering = ['-date_demande']

    def __str__(self):
        return f"{self.prenom} {self.nom} — {self.filiere} — {self.score_test}%"

    def get_filiere_nom(self):
        return dict(self.FILIERES).get(self.filiere, self.filiere)