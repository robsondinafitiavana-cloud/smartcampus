"""
presences/models.py
Module 4 : Gestion Intelligente des Présences (IA)
Système hybride : QR Code (entrée) + Reconnaissance faciale (sortie)
"""
from django.db import models
from etudiants.models import Etudiant


class Salle(models.Model):
    """Salles de cours disponibles dans l'université."""
    TYPES = [
        ('cours',        'Cours'),
        ('amphi',        'Amphithéâtre'),
        ('labo',         'Laboratoire'),
        ('informatique', 'Salle Informatique'),
    ]
    nom            = models.CharField(max_length=50)
    capacite       = models.IntegerField()
    type_salle     = models.CharField(max_length=30, choices=TYPES, default='cours')
    est_disponible = models.BooleanField(default=True)

    class Meta:
        db_table = 'salles'

    def __str__(self):
        return f"{self.nom} ({self.capacite} places)"


class Presence(models.Model):
    """
    Enregistrement de présence d'un étudiant pour une séance.
    ENTRÉE  : scan QR Code de la carte étudiant
    SORTIE  : reconnaissance faciale (microservice Flask IA)
    ALERTE  : si taux de présence < 70% → notification automatique
    """
    METHODES = [
        ('qr_code', 'QR Code'),
        ('faciale', 'Reconnaissance Faciale'),
        ('manuel',  'Manuel'),
    ]
    STATUTS = [
        ('present', 'Présent'),
        ('absent',  'Absent'),
        ('retard',  'En retard'),
        ('excuse',  'Excusé'),
    ]

    etudiant        = models.ForeignKey(
        Etudiant, on_delete=models.CASCADE, related_name='presences'
    )
    # Référence via string pour éviter import circulaire avec planning
    emploi_du_temps = models.ForeignKey(
        'planning.EmploiDuTemps', on_delete=models.SET_NULL,
        null=True, blank=True  # Peut être null si pointage sans séance associée
    )
    date_seance     = models.DateField()
    heure_entree    = models.TimeField(null=True, blank=True)
    heure_sortie    = models.TimeField(null=True, blank=True)
    methode_entree  = models.CharField(max_length=20, choices=METHODES, blank=True)
    methode_sortie  = models.CharField(max_length=20, choices=METHODES, blank=True)
    statut          = models.CharField(max_length=20, choices=STATUTS, default='present')
    # Chemin vers l'image capturée lors de la reconnaissance faciale
    image_faciale   = models.TextField(blank=True, null=True)
    date_enregistrement = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'presences'
        # Contrainte : un seul enregistrement par étudiant par jour
        # (emploi_du_temps peut être null donc on exclut de unique_together)
        unique_together = ('etudiant', 'date_seance')

    def __str__(self):
        return f"{self.etudiant} — {self.date_seance} — {self.statut}"
