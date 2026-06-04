"""
devoirs/serializers.py
"""
from rest_framework import serializers
from django.utils import timezone
from .models import (
    Devoir, GroupeTravail, MembreGroupe, SoumissionDevoir,
    PieceJointeDevoir, MessageGroupe, EvenementCalendrier,
    Notification, TypeBadge, BadgeEtudiant,
)


class DevoirListSerializer(serializers.ModelSerializer):
    cours_nom      = serializers.CharField(source='cours.intitule',   read_only=True)
    cours_code     = serializers.CharField(source='cours.code_cours', read_only=True)
    enseignant_nom = serializers.SerializerMethodField()
    statut_kanban  = serializers.ReadOnlyField()
    est_en_retard  = serializers.ReadOnlyField()
    nb_soumissions = serializers.SerializerMethodField()
    nb_groupes     = serializers.SerializerMethodField()

    class Meta:
        model  = Devoir
        fields = ['id','titre','type_devoir','statut','statut_kanban',
                  'date_limite','est_en_retard','note_max','coefficient',
                  'cours_nom','cours_code','enseignant_nom',
                  'nb_soumissions','nb_groupes','detection_plagiat','date_creation']

    def get_enseignant_nom(self, obj):
        return f"{obj.enseignant.nom} {obj.enseignant.prenom}"

    def get_nb_soumissions(self, obj):
        return obj.soumissions.filter(est_soumis=True).count()

    def get_nb_groupes(self, obj):
        return obj.groupes_travail.count()


class DevoirDetailSerializer(serializers.ModelSerializer):
    cours_nom     = serializers.CharField(source='cours.intitule', read_only=True)
    statut_kanban = serializers.ReadOnlyField()
    est_en_retard = serializers.ReadOnlyField()

    class Meta:
        model  = Devoir
        fields = '__all__'
        read_only_fields = ['date_creation','date_modification']


class MembreGroupeSerializer(serializers.ModelSerializer):
    etudiant_nom       = serializers.SerializerMethodField()
    etudiant_matricule = serializers.CharField(source='etudiant.matricule', read_only=True)

    class Meta:
        model  = MembreGroupe
        fields = ['id','etudiant','etudiant_nom','etudiant_matricule',
                  'contribution_pct','nb_messages_chat','nb_fichiers_partages','date_adhesion']

    def get_etudiant_nom(self, obj):
        return f"{obj.etudiant.nom} {obj.etudiant.prenom}"


class GroupeTravailSerializer(serializers.ModelSerializer):
    membres_detail = MembreGroupeSerializer(source='membresgroupe_set', many=True, read_only=True)
    devoir_titre   = serializers.CharField(source='devoir.titre', read_only=True)
    chef_nom       = serializers.SerializerMethodField()
    nb_membres     = serializers.SerializerMethodField()

    class Meta:
        model  = GroupeTravail
        fields = ['id','devoir','devoir_titre','nom','chef','chef_nom',
                  'est_complet','nb_membres','membres_detail','date_creation']

    def get_chef_nom(self, obj):
        return f"{obj.chef.nom} {obj.chef.prenom}" if obj.chef else None

    def get_nb_membres(self, obj):
        return obj.membres.count()


class GroupeTravailCreationSerializer(serializers.ModelSerializer):
    membres_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False, default=list)

    class Meta:
        model  = GroupeTravail
        fields = ['id','devoir','nom','chef','membres_ids']

    def create(self, validated_data):
        membres_ids = validated_data.pop('membres_ids', [])
        groupe = GroupeTravail.objects.create(**validated_data)
        for eid in membres_ids:
            MembreGroupe.objects.get_or_create(groupe=groupe, etudiant_id=eid)
        groupe.mettre_a_jour_completude()
        return groupe


class PieceJointeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PieceJointeDevoir
        fields = ['id','nom_fichier','fichier','type_fichier','taille_ko','date_depot']


class SoumissionListSerializer(serializers.ModelSerializer):
    etudiant_nom   = serializers.SerializerMethodField()
    groupe_nom     = serializers.SerializerMethodField()
    pieces_jointes = PieceJointeSerializer(many=True, read_only=True)

    class Meta:
        model  = SoumissionDevoir
        fields = ['id','devoir','etudiant','etudiant_nom','groupe_travail','groupe_nom',
                  'commentaire','est_soumis','est_en_retard','date_soumission',
                  'note_obtenue','commentaire_correction','date_correction',
                  'pourcentage_plagiat','alerte_plagiat','pieces_jointes']

    def get_etudiant_nom(self, obj):
        return f"{obj.etudiant.nom} {obj.etudiant.prenom}" if obj.etudiant else None

    def get_groupe_nom(self, obj):
        return obj.groupe_travail.nom if obj.groupe_travail else None


class SoumissionCorrectionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SoumissionDevoir
        fields = ['note_obtenue','commentaire_correction']

    def update(self, instance, validated_data):
        instance.note_obtenue           = validated_data.get('note_obtenue', instance.note_obtenue)
        instance.commentaire_correction = validated_data.get('commentaire_correction', '')
        instance.date_correction        = timezone.now()
        instance.save()
        if instance.etudiant:
            Notification.objects.create(
                destinataire_etudiant=instance.etudiant,
                type_notif='devoir_corrige',
                titre=f"Devoir corrigé : {instance.devoir.titre}",
                message=f"Note : {instance.note_obtenue}/{instance.devoir.note_max}. {instance.commentaire_correction}",
                devoir=instance.devoir,
            )
        return instance


class MessageGroupeSerializer(serializers.ModelSerializer):
    auteur_nom      = serializers.SerializerMethodField()
    auteur_initiales = serializers.SerializerMethodField()

    class Meta:
        model  = MessageGroupe
        fields = ['id','groupe','auteur','auteur_nom','auteur_initiales','contenu','date_envoi','modifie']
        read_only_fields = ['date_envoi','modifie']

    def get_auteur_nom(self, obj):
        return f"{obj.auteur.nom} {obj.auteur.prenom}"

    def get_auteur_initiales(self, obj):
        return f"{obj.auteur.nom[0]}{obj.auteur.prenom[0]}".upper()


class EvenementCalendrierSerializer(serializers.ModelSerializer):
    filiere_nom = serializers.CharField(source='filiere.nom', read_only=True, default='')
    groupe_nom  = serializers.CharField(source='groupe.nom',  read_only=True, default='')

    class Meta:
        model  = EvenementCalendrier
        fields = '__all__'
        read_only_fields = ['date_creation']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = ['id','type_notif','titre','message','devoir','est_lu','date_envoi']


class TypeBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TypeBadge
        fields = '__all__'


class BadgeEtudiantSerializer(serializers.ModelSerializer):
    badge_detail = TypeBadgeSerializer(source='badge', read_only=True)

    class Meta:
        model  = BadgeEtudiant
        fields = ['id','etudiant','badge','badge_detail','date_obtention','devoir_lie','commentaire']
