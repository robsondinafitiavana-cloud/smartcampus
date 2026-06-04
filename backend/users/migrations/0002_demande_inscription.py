from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DemandeInscription',
            fields=[
                ('id',              models.BigAutoField(auto_created=True, primary_key=True)),
                ('nom',             models.CharField(max_length=100)),
                ('prenom',          models.CharField(max_length=100)),
                ('email',           models.EmailField()),
                ('contact',         models.CharField(max_length=20, blank=True)),
                ('filiere',         models.CharField(max_length=10, choices=[('INF','Informatique'),('GST','Gestion'),('DRT','Droit')])),
                ('score_test',      models.IntegerField()),
                ('nb_bonnes',       models.IntegerField(default=0)),
                ('nb_questions',    models.IntegerField(default=15)),
                ('statut',          models.CharField(max_length=20, default='en_attente', choices=[('en_attente','En attente'),('approuvee','Approuvée'),('refusee','Refusée')])),
                ('date_demande',    models.DateTimeField(auto_now_add=True)),
                ('date_traitement', models.DateTimeField(null=True, blank=True)),
                ('motif_refus',     models.TextField(blank=True)),
                ('traite_par',      models.ForeignKey('users.Utilisateur', on_delete=django.db.models.deletion.SET_NULL, null=True, blank=True, related_name='demandes_traitees')),
                ('compte_cree',     models.ForeignKey('users.Utilisateur', on_delete=django.db.models.deletion.SET_NULL, null=True, blank=True, related_name='demande_origine')),
            ],
            options={'db_table': 'demandes_inscription', 'ordering': ['-date_demande']},
        ),
    ]