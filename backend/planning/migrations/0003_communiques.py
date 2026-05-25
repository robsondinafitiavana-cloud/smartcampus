from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('planning', '0002_initial'),
        ('users',    '0001_initial'),
        ('etudiants','0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Communique',
            fields=[
                ('id',          models.BigAutoField(auto_created=True, primary_key=True)),
                ('titre',       models.CharField(max_length=200)),
                ('contenu',     models.TextField()),
                ('categorie',   models.CharField(max_length=20, default='general', choices=[
                    ('general','Général'),('academique','Académique'),
                    ('financier','Financier'),('evenement','Événement'),('urgent','Urgent'),
                ])),
                ('fichier',     models.FileField(upload_to='communiques/', null=True, blank=True)),
                ('est_publie',  models.BooleanField(default=True)),
                ('est_epingle', models.BooleanField(default=False)),
                ('date_creation',    models.DateTimeField(auto_now_add=True)),
                ('date_modification',models.DateTimeField(auto_now=True)),
                ('auteur',  models.ForeignKey('users.Utilisateur', on_delete=django.db.models.deletion.CASCADE, related_name='communiques')),
                ('filiere', models.ForeignKey('etudiants.Filiere', on_delete=django.db.models.deletion.SET_NULL, null=True, blank=True)),
            ],
            options={'db_table':'communiques','ordering':['-est_epingle','-date_creation']},
        ),
        migrations.CreateModel(
            name='LikeCommunique',
            fields=[
                ('id',        models.BigAutoField(auto_created=True, primary_key=True)),
                ('date_like', models.DateTimeField(auto_now_add=True)),
                ('communique',  models.ForeignKey('planning.Communique', on_delete=django.db.models.deletion.CASCADE, related_name='likes')),
                ('utilisateur', models.ForeignKey('users.Utilisateur', on_delete=django.db.models.deletion.CASCADE)),
            ],
            options={'db_table':'likes_communiques'},
        ),
        migrations.CreateModel(
            name='CommentaireCommunique',
            fields=[
                ('id',          models.BigAutoField(auto_created=True, primary_key=True)),
                ('contenu',     models.TextField()),
                ('date_creation',models.DateTimeField(auto_now_add=True)),
                ('est_modifie', models.BooleanField(default=False)),
                ('communique',  models.ForeignKey('planning.Communique', on_delete=django.db.models.deletion.CASCADE, related_name='commentaires')),
                ('auteur',      models.ForeignKey('users.Utilisateur', on_delete=django.db.models.deletion.CASCADE, related_name='commentaires')),
                ('parent',      models.ForeignKey('planning.CommentaireCommunique', on_delete=django.db.models.deletion.CASCADE, null=True, blank=True, related_name='reponses')),
            ],
            options={'db_table':'commentaires_communiques','ordering':['date_creation']},
        ),
        migrations.AlterUniqueTogether(name='likecommunique', unique_together={('communique','utilisateur')}),
    ]
