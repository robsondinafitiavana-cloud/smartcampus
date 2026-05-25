from django.contrib import admin
from .models import Filiere, Etudiant, Enseignant, Groupe

@admin.register(Filiere)
class FiliereAdmin(admin.ModelAdmin):
    list_display  = ['code', 'nom', 'est_active']
    search_fields = ['nom', 'code']

@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin):
    list_display  = ['matricule', 'nom', 'prenom', 'filiere', 'niveau', 'statut']
    list_filter   = ['filiere', 'niveau', 'statut']
    search_fields = ['matricule', 'nom', 'prenom']

@admin.register(Enseignant)
class EnseignantAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'prenom', 'specialite', 'grade']
    search_fields = ['nom', 'prenom']

@admin.register(Groupe)
class GroupeAdmin(admin.ModelAdmin):
    list_display  = ['nom', 'filiere', 'niveau', 'annee_scolaire']
    list_filter   = ['filiere', 'niveau']
