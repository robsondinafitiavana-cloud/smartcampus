"""
etudiants/models.py
Module 1 : Gestion des Étudiants (cycle complet)
Module 2 : Gestion des Enseignants
"""
from django.db import models
from users.models import Utilisateur


class Filiere(models.Model):
    """Filières disponibles : Informatique, Gestion, Droit..."""
    nom        = models.CharField(max_length=100)
    code       = models.CharField(max_length=20, unique=True)  # INF, GST, DRT
    description = models.TextField(blank=True)
    est_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'filieres'

    def __str__(self):
        return f"{self.code} - {self.nom}"


class Etudiant(models.Model):
    """
    Profil complet d'un étudiant.
    Lié à un compte Utilisateur (OneToOne).
    """
    NIVEAUX = [('L1','L1'),('L2','L2'),('L3','L3'),('M1','M1'),('M2','M2')]
    STATUTS = [
        ('actif','Actif'),
        ('suspendu','Suspendu'),
        ('diplome','Diplômé'),
        ('abandonne','Abandonné'),
    ]
    SEXES = [('M','Masculin'),('F','Féminin')]

    # Lien vers le compte utilisateur
    utilisateur   = models.OneToOneField(
        Utilisateur, on_delete=models.CASCADE, related_name='profil_etudiant'
    )
    filiere       = models.ForeignKey(Filiere, on_delete=models.PROTECT, null=True)

    # Infos personnelles
    nom           = models.CharField(max_length=100)
    prenom        = models.CharField(max_length=100)
    date_naissance = models.DateField(null=True, blank=True)
    lieu_naissance = models.CharField(max_length=100, blank=True)
    sexe          = models.CharField(max_length=1, choices=SEXES, blank=True)
    nationalite   = models.CharField(max_length=50, default='Malagasy')
    adresse       = models.TextField(blank=True)
    contact       = models.CharField(max_length=20, blank=True)

    # Infos académiques
    matricule     = models.CharField(max_length=20, unique=True)
    serie_bacc    = models.CharField(max_length=10, blank=True)
    annee_bacc    = models.IntegerField(null=True, blank=True)
    niveau        = models.CharField(max_length=10, choices=NIVEAUX, default='L1')
    annee_scolaire = models.CharField(max_length=9)  # ex: "2025-2026"
    statut        = models.CharField(max_length=20, choices=STATUTS, default='actif')

    # QR Code pour scan de présence
    qr_code       = models.TextField(unique=True, blank=True, null=True)

    date_inscription = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'etudiants'

    def __str__(self):
        return f"{self.matricule} - {self.nom} {self.prenom}"

    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}"


class Enseignant(models.Model):
    """Profil d'un enseignant."""
    utilisateur = models.OneToOneField(
        Utilisateur, on_delete=models.CASCADE, related_name='profil_enseignant'
    )
    nom         = models.CharField(max_length=100)
    prenom      = models.CharField(max_length=100)
    specialite  = models.CharField(max_length=100, blank=True)
    contact     = models.CharField(max_length=20, blank=True)
    grade       = models.CharField(max_length=50, blank=True)
    date_embauche = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'enseignants'

    def __str__(self):
        return f"{self.nom} {self.prenom}"


class Groupe(models.Model):
    """Groupes/promotions d'étudiants. Ex: INF3-A"""
    filiere       = models.ForeignKey(Filiere, on_delete=models.CASCADE)
    nom           = models.CharField(max_length=50)   # INF3-A
    niveau        = models.CharField(max_length=10)
    annee_scolaire = models.CharField(max_length=9)
    effectif_max  = models.IntegerField(default=30)

    class Meta:
        db_table = 'groupes'

    def __str__(self):
        return self.nom
