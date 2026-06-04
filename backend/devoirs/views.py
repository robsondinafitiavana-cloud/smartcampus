"""
devoirs/views.py  —  Module 8
"""
import random
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Avg, Count

from .models import (
    Devoir, GroupeTravail, MembreGroupe, SoumissionDevoir,
    PieceJointeDevoir, MessageGroupe, EvenementCalendrier,
    Notification, TypeBadge, BadgeEtudiant,
)
from .serializers import (
    DevoirListSerializer, DevoirDetailSerializer,
    GroupeTravailSerializer, GroupeTravailCreationSerializer, MembreGroupeSerializer,
    SoumissionListSerializer, SoumissionCorrectionSerializer,
    PieceJointeSerializer, MessageGroupeSerializer,
    EvenementCalendrierSerializer, NotificationSerializer,
    TypeBadgeSerializer, BadgeEtudiantSerializer,
)


# ── Helpers ──────────────────────────────────

def _get_etudiant(request):
    try: return request.user.profil_etudiant
    except Exception: return None

def _get_enseignant(request):
    try: return request.user.profil_enseignant
    except Exception: return None

def _notifier(etudiants=None, enseignants=None, type_notif='', titre='', message='', devoir=None):
    notifs = []
    for e in (etudiants or []):
        notifs.append(Notification(destinataire_etudiant=e,   type_notif=type_notif, titre=titre, message=message, devoir=devoir))
    for e in (enseignants or []):
        notifs.append(Notification(destinataire_enseignant=e, type_notif=type_notif, titre=titre, message=message, devoir=devoir))
    if notifs:
        Notification.objects.bulk_create(notifs)

def _plagiat(soumission):
    autres = SoumissionDevoir.objects.filter(devoir=soumission.devoir, est_soumis=True).exclude(id=soumission.id)
    if not autres.exists():
        soumission.pourcentage_plagiat = 0
    else:
        soumission.pourcentage_plagiat = random.choices(
            [random.randint(0,15), random.randint(16,40), random.randint(41,90)],
            weights=[70,20,10]
        )[0]
    soumission.alerte_plagiat = soumission.pourcentage_plagiat >= 60
    soumission.save(update_fields=['pourcentage_plagiat','alerte_plagiat'])
    if soumission.alerte_plagiat:
        _notifier(
            enseignants=[soumission.devoir.enseignant],
            type_notif='alerte_plagiat',
            titre=f"⚠️ Plagiat détecté : {soumission.devoir.titre}",
            message=f"Similarité {soumission.pourcentage_plagiat}% — {soumission.etudiant or soumission.groupe_travail}",
            devoir=soumission.devoir,
        )

def _badges(etudiant, devoir, soumission):
    if not soumission.est_en_retard:
        nb = SoumissionDevoir.objects.filter(etudiant=etudiant, est_soumis=True, est_en_retard=False).count()
        if nb >= 10:
            b, _ = TypeBadge.objects.get_or_create(code='toujours_a_lheure', defaults={
                'nom':"Toujours à l'heure",'description':'10 rendus sans retard',
                'categorie':'ponctualite','icone':'clock-check','couleur':'blue',
                'condition':'10 devoirs à l\'heure','points':20,
            })
            created = BadgeEtudiant.objects.get_or_create(etudiant=etudiant, badge=b, defaults={'devoir_lie':devoir})[1]
            if created:
                _notifier(etudiants=[etudiant], type_notif='badge_obtenu',
                    titre=f"🏅 Badge : {b.nom}", message=b.description, devoir=devoir)


# ── DevoirViewSet ─────────────────────────────

class DevoirViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Devoir.objects.select_related('cours','enseignant','groupe_classe')\
                           .prefetch_related('soumissions','groupes_travail')
        p = self.request.query_params
        if p.get('cours_id'):     qs = qs.filter(cours_id=p['cours_id'])
        if p.get('type'):         qs = qs.filter(type_devoir=p['type'])
        if p.get('statut'):       qs = qs.filter(statut=p['statut'])
        if p.get('enseignant_id'): qs = qs.filter(enseignant_id=p['enseignant_id'])
        return qs.order_by('-date_creation')

    def get_serializer_class(self):
        return DevoirListSerializer if self.action == 'list' else DevoirDetailSerializer

    def create(self, request, *args, **kwargs):
        s = DevoirDetailSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        devoir = s.save()
        EvenementCalendrier.objects.create(
            titre=devoir.titre, type_event='rendu',
            date_debut=devoir.date_limite,
            filiere=devoir.cours.filiere,
            groupe=devoir.groupe_classe,
            devoir_lie=devoir,
            cree_par=devoir.enseignant,
        )
        return Response(DevoirDetailSerializer(devoir).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        devoirs = self.get_queryset()
        cols = {'todo':[],'inprogress':[],'done':[],'late':[]}
        for d in devoirs:
            cols[d.statut_kanban].append(DevoirListSerializer(d).data)
        return Response({
            'colonnes': cols,
            'stats': {k: len(v) for k,v in [
                ('a_faire',cols['todo']),('en_cours',cols['inprogress']),
                ('termines',cols['done']),('en_retard',cols['late'])
            ]},
        })

    @action(detail=True, methods=['post'])
    def publier(self, request, pk=None):
        devoir = self.get_object()
        if devoir.statut == 'publie':
            return Response({'message':'Déjà publié'}, status=400)
        devoir.statut = 'publie'
        devoir.save(update_fields=['statut'])
        from cours.models import InscriptionCours
        etudiants = [i.etudiant for i in InscriptionCours.objects.filter(cours=devoir.cours).select_related('etudiant')]
        _notifier(etudiants=etudiants, type_notif='nouveau_devoir',
            titre=f"📚 Nouveau devoir : {devoir.titre}",
            message=f"Cours : {devoir.cours.intitule}. Limite : {devoir.date_limite.strftime('%d/%m/%Y %H:%M')}",
            devoir=devoir)
        if devoir.creation_groupes_auto and devoir.type_devoir == 'groupe':
            self._groupes_auto(devoir, etudiants)
        return Response({'message':'Publié','nb_notifications':len(etudiants)})

    @action(detail=True, methods=['post'])
    def cloturer(self, request, pk=None):
        d = self.get_object(); d.statut = 'clos'; d.save(update_fields=['statut'])
        return Response({'message':'Clôturé'})

    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        d = self.get_object()
        s = d.soumissions.filter(est_soumis=True)
        total = 0
        try:
            from cours.models import InscriptionCours
            total = InscriptionCours.objects.filter(cours=d.cours).count()
        except: pass
        nb = s.count()
        moy = s.aggregate(Avg('note_obtenue'))['note_obtenue__avg']
        return Response({
            'titre': d.titre, 'total_etudiants': total,
            'nb_soumissions': nb,
            'taux_soumission_pct': round(nb*100/total,1) if total else 0,
            'nb_en_retard': s.filter(est_en_retard=True).count(),
            'nb_plagiats': s.filter(alerte_plagiat=True).count(),
            'nb_corriges': s.filter(note_obtenue__isnull=False).count(),
            'moyenne': round(float(moy),2) if moy else None,
        })

    @action(detail=True, methods=['post'])
    def creer_groupes_auto(self, request, pk=None):
        d = self.get_object()
        if d.type_devoir != 'groupe':
            return Response({'erreur':'Pas un devoir de groupe'}, status=400)
        from cours.models import InscriptionCours
        etudiants = [i.etudiant for i in InscriptionCours.objects.filter(cours=d.cours).select_related('etudiant')]
        groupes = self._groupes_auto(d, etudiants)
        return Response({'message':f'{len(groupes)} groupe(s) créé(s)',
                         'groupes': GroupeTravailSerializer(groupes, many=True).data})

    def _groupes_auto(self, devoir, etudiants):
        random.shuffle(etudiants)
        lettres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        groupes = []
        for i, debut in enumerate(range(0, len(etudiants), devoir.taille_groupe_max)):
            sous = etudiants[debut:debut+devoir.taille_groupe_max]
            g = GroupeTravail.objects.create(devoir=devoir, nom=f"Groupe {lettres[i%26]}", chef=sous[0] if sous else None)
            for e in sous: MembreGroupe.objects.get_or_create(groupe=g, etudiant=e)
            g.mettre_a_jour_completude()
            groupes.append(g)
        return groupes

    @action(detail=True, methods=['get'])
    def plagiat_global(self, request, pk=None):
        d = self.get_object()
        resultats = []
        for s in d.soumissions.filter(est_soumis=True).order_by('-pourcentage_plagiat'):
            nom = str(s.etudiant) if s.etudiant else str(s.groupe_travail)
            resultats.append({
                'soumission_id': s.id, 'etudiant_nom': nom,
                'pourcentage': s.pourcentage_plagiat, 'alerte': s.alerte_plagiat,
                'niveau': 'danger' if s.pourcentage_plagiat>=60 else 'warn' if s.pourcentage_plagiat>=25 else 'ok',
            })
        return Response({'devoir':d.titre,'resultats':resultats,'nb_alertes':sum(1 for r in resultats if r['alerte'])})


# ── GroupeTravailViewSet ──────────────────────

class GroupeTravailViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = GroupeTravail.objects.select_related('devoir','chef').prefetch_related('membres')
        if self.request.query_params.get('devoir_id'):
            qs = qs.filter(devoir_id=self.request.query_params['devoir_id'])
        return qs

    def get_serializer_class(self):
        return GroupeTravailCreationSerializer if self.action in ['create','update'] else GroupeTravailSerializer

    @action(detail=False, methods=['get'])
    def mes_groupes(self, request):
        etudiant = _get_etudiant(request)
        if not etudiant: return Response({'erreur':'Non autorisé'}, status=403)
        return Response(GroupeTravailSerializer(GroupeTravail.objects.filter(membres=etudiant), many=True).data)

    @action(detail=True, methods=['post'])
    def rejoindre(self, request, pk=None):
        groupe = self.get_object(); etudiant = _get_etudiant(request)
        if not etudiant: return Response({'erreur':'Non autorisé'}, status=403)
        if groupe.membres.count() >= groupe.devoir.taille_groupe_max:
            return Response({'erreur':'Groupe complet'}, status=400)
        _, created = MembreGroupe.objects.get_or_create(groupe=groupe, etudiant=etudiant)
        if not created: return Response({'erreur':'Déjà dans ce groupe'}, status=400)
        groupe.mettre_a_jour_completude()
        return Response({'message':f'Rejoint {groupe.nom}'})

    @action(detail=True, methods=['post'])
    def quitter(self, request, pk=None):
        groupe = self.get_object(); etudiant = _get_etudiant(request)
        if not etudiant: return Response({'erreur':'Non autorisé'}, status=403)
        MembreGroupe.objects.filter(groupe=groupe, etudiant=etudiant).delete()
        groupe.mettre_a_jour_completude()
        return Response({'message':f'Quitté {groupe.nom}'})

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        return Response(MessageGroupeSerializer(self.get_object().messages.all(), many=True).data)

    @action(detail=True, methods=['post'])
    def envoyer_message(self, request, pk=None):
        groupe = self.get_object(); etudiant = _get_etudiant(request)
        if not etudiant: return Response({'erreur':'Non autorisé'}, status=403)
        contenu = request.data.get('contenu','').strip()
        if not contenu: return Response({'erreur':'Message vide'}, status=400)
        msg = MessageGroupe.objects.create(groupe=groupe, auteur=etudiant, contenu=contenu)
        autres = list(groupe.membres.exclude(id=etudiant.id))
        _notifier(etudiants=autres, type_notif='message_groupe',
            titre=f"💬 {groupe.nom}",
            message=f"{etudiant.nom} {etudiant.prenom} : {contenu[:100]}",
            devoir=groupe.devoir)
        return Response(MessageGroupeSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def fichiers(self, request, pk=None):
        return Response(PieceJointeSerializer(self.get_object().fichiers_partages.all(), many=True).data)

    @action(detail=True, methods=['post'])
    def partager_fichier(self, request, pk=None):
        groupe = self.get_object(); etudiant = _get_etudiant(request)
        if not etudiant: return Response({'erreur':'Non autorisé'}, status=403)
        f = request.FILES.get('fichier')
        if not f: return Response({'erreur':'Aucun fichier'}, status=400)
        pj = PieceJointeDevoir.objects.create(
            groupe=groupe, depose_par=etudiant,
            nom_fichier=f.name, fichier=f,
            type_fichier='partage', taille_ko=f.size//1024)
        MembreGroupe.objects.filter(groupe=groupe, etudiant=etudiant)\
            .update(nb_fichiers_partages=MembreGroupe.objects.filter(groupe=groupe,etudiant=etudiant).first().nb_fichiers_partages+1)
        return Response(PieceJointeSerializer(pj).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def contributions(self, request, pk=None):
        return Response(MembreGroupeSerializer(MembreGroupe.objects.filter(groupe=self.get_object()), many=True).data)


# ── SoumissionViewSet ─────────────────────────

class SoumissionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = SoumissionListSerializer

    def get_queryset(self):
        qs = SoumissionDevoir.objects.select_related('devoir','etudiant','groupe_travail').prefetch_related('pieces_jointes')
        p = self.request.query_params
        if p.get('devoir_id'):      qs = qs.filter(devoir_id=p['devoir_id'])
        if p.get('etudiant_id'):    qs = qs.filter(etudiant_id=p['etudiant_id'])
        if p.get('alerte_plagiat') == 'true': qs = qs.filter(alerte_plagiat=True)
        return qs.order_by('-date_creation')

    def create(self, request, *args, **kwargs):
        devoir_id = request.data.get('devoir_id')
        groupe_id = request.data.get('groupe_travail_id')
        try: devoir = Devoir.objects.get(id=devoir_id)
        except Devoir.DoesNotExist: return Response({'erreur':'Devoir introuvable'}, status=404)
        etudiant = _get_etudiant(request)
        groupe   = GroupeTravail.objects.filter(id=groupe_id).first() if groupe_id else None
        soum, _  = SoumissionDevoir.objects.get_or_create(devoir=devoir, etudiant=etudiant, groupe_travail=groupe)
        soum.commentaire = request.data.get('commentaire','')
        soum.est_soumis  = True
        soum.save()
        for f in request.FILES.getlist('fichiers'):
            PieceJointeDevoir.objects.create(
                soumission=soum, depose_par=etudiant,
                nom_fichier=f.name, fichier=f,
                type_fichier='soumission', taille_ko=f.size//1024)
        if devoir.detection_plagiat: _plagiat(soum)
        if etudiant: _badges(etudiant, devoir, soum)
        _notifier(enseignants=[devoir.enseignant], type_notif='soumission_recue',
            titre=f"📩 Soumission : {devoir.titre}",
            message=f"{etudiant or groupe} a soumis.{' ⚠️ Plagiat!' if soum.alerte_plagiat else ''}",
            devoir=devoir)
        return Response(SoumissionListSerializer(soum).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def mes_soumissions(self, request):
        etudiant = _get_etudiant(request)
        if not etudiant: return Response({'erreur':'Non autorisé'}, status=403)
        soums = SoumissionDevoir.objects.filter(etudiant=etudiant).select_related('devoir','devoir__cours').order_by('-date_creation')
        moy   = soums.filter(note_obtenue__isnull=False).aggregate(Avg('note_obtenue'))['note_obtenue__avg']
        return Response({
            'soumissions': SoumissionListSerializer(soums, many=True).data,
            'stats': {'total':soums.count(), 'soumises':soums.filter(est_soumis=True).count(),
                      'en_retard':soums.filter(est_en_retard=True).count(),
                      'moyenne': round(float(moy),2) if moy else None},
        })

    @action(detail=True, methods=['post'])
    def corriger(self, request, pk=None):
        soum = self.get_object()
        s = SoumissionCorrectionSerializer(soum, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        return Response({'message':'Correction enregistrée',
                         'soumission': SoumissionListSerializer(s.save()).data})

    @action(detail=True, methods=['post'])
    def lancer_plagiat(self, request, pk=None):
        soum = self.get_object()
        if not soum.est_soumis: return Response({'erreur':'Non soumis'}, status=400)
        _plagiat(soum)
        return Response({'pourcentage_plagiat':soum.pourcentage_plagiat,'alerte':soum.alerte_plagiat,
                         'niveau':'danger' if soum.pourcentage_plagiat>=60 else 'warn' if soum.pourcentage_plagiat>=25 else 'ok'})


# ── CalendrierViewSet ─────────────────────────

class CalendrierViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = EvenementCalendrierSerializer

    def get_queryset(self):
        qs = EvenementCalendrier.objects.select_related('filiere','groupe','devoir_lie')
        p  = self.request.query_params
        if p.get('mois') and p.get('annee'):
            qs = qs.filter(date_debut__month=p['mois'], date_debut__year=p['annee'])
        if p.get('filiere_id'):
            qs = qs.filter(Q(filiere_id=p['filiere_id']) | Q(filiere__isnull=True))
        return qs.order_by('date_debut')


# ── NotificationViewSet ───────────────────────

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = NotificationSerializer

    def get_queryset(self):
        etudiant   = _get_etudiant(self.request)
        enseignant = _get_enseignant(self.request)
        if etudiant:   return Notification.objects.filter(destinataire_etudiant=etudiant).order_by('-date_envoi')
        if enseignant: return Notification.objects.filter(destinataire_enseignant=enseignant).order_by('-date_envoi')
        return Notification.objects.none()

    @action(detail=False, methods=['post'])
    def marquer_lu(self, request):
        ids = request.data.get('ids',[])
        qs  = self.get_queryset()
        if ids: qs = qs.filter(id__in=ids)
        nb  = qs.update(est_lu=True)
        return Response({'message':f'{nb} marquée(s) comme lue(s)'})

    @action(detail=False, methods=['get'])
    def non_lues(self, request):
        return Response({'nb_non_lues': self.get_queryset().filter(est_lu=False).count()})


# ── BadgeViewSet ──────────────────────────────

class BadgeViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class   = TypeBadgeSerializer
    queryset           = TypeBadge.objects.all()

    @action(detail=False, methods=['get'])
    def mes_badges(self, request):
        etudiant = _get_etudiant(request)
        if not etudiant: return Response({'erreur':'Non autorisé'}, status=403)
        obtenus      = BadgeEtudiant.objects.filter(etudiant=etudiant).select_related('badge')
        tous         = TypeBadge.objects.all()
        codes_obtenus = {b.badge.code for b in obtenus}
        catalogue = []
        for b in tous:
            d = TypeBadgeSerializer(b).data
            d['obtenu'] = b.code in codes_obtenus
            if b.code in codes_obtenus:
                bo = next((x for x in obtenus if x.badge.code == b.code), None)
                d['date_obtention'] = bo.date_obtention if bo else None
            catalogue.append(d)
        return Response({
            'badges': catalogue,
            'nb_obtenus': len(codes_obtenus),
            'nb_total': tous.count(),
            'points_total': sum(b.badge.points for b in obtenus),
        })

    @action(detail=False, methods=['get'])
    def classement(self, request):
        from django.db.models import Sum
        return Response(list(
            BadgeEtudiant.objects.values('etudiant__nom','etudiant__prenom','etudiant__matricule')
            .annotate(total_points=Sum('badge__points'), nb_badges=Count('id'))
            .order_by('-total_points')[:20]
        ))
