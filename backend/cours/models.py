"""
cours/models.py
Module 3 : Gestion Automatisée des Notes
"""
from django.db import models
from etudiants.models import Etudiant, Enseignant, Filiere, Groupe


class Cours(models.Model):
    """Une matière/cours enseigné."""
    enseignant   = models.ForeignKey(Enseignant, on_delete=models.SET_NULL, null=True)
    filiere      = models.ForeignKey(Filiere, on_delete=models.CASCADE)
    code_cours   = models.CharField(max_length=20, unique=True)  # INF301
    intitule     = models.CharField(max_length=150)               # "Base de données"
    description  = models.TextField(blank=True)
    coefficient  = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    volume_horaire = models.IntegerField(null=True, blank=True)
    semestre     = models.IntegerField(choices=[(1,'S1'),(2,'S2')], null=True)
    niveau       = models.CharField(max_length=10, blank=True)

    class Meta:
        db_table = 'cours'

    def __str__(self):
        return f"{self.code_cours} - {self.intitule}"


class InscriptionCours(models.Model):
    """Qui suit quel cours (liaison Étudiant <-> Cours)."""
    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE)
    cours    = models.ForeignKey(Cours, on_delete=models.CASCADE)
    groupe   = models.ForeignKey(Groupe, on_delete=models.SET_NULL, null=True)
    date_inscription = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inscriptions_cours'
        unique_together = ('etudiant', 'cours')  # Pas 2x le même cours


class Note(models.Model):
    """
    Notes d'un étudiant pour un cours.
    La note finale est calculée automatiquement.
    """
    etudiant       = models.ForeignKey(Etudiant, on_delete=models.CASCADE, related_name='notes')
    cours          = models.ForeignKey(Cours, on_delete=models.CASCADE)
    note_controle  = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    note_examen    = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    note_tp        = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    note_finale    = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    semestre       = models.IntegerField(choices=[(1,'S1'),(2,'S2')], null=True)
    annee_scolaire = models.CharField(max_length=9)
    est_valide     = models.BooleanField(null=True)       # None = pas encore calculé
    est_rattrapage = models.BooleanField(default=False)
    date_saisie    = models.DateTimeField(auto_now_add=True)
    saisi_par      = models.ForeignKey(
        'users.Utilisateur', on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        db_table = 'notes'
        unique_together = ('etudiant', 'cours', 'annee_scolaire', 'semestre')

    def save(self, *args, **kwargs):
        """
        Calcul automatique de la note finale avant sauvegarde.
        Formule : 40% contrôle + 50% examen + 10% TP
        """
        ctrl = float(self.note_controle or 0)
        exam = float(self.note_examen or 0)
        tp   = float(self.note_tp or 0)

        self.note_finale   = round(ctrl * 0.4 + exam * 0.5 + tp * 0.1, 2)
        self.est_valide    = self.note_finale >= 10
        self.est_rattrapage = 7 <= self.note_finale < 10

        super().save(*args, **kwargs)


class SupportCours(models.Model):
    """Fichiers/supports publiés par l'enseignant."""
    cours    = models.ForeignKey(Cours, on_delete=models.CASCADE, related_name='supports')
    titre    = models.CharField(max_length=200)
    fichier  = models.FileField(upload_to='supports/')
    date_pub = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'supports_cours'


class Devoir(models.Model):
    """Devoir créé par un enseignant."""
    TYPES = [('individuel','Individuel'),('groupe','En groupe')]
    cours        = models.ForeignKey(Cours, on_delete=models.CASCADE)
    enseignant   = models.ForeignKey(Enseignant, on_delete=models.CASCADE)
    groupe       = models.ForeignKey(Groupe, on_delete=models.SET_NULL, null=True, blank=True)
    titre        = models.CharField(max_length=200)
    description  = models.TextField(blank=True)
    type_devoir  = models.CharField(max_length=20, choices=TYPES, default='individuel')
    date_limite  = models.DateTimeField()
    date_creation = models.DateTimeField(auto_now_add=True)
    est_publie   = models.BooleanField(default=False)

    class Meta:
        db_table = 'devoirs'


class SoumissionDevoir(models.Model):
    """Réponse d'un étudiant à un devoir."""
    devoir      = models.ForeignKey(Devoir, on_delete=models.CASCADE)
    etudiant    = models.ForeignKey(Etudiant, on_delete=models.CASCADE)
    fichier_path = models.TextField(blank=True)
    commentaire = models.TextField(blank=True)
    est_fait    = models.BooleanField(default=False)  # Marqué "fait" par l'étudiant
    date_soumission = models.DateTimeField(auto_now_add=True)
    note_obtenue = models.DecimalField(max_digits=5, decimal_places=2, null=True)

    class Meta:
        db_table = 'devoirs_soumissions'
        unique_together = ('devoir', 'etudiant')
