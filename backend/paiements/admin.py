from django.contrib import admin
from .models import Paiement, EcheancierPaiement


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display  = ['reference', 'etudiant', 'montant', 'mode_paiement', 'date_creation']
    search_fields = ['reference', 'etudiant__matricule', 'etudiant__nom']


@admin.register(EcheancierPaiement)
class EcheancierAdmin(admin.ModelAdmin):
    list_display  = ['etudiant', 'type_echeance', 'montant', 'statut', 'date_echeance', 'annee_scolaire']
    list_filter   = ['statut', 'type_echeance', 'annee_scolaire']
    search_fields = ['etudiant__matricule', 'etudiant__nom']
