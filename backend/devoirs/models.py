"""
devoirs/models.py  —  Module 8 : Devoirs & Travaux de Groupe
"""
from django.db import models
from django.utils import timezone
from etudiants.models import Etudiant, Enseignant, Groupe, Filiere
from cours.models import Cours


# ──────────────────────────────────────────────
#  DEVOIR
# ──────────────────────────────────────────────

class Devoir(models.Model):
    TYPE_CHOICES = [
        ('individuel', 'Individuel'),
        ('groupe',     'Travail de groupe'),
        ('examen',     'Examen'),
    ]
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('publie',    'Publié'),
        ('clos',      'Clôturé'),
    ]

    cours           = models.ForeignKey(Cours,       on_delete=models.CASCADE,  related_name='devoirs_module')
    enseignant      = models.ForeignKey(Enseignant,  on_delete=models.CASCADE,  related_name='devoirs_crees')
    groupe_classe   = models.ForeignKey(Groupe,      on_delete=models.SET_NULL, null=True, blank=True, related_name='devoirs_classe')
    titre           = models.CharField(max_length=200)
    description     = models.TextField(blank=True)
    consignes       = models.TextField(blank=True)
    type_devoir     = models.CharField(max_length=20, choices=TYPE_CHOICES,  default='individuel')
    statut          = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    date_limite     = models.DateTimeField()
    note_max        = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    coefficient     = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)

    detection_plagiat       = models.BooleanField(default=True)
    creation_groupes_auto   = models.BooleanField(default=False)
    taille_groupe_min       = models.IntegerField(default=2)
    taille_groupe_max       = models.IntegerField(default=5)
    autoriser_soumission_tardive = models.BooleanField(default=False)
    penalite_retard_pct     = models.IntegerField(default=0)
    fichier_sujet           = models.FileField(upload_to='devoirs/sujets/', null=True, blank=True)

    date_creation    = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'devoirs_module'
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.titre} ({self.cours.code_cours})"

    @property
    def est_en_retard(self):
        return timezone.now() > self.date_limite

    @property
    def statut_kanban(self):
        nb = self.soumissions.filter(est_soumis=True).count()
        if self.statut == 'brouillon':
            return 'todo'
        if nb == 0 and self.est_en_retard:
            return 'late'
        if nb > 0:
            return 'done'
        return 'inprogress'


# ──────────────────────────────────────────────
#  GROUPE DE TRAVAIL
# ──────────────────────────────────────────────

class GroupeTravail(models.Model):
    devoir      = models.ForeignKey(Devoir,   on_delete=models.CASCADE,  related_name='groupes_travail')
    nom         = models.CharField(max_length=100)
    membres     = models.ManyToManyField(Etudiant, through='MembreGroupe', related_name='groupes_travail')
    chef        = models.ForeignKey(Etudiant, on_delete=models.SET_NULL,  null=True, blank=True, related_name='groupes_chef')
    est_complet = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'groupes_travail'

    def __str__(self):
        return f"{self.nom} — {self.devoir.titre}"

    def mettre_a_jour_completude(self):
        self.est_complet = self.membres.count() >= self.devoir.taille_groupe_min
        self.save(update_fields=['est_complet'])


class MembreGroupe(models.Model):
    groupe               = models.ForeignKey(GroupeTravail, on_delete=models.CASCADE)
    etudiant             = models.ForeignKey(Etudiant,      on_delete=models.CASCADE)
    contribution_pct     = models.IntegerField(default=0)
    nb_messages_chat     = models.IntegerField(default=0)
    nb_fichiers_partages = models.IntegerField(default=0)
    date_adhesion        = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'membres_groupe'
        unique_together = ('groupe', 'etudiant')

    def __str__(self):
        return f"{self.etudiant} → {self.groupe}"


# ──────────────────────────────────────────────
#  SOUMISSION
# ──────────────────────────────────────────────

class SoumissionDevoir(models.Model):
    devoir          = models.ForeignKey(Devoir,        on_delete=models.CASCADE,  related_name='soumissions')
    etudiant        = models.ForeignKey(Etudiant,      on_delete=models.CASCADE,  null=True, blank=True, related_name='soumissions_devoirs')
    groupe_travail  = models.ForeignKey(GroupeTravail, on_delete=models.CASCADE,  null=True, blank=True, related_name='soumissions')
    commentaire     = models.TextField(blank=True)
    est_soumis      = models.BooleanField(default=False)
    est_en_retard   = models.BooleanField(default=False)
    date_soumission = models.DateTimeField(null=True, blank=True)

    note_obtenue             = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    commentaire_correction   = models.TextField(blank=True)
    date_correction          = models.DateTimeField(null=True, blank=True)
    corrige_par              = models.ForeignKey(Enseignant, on_delete=models.SET_NULL, null=True, blank=True)

    pourcentage_plagiat = models.IntegerField(default=0)
    plagiat_details     = models.JSONField(default=dict, blank=True)
    alerte_plagiat      = models.BooleanField(default=False)

    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'soumissions_devoirs'

    def __str__(self):
        qui = str(self.etudiant) if self.etudiant else str(self.groupe_travail)
        return f"{qui} → {self.devoir.titre}"

    def save(self, *args, **kwargs):
        if self.est_soumis and not self.date_soumission:
            self.date_soumission = timezone.now()
        if self.est_soumis and self.date_soumission:
            self.est_en_retard = self.date_soumission > self.devoir.date_limite
        self.alerte_plagiat = self.pourcentage_plagiat >= 60
        super().save(*args, **kwargs)


class PieceJointeDevoir(models.Model):
    TYPE_CHOICES = [
        ('soumission', 'Fichier soumission'),
        ('sujet',      'Sujet'),
        ('partage',    'Fichier partagé groupe'),
    ]
    soumission   = models.ForeignKey(SoumissionDevoir, on_delete=models.CASCADE, related_name='pieces_jointes', null=True, blank=True)
    groupe       = models.ForeignKey(GroupeTravail,    on_delete=models.CASCADE, related_name='fichiers_partages', null=True, blank=True)
    depose_par   = models.ForeignKey(Etudiant,         on_delete=models.SET_NULL, null=True)
    nom_fichier  = models.CharField(max_length=200)
    fichier      = models.FileField(upload_to='devoirs/soumissions/')
    type_fichier = models.CharField(max_length=20, choices=TYPE_CHOICES, default='soumission')
    taille_ko    = models.IntegerField(default=0)
    date_depot   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pieces_jointes_devoirs'

    def __str__(self):
        return self.nom_fichier


# ──────────────────────────────────────────────
#  CHAT DE GROUPE
# ──────────────────────────────────────────────

class MessageGroupe(models.Model):
    groupe     = models.ForeignKey(GroupeTravail, on_delete=models.CASCADE, related_name='messages')
    auteur     = models.ForeignKey(Etudiant,      on_delete=models.CASCADE)
    contenu    = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)
    modifie    = models.BooleanField(default=False)

    class Meta:
        db_table = 'messages_groupe'
        ordering = ['date_envoi']

    def __str__(self):
        return f"{self.auteur} @ {self.groupe}: {self.contenu[:50]}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        MembreGroupe.objects.filter(
            groupe=self.groupe, etudiant=self.auteur
        ).update(nb_messages_chat=models.F('nb_messages_chat') + 1)
        self._recalculer_contributions()

    def _recalculer_contributions(self):
        membres = MembreGroupe.objects.filter(groupe=self.groupe)
        total = sum(m.nb_messages_chat + m.nb_fichiers_partages for m in membres)
        if total > 0:
            for m in membres:
                m.contribution_pct = round((m.nb_messages_chat + m.nb_fichiers_partages) * 100 / total)
                m.save(update_fields=['contribution_pct'])


# ──────────────────────────────────────────────
#  CALENDRIER
# ──────────────────────────────────────────────

class EvenementCalendrier(models.Model):
    TYPE_CHOICES = [
        ('devoir',  'Devoir'),
        ('examen',  'Examen'),
        ('rendu',   'Date de rendu'),
        ('conge',   'Congé'),
        ('reunion', 'Réunion'),
    ]
    titre       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    type_event  = models.CharField(max_length=20, choices=TYPE_CHOICES, default='devoir')
    date_debut  = models.DateTimeField()
    date_fin    = models.DateTimeField(null=True, blank=True)
    filiere     = models.ForeignKey(Filiere, on_delete=models.CASCADE,  null=True, blank=True)
    groupe      = models.ForeignKey(Groupe,  on_delete=models.SET_NULL, null=True, blank=True)
    devoir_lie  = models.OneToOneField(Devoir, on_delete=models.CASCADE, null=True, blank=True, related_name='evenement_calendrier')
    cree_par    = models.ForeignKey(Enseignant, on_delete=models.SET_NULL, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'evenements_calendrier'
        ordering = ['date_debut']

    def __str__(self):
        return f"{self.get_type_event_display()} : {self.titre}"


# ──────────────────────────────────────────────
#  NOTIFICATIONS
# ──────────────────────────────────────────────

class Notification(models.Model):
    TYPE_CHOICES = [
        ('nouveau_devoir',   'Nouveau devoir'),
        ('rappel_echeance',  'Rappel échéance'),
        ('soumission_recue', 'Soumission reçue'),
        ('devoir_corrige',   'Devoir corrigé'),
        ('alerte_retard',    'Retard'),
        ('alerte_plagiat',   'Plagiat'),
        ('badge_obtenu',     'Badge obtenu'),
        ('message_groupe',   'Message groupe'),
    ]
    destinataire_etudiant   = models.ForeignKey(Etudiant,   on_delete=models.CASCADE, null=True, blank=True, related_name='notifications_devoirs')
    destinataire_enseignant = models.ForeignKey(Enseignant, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications_devoirs')
    type_notif  = models.CharField(max_length=30, choices=TYPE_CHOICES)
    titre       = models.CharField(max_length=200)
    message     = models.TextField()
    devoir      = models.ForeignKey(Devoir, on_delete=models.CASCADE, null=True, blank=True)
    est_lu      = models.BooleanField(default=False)
    date_envoi  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications_devoirs'
        ordering = ['-date_envoi']

    def __str__(self):
        return f"[{self.type_notif}] {self.titre}"


# ──────────────────────────────────────────────
#  BADGES
# ──────────────────────────────────────────────

class TypeBadge(models.Model):
    CATEGORIE_CHOICES = [
        ('excellence',    'Excellence'),
        ('ponctualite',   'Ponctualité'),
        ('collaboration', 'Collaboration'),
        ('integrite',     'Intégrité'),
        ('progression',   'Progression'),
    ]
    code        = models.CharField(max_length=50, unique=True)
    nom         = models.CharField(max_length=100)
    description = models.TextField()
    categorie   = models.CharField(max_length=20, choices=CATEGORIE_CHOICES)
    icone       = models.CharField(max_length=50, default='star')
    couleur     = models.CharField(max_length=20, default='gold')
    condition   = models.TextField()
    points      = models.IntegerField(default=10)

    class Meta:
        db_table = 'types_badges'

    def __str__(self):
        return self.nom


class BadgeEtudiant(models.Model):
    etudiant       = models.ForeignKey(Etudiant,  on_delete=models.CASCADE, related_name='badges_devoirs')
    badge          = models.ForeignKey(TypeBadge, on_delete=models.CASCADE)
    date_obtention = models.DateTimeField(auto_now_add=True)
    devoir_lie     = models.ForeignKey(Devoir, on_delete=models.SET_NULL, null=True, blank=True)
    commentaire    = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table        = 'badges_etudiants'
        unique_together = ('etudiant', 'badge')

    def __str__(self):
        return f"{self.etudiant} → {self.badge.nom}"
