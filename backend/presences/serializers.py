from rest_framework import serializers
from .models import Salle, Presence


class SalleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Salle
        fields = '__all__'


class PresenceSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.__str__', read_only=True)
    class Meta:
        model  = Presence
        fields = '__all__'
