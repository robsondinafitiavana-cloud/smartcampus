from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('etudiants', '0001_initial'),
        ('paiements',  '0001_initial'),
        ('users',      '0001_initial'),
    ]

    operations = [
        # 1. Créer la table EcheancierPaiement
        migrations.CreateModel(
            name='EcheancierPaiement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('type_echeance', models.CharField(max_length=20, choices=[
                    ('inscription', "Droits d'inscription"),
                    ('M1',  'Mensualité Octobre'),
                    ('M2',  'Mensualité Novembre'),
                    ('M3',  'Mensualité Décembre'),
                    ('M4',  'Mensualité Janvier'),
                    ('M5',  'Mensualité Février'),
                    ('M6',  'Mensualité Mars'),
                    ('M7',  'Mensualité Avril'),
                    ('M8',  'Mensualité Mai'),
                    ('M9',  'Mensualité Juin'),
                    ('M10', 'Mensualité Juillet'),
                ])),
                ('montant',        models.DecimalField(max_digits=12, decimal_places=2)),
                ('statut',         models.CharField(max_length=20, default='en_attente', choices=[
                    ('paye', 'Payé'),
                    ('en_attente', 'En attente'),
                    ('en_retard',  'En retard'),
                ])),
                ('annee_scolaire', models.CharField(max_length=9, default='2025-2026')),
                ('date_echeance',  models.DateField(null=True, blank=True)),
                ('date_paiement',  models.DateField(null=True, blank=True)),
                ('reference',      models.CharField(max_length=50, blank=True)),
                ('date_creation',  models.DateTimeField(auto_now_add=True)),
                ('etudiant', models.ForeignKey(
                    'etudiants.Etudiant',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='echeancier',
                )),
                ('confirme_par', models.ForeignKey(
                    'users.Utilisateur',
                    on_delete=django.db.models.deletion.SET_NULL,
                    null=True, blank=True,
                    related_name='paiements_confirmes',
                )),
            ],
            options={
                'db_table': 'echeancier_paiements',
                'ordering': ['etudiant', 'annee_scolaire', 'type_echeance'],
            },
        ),

        # 2. Contrainte unique
        migrations.AlterUniqueTogether(
            name='echeancierPaiement',
            unique_together={('etudiant', 'type_echeance', 'annee_scolaire')},
        ),

        # 3. Ajouter le champ notes au modèle Paiement existant
        migrations.AddField(
            model_name='paiement',
            name='notes',
            field=models.TextField(blank=True),
        ),

        # 4. Ajouter le lien vers l'échéance dans Paiement
        migrations.AddField(
            model_name='paiement',
            name='echeance',
            field=models.ForeignKey(
                'paiements.EcheancierPaiement',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='paiements',
                null=True, blank=True,
            ),
        ),
    ]
