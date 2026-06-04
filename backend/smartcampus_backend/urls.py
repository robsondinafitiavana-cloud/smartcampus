"""urls.py — Routage principal SmartCampus"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import (
    ConnexionView, DeconnexionView, MonProfilView, CreerUtilisateurView,
    SoumettreDemandeView, DemandeInscriptionViewSet
)
from etudiants.views import FiliereViewSet, EtudiantViewSet, EnseignantViewSet, GroupeViewSet
from cours.views import CoursViewSet, NoteViewSet, DevoirViewSet as DevoirCoursViewSet
from devoirs.views import (
    DevoirViewSet, GroupeTravailViewSet, SoumissionViewSet,
    CalendrierViewSet, NotificationViewSet, BadgeViewSet,
)
from presences.views import SalleViewSet, PresenceViewSet, PointageQRCodeView, PointageFacialeView
from paiements.views import EcheancierViewSet, PaiementViewSet
from planning.views import EmploiDuTempsViewSet, AnnonceViewSet, CommuniqueViewSet

router = DefaultRouter()
router.register('filieres',    FiliereViewSet,            basename='filiere')
router.register('groupes',     GroupeViewSet,             basename='groupe')
router.register('etudiants',   EtudiantViewSet,           basename='etudiant')
router.register('enseignants', EnseignantViewSet,         basename='enseignant')
router.register('cours',       CoursViewSet,              basename='cours')
router.register('notes',       NoteViewSet,               basename='note')
router.register('devoirs-cours',   DevoirCoursViewSet,   basename='devoir-cours')
router.register('devoirs',         DevoirViewSet,        basename='devoirs')
router.register('groupes-travail', GroupeTravailViewSet, basename='groupes-travail')
router.register('soumissions',     SoumissionViewSet,    basename='soumissions')
router.register('calendrier',      CalendrierViewSet,    basename='calendrier')
router.register('notifications',   NotificationViewSet,  basename='notifications')
router.register('badges',          BadgeViewSet,         basename='badges')
router.register('salles',      SalleViewSet,              basename='salle')
router.register('presences',   PresenceViewSet,           basename='presence')
router.register('echeancier',  EcheancierViewSet,         basename='echeancier')
router.register('paiements',   PaiementViewSet,           basename='paiement')
router.register('planning',    EmploiDuTempsViewSet,      basename='planning')
router.register('annonces',    AnnonceViewSet,            basename='annonce')
router.register('communiques', CommuniqueViewSet,         basename='communique')
router.register('demandes',    DemandeInscriptionViewSet, basename='demande')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/connexion/',   ConnexionView.as_view(),        name='connexion'),
    path('api/auth/deconnexion/', DeconnexionView.as_view(),      name='deconnexion'),
    path('api/auth/profil/',      MonProfilView.as_view(),        name='mon-profil'),
    path('api/auth/creer/',       CreerUtilisateurView.as_view(), name='creer-utilisateur'),
    path('api/auth/refresh/',     TokenRefreshView.as_view(),     name='token-refresh'),

    # Demandes d'inscription (PUBLIC)
    path('api/demandes/soumettre/', SoumettreDemandeView.as_view(), name='soumettre-demande'),

    # Actions sur demandes (admin)
    path('api/demandes/<int:pk>/approuver/',
         DemandeInscriptionViewSet.as_view({'post': 'approuver'}), name='approuver-demande'),
    path('api/demandes/<int:pk>/refuser/',
         DemandeInscriptionViewSet.as_view({'post': 'refuser'}),   name='refuser-demande'),

    # Présences
    path('api/presences/qr/',      PointageQRCodeView.as_view(),  name='pointage-qr'),
    path('api/presences/faciale/', PointageFacialeView.as_view(), name='pointage-faciale'),

    # Toutes les routes CRUD
    path('api/', include(router.urls)),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)