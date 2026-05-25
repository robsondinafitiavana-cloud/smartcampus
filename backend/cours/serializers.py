"""cours/serializers.py"""
from rest_framework import serializers
from .models import Cours, Note, Devoir, SoumissionDevoir, SupportCours


class CoursSerializer(serializers.ModelSerializer):
    enseignant_nom = serializers.CharField(source='enseignant.__str__', read_only=True)
    class Meta:
        model  = Cours
        fields = '__all__'


class NoteSaisieSerializer(serializers.ModelSerializer):
    """Pour saisir les notes (enseignant)."""
    note_finale = serializers.ReadOnlyField()  # Calculé automatiquement
    est_valide  = serializers.ReadOnlyField()
    
    class Meta:
        model  = Note
        fields = ['etudiant','cours','note_controle','note_examen','note_tp',
                  'note_finale','est_valide','est_rattrapage','semestre','annee_scolaire']


class NoteSerializer(serializers.ModelSerializer):
    cours_nom = serializers.CharField(source='cours.intitule', read_only=True)
    coefficient = serializers.DecimalField(source='cours.coefficient', max_digits=3, decimal_places=1, read_only=True)

    class Meta:
        model  = Note
        fields = '__all__'


class DevoirSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Devoir
        fields = '__all__'


class SoumissionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SoumissionDevoir
        fields = '__all__'
