"""paiements/serializers.py"""
from rest_framework import serializers
from .models import EcheancierPaiement, Paiement
import uuid


class EcheancierSerializer(serializers.ModelSerializer):
    """Sérialise une échéance du calendrier de paiement."""
    label          = serializers.ReadOnlyField(source='get_label')
    est_en_retard  = serializers.ReadOnlyField()
    etudiant_nom   = serializers.CharField(source='etudiant.__str__', read_only=True)

    class Meta:
        model  = EcheancierPaiement
        fields = '__all__'
        read_only_fields = ['date_creation']


class PaiementSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.__str__', read_only=True)

    class Meta:
        model  = Paiement
        fields = '__all__'
        read_only_fields = ['reference', 'date_creation']

    def create(self, validated_data):
        validated_data['reference'] = f"SC-{uuid.uuid4().hex[:8].upper()}"
        return super().create(validated_data)
