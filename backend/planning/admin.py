from django.contrib import admin
from .models import EmploiDuTemps, Annonce

@admin.register(EmploiDuTemps)
class EmploiDuTempsAdmin(admin.ModelAdmin):
    list_display = ['cours', 'groupe', 'salle', 'jour_semaine', 'heure_debut', 'heure_fin', 'est_annule']
    list_filter  = ['jour_semaine', 'type_seance', 'est_annule']

@admin.register(Annonce)
class AnnonceAdmin(admin.ModelAdmin):
    list_display = ['titre', 'auteur', 'filiere', 'date_publication', 'est_importante']
    list_filter  = ['est_importante', 'filiere']

from .models import Communique, LikeCommunique, CommentaireCommunique
@admin.register(Communique)
class CommuniqueAdmin(admin.ModelAdmin):
    list_display = ['titre','auteur','categorie','est_publie','est_epingle','date_creation']
    list_filter  = ['categorie','est_publie','est_epingle']
    search_fields = ['titre','contenu']

@admin.register(CommentaireCommunique)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ['auteur','communique','date_creation']
