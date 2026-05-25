from django.contrib import admin
from .models import Salle, Presence

@admin.register(Salle)
class SalleAdmin(admin.ModelAdmin):
    list_display = ['nom', 'capacite', 'type_salle', 'est_disponible']
    list_filter  = ['type_salle', 'est_disponible']

@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display  = ['etudiant', 'date_seance', 'statut', 'methode_entree']
    list_filter   = ['statut', 'date_seance']
    search_fields = ['etudiant__matricule', 'etudiant__nom']
