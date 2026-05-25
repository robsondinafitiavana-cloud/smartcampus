"""
users/models.py - Modèle Utilisateur Personnalisé
Tous les comptes (admin, enseignant, étudiant) utilisent ce modèle.
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
    """
    Modèle de base pour tous les comptes du système.
    Relations: OneToOne vers Etudiant ou Enseignant
    """
    ROLES = [
        ('admin', 'Administrateur'),
        ('enseignant', 'Enseignant'),
        ('etudiant', 'Etudiant'),
    ]
    email              = models.EmailField(unique=True)
    role               = models.CharField(max_length=20, choices=ROLES)
    est_actif          = models.BooleanField(default=True)
    date_creation      = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)
    is_staff           = models.BooleanField(default=False)
    is_superuser       = models.BooleanField(default=False)

    objects = UtilisateurManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role']

    class Meta:
        db_table = 'utilisateurs'

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_active(self):
        return self.est_actif
