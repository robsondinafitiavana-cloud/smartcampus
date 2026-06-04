from django.db import migrations, models
import django.utils.timezone

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='PredictionRisque',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True)),
                ('etudiant_id', models.IntegerField(db_index=True)),
                ('risque', models.CharField(max_length=10, choices=[('faible','Faible'),('moyen','Moyen'),('eleve','Élevé')])),
                ('probabilite', models.FloatField()),
                ('facteurs', models.JSONField(default=list)),
                ('recommandations', models.JSONField(default=list)),
                ('mode_calcul', models.CharField(max_length=20, default='heuristique')),
                ('alerte_envoyee', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={'db_table': 'ia_predictions_risque', 'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='ResultatAdmission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True)),
                ('candidat_id', models.CharField(max_length=100, db_index=True)),
                ('filiere', models.CharField(max_length=10)),
                ('score', models.FloatField()),
                ('nb_bonnes', models.IntegerField(default=0)),
                ('nb_questions', models.IntegerField(default=15)),
                ('admis', models.BooleanField()),
                ('niveau', models.CharField(max_length=20, blank=True)),
                ('detail', models.JSONField(default=list, blank=True)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={'db_table': 'ia_resultats_admission', 'ordering': ['-created_at']},
        ),
    ]
