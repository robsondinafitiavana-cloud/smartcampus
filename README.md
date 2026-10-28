# SmartCampus — Une plateforme intelligente pour l'université

## Présentation du projet

SmartCampus est un projet numérique qui vise à améliorer la gestion de la vie universitaire et à accompagner les étudiants tout au long de leur parcours académique.

Le projet associe une plateforme web de gestion universitaire à une approche basée sur le Machine Learning pour analyser les données académiques et mieux comprendre les facteurs liés à la réussite, à la poursuite des études et au décrochage étudiant.

L'objectif est de proposer un environnement numérique qui facilite les échanges entre les étudiants, les enseignants et l'administration, tout en exploitant les données disponibles pour aider à identifier les étudiants susceptibles de rencontrer des difficultés.

## Problématique

Le suivi des étudiants et la gestion des informations universitaires peuvent devenir complexes lorsque les données sont dispersées entre plusieurs services ou traitées manuellement.

Par ailleurs, les difficultés académiques ne sont pas toujours identifiées suffisamment tôt pour permettre un accompagnement adapté.

SmartCampus propose une approche qui combine centralisation des informations, gestion numérique des activités universitaires et analyse prédictive afin de contribuer à un meilleur suivi des étudiants.

## Objectifs du projet

Les principaux objectifs de SmartCampus sont :

- Centraliser les informations universitaires dans une plateforme accessible aux utilisateurs autorisés.
- Faciliter la gestion des inscriptions, des emplois du temps, des notes et des résultats académiques.
- Améliorer le suivi de l'assiduité et du parcours des étudiants.
- Faciliter la communication entre les étudiants, les enseignants et l'administration.
- Explorer l'utilisation du Machine Learning pour analyser les parcours académiques et identifier des risques potentiels de décrochage.

## Fonctionnalités principales

### Gestion des utilisateurs et des rôles

La plateforme prévoit plusieurs profils, notamment :

- **Administrateur** : gestion générale de la plateforme et des données universitaires.
- **Enseignant** : gestion des activités pédagogiques et suivi des résultats.
- **Étudiant** : consultation des informations et suivi de son parcours académique.

Les accès et les fonctionnalités sont organisés selon le rôle de chaque utilisateur.

### Gestion du parcours universitaire

SmartCampus vise à simplifier les principales activités administratives et pédagogiques :

- Préinscription et gestion des informations des étudiants.
- Consultation des emplois du temps.
- Gestion et consultation des notes.
- Accès aux résultats et aux relevés de notes.
- Suivi des présences et de l'assiduité.

Ces fonctionnalités contribuent à réduire la dispersion des informations et à faciliter le suivi du parcours universitaire.

### Analyse prédictive de la réussite étudiante

Le projet comprend un volet Machine Learning consacré à la prédiction du devenir académique des étudiants.

Le modèle travaille sur trois catégories :

- **Dropout** : étudiant associé à un risque ou à une situation de décrochage selon les données utilisées.
- **Enrolled** : étudiant toujours inscrit ou dont le parcours est en cours.
- **Graduate** : étudiant ayant terminé son parcours avec succès selon la classification du jeu de données.

Plusieurs algorithmes ont été étudiés et comparés :

- Régression logistique.
- Random Forest.
- Perceptron multicouche (MLP).

La régression logistique a été retenue dans le cadre des expérimentations réalisées.

L'objectif est d'explorer comment les données académiques peuvent aider les établissements à mieux comprendre les parcours étudiants et à envisager des actions d'accompagnement adaptées.

Les prédictions restent indicatives : elles ne constituent ni une certitude sur le devenir d'un étudiant ni une décision académique automatisée.

### Visualisation des résultats

Une interface basée sur Streamlit a été utilisée pour présenter les résultats du modèle de Machine Learning et faciliter l'exploration des prédictions.

Cette interface permet de mettre en valeur le volet analytique du projet et de rendre les résultats plus accessibles.

### Évolution vers une plateforme universitaire complète

Une version plus complète de SmartCampus est également envisagée, avec une architecture séparant le backend et le frontend :

- API REST pour les échanges de données.
- Interface web interactive.
- Base de données relationnelle.
- Gestion des rôles et des accès.
- Modules de suivi académique et administratif.

Cette architecture permet de faire évoluer progressivement le projet vers une solution plus complète et modulaire.

## Technologies utilisées

Les technologies mobilisées dans le projet comprennent :

- **Python** : développement backend et traitement des données.
- **Django** : développement de la plateforme web.
- **Django REST Framework** : conception d'API pour l'architecture séparée.
- **React** : développement du frontend de la version évolutive.
- **PostgreSQL** : stockage des données relationnelles.
- **Scikit-learn** : entraînement et comparaison des modèles de Machine Learning.
- **Pandas** : préparation et manipulation des données.
- **NumPy** : calculs et opérations numériques.
- **Streamlit** : interface de démonstration du modèle prédictif.
- **Git et GitHub** : gestion des versions du code source.

Les technologies effectivement présentes peuvent varier selon la version du projet.

## Architecture du projet

SmartCampus est organisé autour de deux axes complémentaires.

### 1. Plateforme de gestion universitaire

Cette partie prend en charge les utilisateurs, les données académiques, les activités pédagogiques et les échanges entre le frontend et le backend.

### 2. Module d'analyse prédictive

Cette partie regroupe la préparation des données, l'entraînement et l'évaluation des modèles, ainsi que la présentation des prédictions.

La séparation de ces deux axes facilite la maintenance du code et permet de faire évoluer les fonctionnalités indépendamment.

## Installation en local

### Prérequis

Avant de commencer, assurez-vous de disposer de :

- Python.
- Git.
- Node.js et npm pour la version utilisant React.
- PostgreSQL pour la configuration avec cette base de données.

### 1. Cloner le dépôt

```bash
git clone URL_DU_DEPOT
cd NOM_DU_DOSSIER
```

Remplacez `URL_DU_DEPOT` et `NOM_DU_DOSSIER` par les informations de votre dépôt.

### 2. Créer un environnement Python

Sous Windows :

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Sous Linux ou macOS :

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Installer les dépendances Python

Si le projet contient un fichier `requirements.txt` :

```bash
pip install -r requirements.txt
```

### 4. Configurer la base de données

Configurez les paramètres de connexion à PostgreSQL selon les instructions du projet.

Les mots de passe et autres informations sensibles doivent être stockés dans des variables d'environnement et ne doivent pas être publiés sur GitHub.

### 5. Appliquer les migrations Django

```bash
python manage.py migrate
```

### 6. Créer un compte administrateur

```bash
python manage.py createsuperuser
```

### 7. Lancer le backend

```bash
python manage.py runserver
```

### 8. Lancer le frontend React, si disponible dans cette version

Ouvrez un second terminal, accédez au dossier du frontend, puis exécutez :

```bash
npm install
npm run dev
```

Les commandes exactes dépendent de la structure du projet et de la configuration définie dans `package.json`.

### 9. Lancer la démonstration Machine Learning, si disponible

Si le projet contient l'application Streamlit et son fichier d'entrée, activez l'environnement Python puis lancez :

```bash
streamlit run app.py
```

Remplacez `app.py` par le nom réel du fichier d'entrée si nécessaire.

## État du développement

SmartCampus comprend un travail de classification du devenir académique des étudiants, avec comparaison de plusieurs algorithmes et sélection d'un modèle de régression logistique pour les expérimentations.

Le projet prévoit également une plateforme de gestion universitaire plus complète, dont les modules et le niveau d'avancement dépendent de la version du code publiée.

Les résultats du modèle doivent être évalués sur des données adaptées avant toute utilisation dans un contexte universitaire réel.

## Perspectives

Les évolutions envisagées comprennent :

- L'amélioration des fonctionnalités de gestion universitaire.
- Le renforcement du suivi des notes, des présences et des résultats.
- L'amélioration de l'évaluation des modèles prédictifs.
- L'intégration progressive de l'analyse prédictive dans la plateforme.
- La mise en place de mécanismes de protection des données étudiantes.
- Le déploiement d'une version accessible aux utilisateurs autorisés.

## Impact recherché

SmartCampus vise à contribuer à une meilleure organisation de la vie universitaire et à un suivi plus attentif des étudiants.

En associant développement web et Machine Learning, le projet explore la manière dont les outils numériques peuvent soutenir la gestion académique et aider les établissements à mieux comprendre les parcours étudiants.

## Auteur

Projet de développement web et de Machine Learning consacré à la gestion universitaire et à l'analyse des parcours académiques.

## Licence

La licence du projet reste à définir. Toute réutilisation du code devra respecter la licence choisie pour le dépôt.
