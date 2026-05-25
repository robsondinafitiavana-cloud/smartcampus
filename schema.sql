-- ============================================================
-- SMARTCAMPUS - Base de données PostgreSQL
-- Système de gestion universitaire intelligent
-- ============================================================
-- Ordre de création : suivre cet ordre pour respecter
-- les relations entre les tables (clés étrangères)
-- ============================================================


-- ============================================================
-- ÉTAPE 0 : Nettoyage (utile si on recrée la base)
-- ============================================================
DROP TABLE IF EXISTS devoirs_soumissions CASCADE;
DROP TABLE IF EXISTS devoirs CASCADE;
DROP TABLE IF EXISTS annonces CASCADE;
DROP TABLE IF EXISTS paiements CASCADE;
DROP TABLE IF EXISTS presences CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS emplois_du_temps CASCADE;
DROP TABLE IF EXISTS inscriptions_cours CASCADE;
DROP TABLE IF EXISTS cours CASCADE;
DROP TABLE IF EXISTS groupes CASCADE;
DROP TABLE IF EXISTS salles CASCADE;
DROP TABLE IF EXISTS etudiants CASCADE;
DROP TABLE IF EXISTS enseignants CASCADE;
DROP TABLE IF EXISTS filieres CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;


-- ============================================================
-- TABLE 1 : utilisateurs
-- C'est la table de base pour tous les comptes du système
-- (admin, enseignant, étudiant)
-- ============================================================
CREATE TABLE utilisateurs (
    id               SERIAL PRIMARY KEY,           -- ID auto-incrémenté
    email            VARCHAR(255) UNIQUE NOT NULL, -- Email unique (identifiant de connexion)
    mot_de_passe     VARCHAR(255) NOT NULL,         -- Mot de passe hashé (bcrypt)
    role             VARCHAR(20) NOT NULL           -- Rôle : 'admin', 'enseignant', 'etudiant'
                     CHECK (role IN ('admin', 'enseignant', 'etudiant')),
    est_actif        BOOLEAN DEFAULT TRUE,          -- Compte actif ou bloqué
    date_creation    TIMESTAMP DEFAULT NOW(),       -- Date de création du compte
    derniere_connexion TIMESTAMP                    -- Dernière fois qu'il s'est connecté
);

-- Index pour accélérer les recherches par email
CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_role  ON utilisateurs(role);


-- ============================================================
-- TABLE 2 : filieres
-- Représente les filières disponibles (Droit, Info, Gestion...)
-- ============================================================
CREATE TABLE filieres (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL,    -- Ex: "Informatique", "Droit", "Gestion"
    code        VARCHAR(20) UNIQUE NOT NULL, -- Ex: "INF", "DRT", "GST"
    description TEXT,
    est_active  BOOLEAN DEFAULT TRUE
);


-- ============================================================
-- TABLE 3 : etudiants
-- Informations complètes de chaque étudiant
-- ============================================================
CREATE TABLE etudiants (
    id              SERIAL PRIMARY KEY,
    utilisateur_id  INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    filiere_id      INTEGER REFERENCES filieres(id),
    
    -- Informations personnelles
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    date_naissance  DATE,
    lieu_naissance  VARCHAR(100),
    sexe            CHAR(1) CHECK (sexe IN ('M', 'F')),
    nationalite     VARCHAR(50) DEFAULT 'Malagasy',
    adresse         TEXT,
    contact         VARCHAR(20),            -- Numéro de téléphone
    
    -- Informations académiques
    matricule       VARCHAR(20) UNIQUE NOT NULL, -- Numéro d'étudiant unique
    serie_bacc      VARCHAR(10),            -- Série du baccalauréat (A, C, D...)
    annee_bacc      INTEGER,               -- Année du baccalauréat
    niveau          VARCHAR(10) DEFAULT 'L1' -- L1, L2, L3, M1, M2
                    CHECK (niveau IN ('L1', 'L2', 'L3', 'M1', 'M2')),
    annee_scolaire  VARCHAR(9) NOT NULL,    -- Ex: "2025-2026"
    
    -- Statut
    statut          VARCHAR(20) DEFAULT 'actif'
                    CHECK (statut IN ('actif', 'suspendu', 'diplome', 'abandonne')),
    
    -- QR Code (généré à l'inscription) pour scan de présence
    qr_code         TEXT UNIQUE,
    
    date_inscription TIMESTAMP DEFAULT NOW()
);

-- Index pour accélérer les recherches fréquentes
CREATE INDEX idx_etudiants_matricule   ON etudiants(matricule);
CREATE INDEX idx_etudiants_filiere     ON etudiants(filiere_id);
CREATE INDEX idx_etudiants_annee       ON etudiants(annee_scolaire);


-- ============================================================
-- TABLE 4 : enseignants
-- Informations des enseignants
-- ============================================================
CREATE TABLE enseignants (
    id              SERIAL PRIMARY KEY,
    utilisateur_id  INTEGER UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
    
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    specialite      VARCHAR(100),          -- Ex: "Développement Web", "Comptabilité"
    contact         VARCHAR(20),
    grade           VARCHAR(50),           -- Ex: "Maître de conférence", "Professeur"
    date_embauche   DATE DEFAULT CURRENT_DATE
);


-- ============================================================
-- TABLE 5 : salles
-- Les salles de cours disponibles
-- ============================================================
CREATE TABLE salles (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(50) NOT NULL,      -- Ex: "Salle A", "Amphi 1"
    capacite    INTEGER NOT NULL,          -- Nombre de places
    type_salle  VARCHAR(30) DEFAULT 'cours' -- 'cours', 'amphi', 'labo', 'informatique'
                CHECK (type_salle IN ('cours', 'amphi', 'labo', 'informatique')),
    est_disponible BOOLEAN DEFAULT TRUE
);


-- ============================================================
-- TABLE 6 : groupes
-- Les groupes/promotions d'étudiants
-- ============================================================
CREATE TABLE groupes (
    id           SERIAL PRIMARY KEY,
    filiere_id   INTEGER REFERENCES filieres(id),
    nom          VARCHAR(50) NOT NULL,    -- Ex: "INF3-A", "INF3-B"
    niveau       VARCHAR(10) NOT NULL,
    annee_scolaire VARCHAR(9) NOT NULL,
    effectif_max INTEGER DEFAULT 30
);


-- ============================================================
-- TABLE 7 : cours
-- Les matières/cours enseignés
-- ============================================================
CREATE TABLE cours (
    id              SERIAL PRIMARY KEY,
    enseignant_id   INTEGER REFERENCES enseignants(id),
    filiere_id      INTEGER REFERENCES filieres(id),
    
    code_cours      VARCHAR(20) UNIQUE NOT NULL, -- Ex: "INF301"
    intitule        VARCHAR(150) NOT NULL,        -- Ex: "Base de données"
    description     TEXT,
    coefficient     DECIMAL(3,1) DEFAULT 1.0,     -- Coefficient pour la moyenne
    volume_horaire  INTEGER,                      -- Heures totales du cours
    semestre        INTEGER CHECK (semestre IN (1, 2)),
    niveau          VARCHAR(10)                   -- Niveau concerné
);

CREATE INDEX idx_cours_enseignant ON cours(enseignant_id);
CREATE INDEX idx_cours_filiere    ON cours(filiere_id);


-- ============================================================
-- TABLE 8 : inscriptions_cours
-- Liaison entre étudiants et cours (qui suit quel cours)
-- ============================================================
CREATE TABLE inscriptions_cours (
    id          SERIAL PRIMARY KEY,
    etudiant_id INTEGER REFERENCES etudiants(id) ON DELETE CASCADE,
    cours_id    INTEGER REFERENCES cours(id) ON DELETE CASCADE,
    groupe_id   INTEGER REFERENCES groupes(id),
    date_inscription TIMESTAMP DEFAULT NOW(),
    
    -- Un étudiant ne peut s'inscrire qu'une fois par cours
    UNIQUE(etudiant_id, cours_id)
);


-- ============================================================
-- TABLE 9 : emplois_du_temps
-- Planning des séances de cours
-- Module 6 : Gestion Intelligente des Emplois du Temps
-- ============================================================
CREATE TABLE emplois_du_temps (
    id              SERIAL PRIMARY KEY,
    cours_id        INTEGER REFERENCES cours(id),
    salle_id        INTEGER REFERENCES salles(id),
    groupe_id       INTEGER REFERENCES groupes(id),
    enseignant_id   INTEGER REFERENCES enseignants(id),
    
    jour_semaine    INTEGER NOT NULL        -- 1=Lundi, 2=Mardi, ..., 6=Samedi
                    CHECK (jour_semaine BETWEEN 1 AND 6),
    heure_debut     TIME NOT NULL,
    heure_fin       TIME NOT NULL,
    type_seance     VARCHAR(20) DEFAULT 'cours'  -- 'cours', 'td', 'tp', 'examen'
                    CHECK (type_seance IN ('cours', 'td', 'tp', 'examen')),
    
    semaine_debut   DATE,                   -- Début de validité
    semaine_fin     DATE,                   -- Fin de validité
    est_annule      BOOLEAN DEFAULT FALSE,
    motif_annulation TEXT,
    
    -- CONTRAINTE : pas 2 cours dans la même salle au même moment
    CONSTRAINT no_conflit_salle UNIQUE (salle_id, jour_semaine, heure_debut),
    -- CONTRAINTE : pas 2 cours pour le même enseignant au même moment
    CONSTRAINT no_conflit_enseignant UNIQUE (enseignant_id, jour_semaine, heure_debut)
);


-- ============================================================
-- TABLE 10 : notes
-- Les notes des étudiants
-- Module 3 : Gestion Automatisée des Notes
-- ============================================================
CREATE TABLE notes (
    id              SERIAL PRIMARY KEY,
    etudiant_id     INTEGER REFERENCES etudiants(id) ON DELETE CASCADE,
    cours_id        INTEGER REFERENCES cours(id),
    
    -- Types de notes
    note_controle   DECIMAL(5,2),           -- Note de contrôle continu
    note_examen     DECIMAL(5,2),           -- Note d'examen final
    note_tp         DECIMAL(5,2),           -- Note de travaux pratiques
    
    -- Calculées automatiquement (voir trigger ci-dessous)
    note_finale     DECIMAL(5,2),           -- Moyenne pondérée
    
    semestre        INTEGER CHECK (semestre IN (1, 2)),
    annee_scolaire  VARCHAR(9) NOT NULL,
    
    -- Statut de validation
    est_valide      BOOLEAN,                -- NULL = pas encore calculé
    est_rattrapage  BOOLEAN DEFAULT FALSE,  -- Est en rattrapage ?
    
    date_saisie     TIMESTAMP DEFAULT NOW(),
    saisi_par       INTEGER REFERENCES utilisateurs(id), -- Qui a saisi les notes
    
    -- Un étudiant a une seule entrée de notes par cours par année
    UNIQUE(etudiant_id, cours_id, annee_scolaire, semestre)
);

CREATE INDEX idx_notes_etudiant ON notes(etudiant_id);
CREATE INDEX idx_notes_cours    ON notes(cours_id);


-- ============================================================
-- TABLE 11 : presences
-- Suivi des présences des étudiants
-- Module 4 : Gestion Intelligente des Présences (IA)
-- ============================================================
CREATE TABLE presences (
    id              SERIAL PRIMARY KEY,
    etudiant_id     INTEGER REFERENCES etudiants(id) ON DELETE CASCADE,
    emploi_du_temps_id INTEGER REFERENCES emplois_du_temps(id),
    
    date_seance     DATE NOT NULL,
    heure_entree    TIME,                   -- Heure réelle d'arrivée
    heure_sortie    TIME,                   -- Heure réelle de départ
    
    -- Méthode de pointage (Module 4)
    methode_entree  VARCHAR(20)             -- 'qr_code', 'faciale', 'manuel'
                    CHECK (methode_entree IN ('qr_code', 'faciale', 'manuel')),
    methode_sortie  VARCHAR(20)
                    CHECK (methode_sortie IN ('qr_code', 'faciale', 'manuel')),
    
    statut          VARCHAR(20) DEFAULT 'present'
                    CHECK (statut IN ('present', 'absent', 'retard', 'excuse')),
    
    -- Pour la reconnaissance faciale (chemin vers l'image si conservée)
    image_faciale   TEXT,
    
    date_enregistrement TIMESTAMP DEFAULT NOW(),
    
    -- Un seul enregistrement par étudiant par séance
    UNIQUE(etudiant_id, emploi_du_temps_id, date_seance)
);

CREATE INDEX idx_presences_etudiant ON presences(etudiant_id);
CREATE INDEX idx_presences_date     ON presences(date_seance);


-- ============================================================
-- TABLE 12 : paiements
-- Gestion financière des étudiants
-- Module 5 : Module Financier
-- ============================================================
CREATE TABLE paiements (
    id              SERIAL PRIMARY KEY,
    etudiant_id     INTEGER REFERENCES etudiants(id) ON DELETE CASCADE,
    
    montant         DECIMAL(12,2) NOT NULL,  -- Montant en Ariary
    type_paiement   VARCHAR(30) NOT NULL     -- 'inscription', 'scolarite', 'rattrapage'
                    CHECK (type_paiement IN ('inscription', 'scolarite', 'rattrapage', 'autre')),
    
    statut          VARCHAR(20) DEFAULT 'en_attente'
                    CHECK (statut IN ('paye', 'en_attente', 'en_retard', 'annule')),
    
    date_paiement   DATE,                    -- Date réelle du paiement
    date_echeance   DATE,                    -- Date limite de paiement
    
    reference       VARCHAR(50) UNIQUE,      -- Numéro de reçu unique
    mode_paiement   VARCHAR(30),             -- 'especes', 'mobile_money', 'virement'
    
    -- Qui a enregistré le paiement
    enregistre_par  INTEGER REFERENCES utilisateurs(id),
    date_creation   TIMESTAMP DEFAULT NOW(),
    
    -- Lien vers le PDF du reçu (généré par ReportLab)
    chemin_recu_pdf TEXT
);

CREATE INDEX idx_paiements_etudiant ON paiements(etudiant_id);
CREATE INDEX idx_paiements_statut   ON paiements(statut);


-- ============================================================
-- TABLE 13 : devoirs
-- Devoirs créés par les enseignants
-- ============================================================
CREATE TABLE devoirs (
    id              SERIAL PRIMARY KEY,
    cours_id        INTEGER REFERENCES cours(id),
    enseignant_id   INTEGER REFERENCES enseignants(id),
    groupe_id       INTEGER REFERENCES groupes(id),  -- NULL = individuel
    
    titre           VARCHAR(200) NOT NULL,
    description     TEXT,
    type_devoir     VARCHAR(20) DEFAULT 'individuel'
                    CHECK (type_devoir IN ('individuel', 'groupe')),
    date_limite     TIMESTAMP NOT NULL,
    
    date_creation   TIMESTAMP DEFAULT NOW(),
    est_publie      BOOLEAN DEFAULT FALSE
);


-- ============================================================
-- TABLE 14 : devoirs_soumissions
-- Soumissions des étudiants pour les devoirs
-- ============================================================
CREATE TABLE devoirs_soumissions (
    id          SERIAL PRIMARY KEY,
    devoir_id   INTEGER REFERENCES devoirs(id) ON DELETE CASCADE,
    etudiant_id INTEGER REFERENCES etudiants(id) ON DELETE CASCADE,
    
    fichier_path TEXT,                      -- Chemin du fichier soumis
    commentaire  TEXT,
    est_fait     BOOLEAN DEFAULT FALSE,     -- Marqué "fait" par l'étudiant
    
    date_soumission TIMESTAMP DEFAULT NOW(),
    note_obtenue DECIMAL(5,2),
    
    UNIQUE(devoir_id, etudiant_id)
);


-- ============================================================
-- TABLE 15 : annonces
-- Annonces des enseignants et administrateurs
-- ============================================================
CREATE TABLE annonces (
    id              SERIAL PRIMARY KEY,
    auteur_id       INTEGER REFERENCES utilisateurs(id),
    filiere_id      INTEGER REFERENCES filieres(id),  -- NULL = toutes les filières
    groupe_id       INTEGER REFERENCES groupes(id),   -- NULL = tous les groupes
    
    titre           VARCHAR(200) NOT NULL,
    contenu         TEXT NOT NULL,
    date_publication TIMESTAMP DEFAULT NOW(),
    est_importante  BOOLEAN DEFAULT FALSE
);


-- ============================================================
-- VUES UTILES - Pour faciliter les requêtes fréquentes
-- ============================================================

-- Vue : Résumé des notes d'un étudiant avec moyennes
CREATE OR REPLACE VIEW vue_notes_etudiants AS
SELECT 
    e.id AS etudiant_id,
    e.matricule,
    e.nom || ' ' || e.prenom AS nom_complet,
    f.nom AS filiere,
    c.intitule AS cours,
    c.coefficient,
    n.note_controle,
    n.note_examen,
    n.note_tp,
    n.note_finale,
    n.est_valide,
    n.annee_scolaire
FROM etudiants e
JOIN filieres f ON f.id = e.filiere_id
JOIN notes n ON n.etudiant_id = e.id
JOIN cours c ON c.id = n.cours_id;

-- Vue : Taux de présence par étudiant
CREATE OR REPLACE VIEW vue_taux_presence AS
SELECT
    e.id AS etudiant_id,
    e.matricule,
    e.nom || ' ' || e.prenom AS nom_complet,
    COUNT(p.id) AS total_seances,
    COUNT(CASE WHEN p.statut = 'present' THEN 1 END) AS seances_presentes,
    ROUND(
        COUNT(CASE WHEN p.statut = 'present' THEN 1 END) * 100.0 
        / NULLIF(COUNT(p.id), 0), 1
    ) AS taux_presence_pct
FROM etudiants e
LEFT JOIN presences p ON p.etudiant_id = e.id
GROUP BY e.id, e.matricule, e.nom, e.prenom;

-- Vue : Situation financière des étudiants
CREATE OR REPLACE VIEW vue_situation_financiere AS
SELECT
    e.id AS etudiant_id,
    e.matricule,
    e.nom || ' ' || e.prenom AS nom_complet,
    COALESCE(SUM(CASE WHEN p.statut = 'paye' THEN p.montant END), 0) AS total_paye,
    COALESCE(SUM(CASE WHEN p.statut IN ('en_attente', 'en_retard') THEN p.montant END), 0) AS total_du,
    COUNT(CASE WHEN p.statut = 'en_retard' THEN 1 END) AS nb_retards
FROM etudiants e
LEFT JOIN paiements p ON p.etudiant_id = e.id
GROUP BY e.id, e.matricule, e.nom, e.prenom;


-- ============================================================
-- FONCTIONS ET TRIGGERS AUTOMATIQUES
-- ============================================================

-- TRIGGER : Calculer automatiquement la note finale quand on saisit les notes
CREATE OR REPLACE FUNCTION calculer_note_finale()
RETURNS TRIGGER AS $$
BEGIN
    -- Formule : 40% contrôle + 50% examen + 10% TP (ajustable)
    NEW.note_finale := ROUND(
        COALESCE(NEW.note_controle, 0) * 0.4 +
        COALESCE(NEW.note_examen, 0)   * 0.5 +
        COALESCE(NEW.note_tp, 0)       * 0.1
    , 2);
    
    -- Validation automatique si note >= 10/20
    NEW.est_valide := (NEW.note_finale >= 10);
    
    -- Rattrapage si note entre 7 et 9.99
    NEW.est_rattrapage := (NEW.note_finale >= 7 AND NEW.note_finale < 10);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcul_note
    BEFORE INSERT OR UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION calculer_note_finale();


-- TRIGGER : Bloquer l'accès aux examens si non payé
-- (Utilisé dans les requêtes backend, pas ici directement)

-- ============================================================
-- DONNÉES DE TEST (données d'exemple pour commencer)
-- ============================================================

-- Filières
INSERT INTO filieres (nom, code) VALUES 
    ('Informatique', 'INF'),
    ('Gestion', 'GST'),
    ('Droit', 'DRT');

-- Salles
INSERT INTO salles (nom, capacite, type_salle) VALUES 
    ('Salle A101', 30, 'cours'),
    ('Salle A102', 30, 'cours'),
    ('Amphi 1', 150, 'amphi'),
    ('Labo Informatique', 25, 'informatique');

-- Compte admin
INSERT INTO utilisateurs (email, mot_de_passe, role) VALUES 
    ('admin@smartcampus.mg', '$2b$12$hash_exemple', 'admin');

COMMIT;
