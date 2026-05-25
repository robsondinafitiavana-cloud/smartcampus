"""urls.py — Routage principal SmartCampus"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import ConnexionView, DeconnexionView, MonProfilView, CreerUtilisateurView
from etudiants.views import FiliereViewSet, EtudiantViewSet, EnseignantViewSet, GroupeViewSet
from cours.views import CoursViewSet, NoteViewSet, DevoirViewSet
from presences.views import SalleViewSet, PresenceViewSet, PointageQRCodeView, PointageFacialeView
from paiements.views import EcheancierViewSet, PaiementViewSet
from planning.views import EmploiDuTempsViewSet, AnnonceViewSet, CommuniqueViewSet

router = DefaultRouter()
router.register('filieres',    FiliereViewSet,       basename='filiere')
router.register('groupes',     GroupeViewSet,        basename='groupe')
router.register('etudiants',   EtudiantViewSet,      basename='etudiant')
router.register('enseignants', EnseignantViewSet,    basename='enseignant')
router.register('cours',       CoursViewSet,         basename='cours')
router.register('notes',       NoteViewSet,          basename='note')
router.register('devoirs',     DevoirViewSet,        basename='devoir')
router.register('salles',      SalleViewSet,         basename='salle')
router.register('presences',   PresenceViewSet,      basename='presence')
router.register('echeancier',  EcheancierViewSet,    basename='echeancier')  # NOUVEAU
router.register('paiements',   PaiementViewSet,      basename='paiement')
router.register('planning',    EmploiDuTempsViewSet, basename='planning')
router.register('annonces',    AnnonceViewSet,       basename='annonce')
router.register('communiques', CommuniqueViewSet,    basename='communique')  # NOUVEAU

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/connexion/',   ConnexionView.as_view(),        name='connexion'),
    path('api/auth/deconnexion/', DeconnexionView.as_view(),      name='deconnexion'),
    path('api/auth/profil/',      MonProfilView.as_view(),        name='mon-profil'),
    path('api/auth/creer/',       CreerUtilisateurView.as_view(), name='creer-utilisateur'),
    path('api/auth/refresh/',     TokenRefreshView.as_view(),     name='token-refresh'),
    path('api/presences/qr/',     PointageQRCodeView.as_view(),   name='pointage-qr'),
    path('api/presences/faciale/',PointageFacialeView.as_view(),  name='pointage-faciale'),
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
