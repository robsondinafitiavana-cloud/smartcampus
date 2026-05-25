from django.contrib import admin
from .models import Cours, Note, Devoir

@admin.register(Cours)
class CoursAdmin(admin.ModelAdmin):
    list_display  = ['code_cours', 'intitule', 'enseignant', 'filiere', 'coefficient']
    list_filter   = ['filiere', 'semestre']
    search_fields = ['code_cours', 'intitule']

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display  = ['etudiant', 'cours', 'note_finale', 'est_valide', 'annee_scolaire']
    list_filter   = ['est_valide', 'annee_scolaire']
    search_fields = ['etudiant__matricule', 'etudiant__nom']

@admin.register(Devoir)
class DevoirAdmin(admin.ModelAdmin):
    list_display = ['titre', 'cours', 'enseignant', 'date_limite', 'est_publie']
