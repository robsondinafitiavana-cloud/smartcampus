"""
ia/models.py — Sauvegarde des résultats IA
===========================================
PredictionRisque : résultats de prédiction de décrochage (Module 7)
ResultatAdmission : résultats du test d'admission (Module 1)
"""
from django.db import models
from django.utils import timezone


class PredictionRisque(models.Model):
    """Résultat de prédiction de décrochage sauvegardé en DB."""
    RISQUE_CHOICES = [
        ("faible", "Faible"),
        ("moyen",  "Moyen"),
        ("eleve",  "Élevé"),
    ]
    etudiant_id     = models.IntegerField(db_index=True)
    risque          = models.CharField(max_length=10, choices=RISQUE_CHOICES)
    probabilite     = models.FloatField()
    facteurs        = models.JSONField(default=list)
    recommandations = models.JSONField(default=list)
    mode_calcul     = models.CharField(max_length=20, default="heuristique")  # ml ou heuristique
    alerte_envoyee  = models.BooleanField(default=False)
    created_at      = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ia_predictions_risque'
        ordering = ["-created_at"]
        indexes  = [models.Index(fields=["etudiant_id", "risque"])]

    def __str__(self):
        return f"Étudiant {self.etudiant_id} — {self.risque} ({self.probabilite*100:.0f}%)"


class ResultatAdmission(models.Model):
    """Résultat du test d'admission IA."""
    candidat_id  = models.CharField(max_length=100, db_index=True)
    filiere      = models.CharField(max_length=10)
    score        = models.FloatField()
    nb_bonnes    = models.IntegerField(default=0)
    nb_questions = models.IntegerField(default=15)
    admis        = models.BooleanField()
    niveau       = models.CharField(max_length=20, blank=True)
    detail       = models.JSONField(default=list, blank=True)
    created_at   = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ia_resultats_admission'
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.candidat_id} — {self.filiere} — {'ADMIS' if self.admis else 'REFUSÉ'} ({self.score}%)"
