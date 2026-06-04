from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DevoirViewSet, GroupeTravailViewSet, SoumissionViewSet,
    CalendrierViewSet, NotificationViewSet, BadgeViewSet,
)

router = DefaultRouter()
router.register(r'devoirs',         DevoirViewSet,        basename='devoirs')
router.register(r'groupes-travail', GroupeTravailViewSet, basename='groupes-travail')
router.register(r'soumissions',     SoumissionViewSet,    basename='soumissions')
router.register(r'calendrier',      CalendrierViewSet,    basename='calendrier')
router.register(r'notifications',   NotificationViewSet,  basename='notifications')
router.register(r'badges',          BadgeViewSet,         basename='badges')

urlpatterns = [path('', include(router.urls))]
