from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur

@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display  = ['email', 'role', 'est_actif', 'date_creation']
    list_filter   = ['role', 'est_actif']
    search_fields = ['email']
    ordering      = ['email']
    fieldsets     = (
        (None,          {'fields': ('email', 'password')}),
        ('Informations',{'fields': ('role', 'est_actif')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'password1', 'password2', 'role')}),
    )
