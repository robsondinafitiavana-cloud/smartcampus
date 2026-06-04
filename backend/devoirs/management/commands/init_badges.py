from django.core.management.base import BaseCommand
from devoirs.models import TypeBadge

BADGES = [
    {'code':'premier_devoir',    'nom':'Premier pas',        'description':'Soumettre son premier devoir',       'categorie':'progression', 'icone':'flag',        'couleur':'blue',   'condition':'1 devoir soumis',              'points':5},
    {'code':'toujours_a_lheure', 'nom':"Toujours à l'heure", 'description':'10 rendus sans retard',             'categorie':'ponctualite', 'icone':'clock-check', 'couleur':'blue',   'condition':'10 devoirs avant la limite',    'points':20},
    {'code':'soumission_eclair', 'nom':'Soumission éclair',  'description':'Rendu 7 jours avant la limite',      'categorie':'ponctualite', 'icone':'bolt',        'couleur':'blue',   'condition':'7j avant la date limite',       'points':15},
    {'code':'zero_plagiat',      'nom':'Zéro plagiat',       'description':'Tous travaux originaux < 25%',       'categorie':'integrite',   'icone':'shield-check','couleur':'purple', 'condition':'10 soumissions < 25% similarité','points':30},
    {'code':'esprit_equipe',     'nom':"Esprit d'équipe",    'description':'Chef de groupe 3 fois',              'categorie':'collaboration','icone':'users',       'couleur':'green',  'condition':'Chef de groupe 3 fois',         'points':25},
    {'code':'collaborateur',     'nom':'Collaborateur actif','description':'50+ messages dans les groupes',      'categorie':'collaboration','icone':'messages',    'couleur':'green',  'condition':'50 messages de chat',           'points':20},
    {'code':'mention_tb',        'nom':'Mention Très Bien',  'description':'Note ≥ 18/20',                       'categorie':'excellence',  'icone':'star',        'couleur':'gold',   'condition':'Note ≥ 18/20',                  'points':40},
    {'code':'premier_promo',     'nom':'Premier de promo',   'description':'Meilleure note de la promotion',     'categorie':'excellence',  'icone':'trophy',      'couleur':'gold',   'condition':'Meilleure note de la promo',    'points':50},
    {'code':'etudiant_modele',   'nom':'Étudiant modèle',    'description':'5 badges obtenus',                   'categorie':'excellence',  'icone':'certificate', 'couleur':'gold',   'condition':'5 badges différents',           'points':60},
    {'code':'assidu',            'nom':'Assidu',             'description':'20 devoirs soumis',                  'categorie':'progression', 'icone':'books',       'couleur':'blue',   'condition':'20 devoirs soumis',             'points':30},
]

class Command(BaseCommand):
    help = 'Créer les badges par défaut'

    def handle(self, *args, **options):
        crees = 0
        for b in BADGES:
            _, created = TypeBadge.objects.get_or_create(code=b['code'], defaults=b)
            if created:
                crees += 1
                self.stdout.write(self.style.SUCCESS(f"  ✅ {b['nom']}"))
        self.stdout.write(self.style.SUCCESS(f"\n{crees} badge(s) créé(s). Total : {TypeBadge.objects.count()}"))
