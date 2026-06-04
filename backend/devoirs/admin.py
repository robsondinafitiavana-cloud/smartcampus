from django.contrib import admin
from .models import (Devoir, GroupeTravail, MembreGroupe, SoumissionDevoir,
                     PieceJointeDevoir, MessageGroupe, EvenementCalendrier,
                     Notification, TypeBadge, BadgeEtudiant)

@admin.register(Devoir)
class DevoirAdmin(admin.ModelAdmin):
    list_display  = ['titre','cours','enseignant','type_devoir','statut','date_limite']
    list_filter   = ['type_devoir','statut','detection_plagiat']
    search_fields = ['titre','cours__intitule']

@admin.register(GroupeTravail)
class GroupeTravailAdmin(admin.ModelAdmin):
    list_display  = ['nom','devoir','chef','est_complet']

@admin.register(SoumissionDevoir)
class SoumissionAdmin(admin.ModelAdmin):
    list_display  = ['devoir','etudiant','est_soumis','est_en_retard','note_obtenue','pourcentage_plagiat','alerte_plagiat']
    list_filter   = ['est_soumis','alerte_plagiat']

@admin.register(EvenementCalendrier)
class CalendrierAdmin(admin.ModelAdmin):
    list_display  = ['titre','type_event','date_debut','filiere']
    list_filter   = ['type_event']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ['titre','type_notif','est_lu','date_envoi']
    list_filter   = ['type_notif','est_lu']

@admin.register(TypeBadge)
class TypeBadgeAdmin(admin.ModelAdmin):
    list_display  = ['code','nom','categorie','points']

@admin.register(BadgeEtudiant)
class BadgeEtudiantAdmin(admin.ModelAdmin):
    list_display  = ['etudiant','badge','date_obtention']

admin.site.register(MembreGroupe)
admin.site.register(MessageGroupe)
admin.site.register(PieceJointeDevoir)
