"""
planning/models.py — Module 6 + Communiqués
============================================
NOUVEAU : Communique avec CommentaireCommunique et LikeCommunique
"""
from django.db import models
from cours.models import Cours
from etudiants.models import Enseignant, Groupe


class EmploiDuTemps(models.Model):
    JOURS = [(1,'Lundi'),(2,'Mardi'),(3,'Mercredi'),(4,'Jeudi'),(5,'Vendredi'),(6,'Samedi')]
    TYPES_SEANCE = [('cours','Cours'),('td','TD'),('tp','TP'),('examen','Examen')]

    cours         = models.ForeignKey(Cours, on_delete=models.CASCADE)
    salle         = models.ForeignKey('presences.Salle', on_delete=models.CASCADE)
    groupe        = models.ForeignKey(Groupe, on_delete=models.CASCADE)
    enseignant    = models.ForeignKey(Enseignant, on_delete=models.CASCADE)
    jour_semaine  = models.IntegerField(choices=JOURS)
    heure_debut   = models.TimeField()
    heure_fin     = models.TimeField()
    type_seance   = models.CharField(max_length=20, choices=TYPES_SEANCE, default='cours')
    semaine_debut = models.DateField(null=True, blank=True)
    semaine_fin   = models.DateField(null=True, blank=True)
    est_annule    = models.BooleanField(default=False)
    motif_annulation = models.TextField(blank=True)

    class Meta:
        db_table = 'emplois_du_temps'
        constraints = [
            models.UniqueConstraint(fields=['salle','jour_semaine','heure_debut'], name='no_conflit_salle'),
            models.UniqueConstraint(fields=['enseignant','jour_semaine','heure_debut'], name='no_conflit_enseignant'),
        ]

    def __str__(self):
        return f"{self.cours} — {self.get_jour_semaine_display()} {self.heure_debut}"


# ══════════════════════════════════════════════════════════════
# NOUVEAU : Communiqués avec likes et commentaires
# ══════════════════════════════════════════════════════════════

class Communique(models.Model):
    """
    Communiqué publié par l'administrateur.
    Visible par tous les étudiants et enseignants.
    Permet : likes + commentaires.
    """
    CATEGORIES = [
        ('general',    'Général'),
        ('academique', 'Académique'),
        ('financier',  'Financier'),
        ('evenement',  'Événement'),
        ('urgent',     'Urgent'),
    ]

    auteur       = models.ForeignKey(
        'users.Utilisateur', on_delete=models.CASCADE, related_name='communiques'
    )
    titre        = models.CharField(max_length=200)
    contenu      = models.TextField()
    categorie    = models.CharField(max_length=20, choices=CATEGORIES, default='general')

    # Ciblage optionnel (null = tout le monde)
    filiere      = models.ForeignKey(
        'etudiants.Filiere', on_delete=models.SET_NULL,
        null=True, blank=True
    )

    # Pièce jointe optionnelle
    fichier      = models.FileField(upload_to='communiques/', null=True, blank=True)

    est_publie   = models.BooleanField(default=True)
    est_epingle  = models.BooleanField(default=False)   # Épinglé en haut
    date_creation    = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'communiques'
        ordering = ['-est_epingle', '-date_creation']

    def __str__(self):
        return self.titre

    @property
    def nb_likes(self):
        return self.likes.count()

    @property
    def nb_commentaires(self):
        return self.commentaires.filter(parent=None).count()


class LikeCommunique(models.Model):
    """Un utilisateur like un communiqué (un seul like par personne)."""
    communique   = models.ForeignKey(Communique, on_delete=models.CASCADE, related_name='likes')
    utilisateur  = models.ForeignKey('users.Utilisateur', on_delete=models.CASCADE)
    date_like    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'likes_communiques'
        unique_together = ('communique', 'utilisateur')  # Un seul like par personne

    def __str__(self):
        return f"{self.utilisateur} ❤️ {self.communique}"


class CommentaireCommunique(models.Model):
    """Commentaire sur un communiqué. Supporte les réponses (parent)."""
    communique   = models.ForeignKey(
        Communique, on_delete=models.CASCADE, related_name='commentaires'
    )
    auteur       = models.ForeignKey(
        'users.Utilisateur', on_delete=models.CASCADE, related_name='commentaires'
    )
    contenu      = models.TextField()

    # Réponse à un autre commentaire (null = commentaire racine)
    parent       = models.ForeignKey(
        'self', on_delete=models.CASCADE,
        null=True, blank=True, related_name='reponses'
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    est_modifie   = models.BooleanField(default=False)

    class Meta:
        db_table = 'commentaires_communiques'
        ordering = ['date_creation']

    def __str__(self):
        return f"{self.auteur} → {self.communique.titre[:30]}"


# Ancienne table Annonce conservée pour compatibilité
class Annonce(models.Model):
    auteur    = models.ForeignKey('users.Utilisateur', on_delete=models.CASCADE)
    filiere   = models.ForeignKey('etudiants.Filiere', on_delete=models.SET_NULL, null=True, blank=True)
    groupe    = models.ForeignKey('etudiants.Groupe', on_delete=models.SET_NULL, null=True, blank=True)
    titre     = models.CharField(max_length=200)
    contenu   = models.TextField()
    date_publication = models.DateTimeField(auto_now_add=True)
    est_importante   = models.BooleanField(default=False)

    class Meta:
        db_table = 'annonces'
        ordering = ['-date_publication']
