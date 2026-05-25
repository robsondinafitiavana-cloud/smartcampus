"""
paiements/models.py — Module 5 : Paiements
==========================================
NOUVEAU : EcheancierPaiement — calendrier mensuel fixe pour chaque étudiant
         (droits d'inscription + 10 mensualités M1→M10)
"""
from django.db import models
from etudiants.models import Etudiant
from users.models import Utilisateur


class EcheancierPaiement(models.Model):
    """
    Calendrier de paiement d'un étudiant pour une année scolaire.
    Généré automatiquement à l'inscription.
    Contient : droits d'inscription + mensualités M1 à M10.
    """
    TYPES_ECHEANCE = [
        ('inscription', 'Droits d\'inscription'),
        ('M1',  'Mensualité Octobre'),
        ('M2',  'Mensualité Novembre'),
        ('M3',  'Mensualité Décembre'),
        ('M4',  'Mensualité Janvier'),
        ('M5',  'Mensualité Février'),
        ('M6',  'Mensualité Mars'),
        ('M7',  'Mensualité Avril'),
        ('M8',  'Mensualité Mai'),
        ('M9',  'Mensualité Juin'),
        ('M10', 'Mensualité Juillet'),
    ]
    STATUTS = [
        ('paye',       'Payé'),
        ('en_attente', 'En attente'),
        ('en_retard',  'En retard'),
    ]

    etudiant       = models.ForeignKey(
        Etudiant, on_delete=models.CASCADE, related_name='echeancier'
    )
    type_echeance  = models.CharField(max_length=20, choices=TYPES_ECHEANCE)
    montant        = models.DecimalField(max_digits=12, decimal_places=2)
    statut         = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    annee_scolaire = models.CharField(max_length=9, default='2025-2026')

    # Date limite de paiement
    date_echeance  = models.DateField(null=True, blank=True)
    # Date effective du paiement
    date_paiement  = models.DateField(null=True, blank=True)

    # Qui a confirmé le paiement (admin)
    confirme_par   = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='paiements_confirmes'
    )
    reference      = models.CharField(max_length=50, blank=True)
    date_creation  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'echeancier_paiements'
        # Un seul enregistrement par type d'échéance par étudiant par année
        unique_together = ('etudiant', 'type_echeance', 'annee_scolaire')
        ordering = ['etudiant', 'annee_scolaire', 'type_echeance']

    def __str__(self):
        return f"{self.etudiant} — {self.type_echeance} — {self.statut}"

    @property
    def est_en_retard(self):
        """Vérifier automatiquement si le paiement est en retard."""
        from django.utils import timezone
        if self.date_echeance and self.statut == 'en_attente':
            return timezone.now().date() > self.date_echeance
        return False

    def get_label(self):
        """Retourner le label lisible du type d'échéance."""
        return dict(self.TYPES_ECHEANCE).get(self.type_echeance, self.type_echeance)


class Paiement(models.Model):
    """
    Historique des paiements enregistrés.
    Lié à une échéance du calendrier.
    """
    MODES = [
        ('especes',      'Espèces'),
        ('mobile_money', 'Mobile Money'),
        ('virement',     'Virement bancaire'),
    ]

    echeance      = models.ForeignKey(
        EcheancierPaiement, on_delete=models.CASCADE,
        related_name='paiements', null=True, blank=True
    )
    etudiant      = models.ForeignKey(
        Etudiant, on_delete=models.CASCADE, related_name='paiements'
    )
    montant       = models.DecimalField(max_digits=12, decimal_places=2)
    mode_paiement = models.CharField(max_length=30, choices=MODES, default='especes')
    reference     = models.CharField(max_length=50, unique=True)
    enregistre_par = models.ForeignKey(
        Utilisateur, on_delete=models.SET_NULL, null=True
    )
    date_creation  = models.DateTimeField(auto_now_add=True)
    notes          = models.TextField(blank=True)

    class Meta:
        db_table = 'paiements'
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.reference} — {self.etudiant} — {self.montant} Ar"
