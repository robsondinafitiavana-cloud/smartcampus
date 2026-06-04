/**
 * api/services.js — Toutes les fonctions d'appel API
 * ====================================================
 * Chaque module a ses propres fonctions.
 * Les pages importent ces fonctions au lieu d'écrire
 * des appels fetch/axios directement.
 * 
 * Exemple d'utilisation dans une page :
 *   import { etudiantsAPI } from '../api/services';
 *   const liste = await etudiantsAPI.getListe();
 */
import api from './axios';
import axios from 'axios';

const FLASK_IA_URL = 'https://smartcampus-ia.onrender.com';

// ══════════════════════════════════════════════════════════════
// AUTH — Authentification
// ══════════════════════════════════════════════════════════════
export const authAPI = {
  /** Connexion → retourne { access, refresh, utilisateur } */
  connexion: (email, mot_de_passe) =>
    api.post('/auth/connexion/', { email, mot_de_passe }),

  /** Déconnexion (invalide le refresh token) */
  deconnexion: (refresh) =>
    api.post('/auth/deconnexion/', { refresh }),

  /** Profil de l'utilisateur connecté */
  monProfil: () => api.get('/auth/profil/'),

  /** Créer un compte (admin uniquement) */
  creerCompte: (data) => api.post('/auth/creer/', data),
};

// ══════════════════════════════════════════════════════════════
// MODULE 1 — Étudiants
// ══════════════════════════════════════════════════════════════
export const etudiantsAPI = {
  /** Liste avec filtres optionnels : filiere, niveau, statut, q (recherche) */
  getListe: (params = {}) => api.get('/etudiants/', { params }),

  /** Détail d'un étudiant */
  getUn: (id) => api.get(`/etudiants/${id}/`),

  /** Créer un étudiant + son compte utilisateur */
  creer: (data) => api.post('/etudiants/', data),

  /** Modifier un étudiant */
  modifier: (id, data) => api.patch(`/etudiants/${id}/`, data),

  /** Supprimer */
  supprimer: (id) => api.delete(`/etudiants/${id}/`),

  /** Notes d'un étudiant */
  getNotes: (id) => api.get(`/etudiants/${id}/notes/`),

  /** Taux de présence */
  getTauxPresence: (id) => api.get(`/etudiants/${id}/taux_presence/`),

  /** Situation financière */
  getSituationFinanciere: (id) => api.get(`/etudiants/${id}/situation_financiere/`),
};

// ══════════════════════════════════════════════════════════════
// MODULE 2 — Enseignants
// ══════════════════════════════════════════════════════════════
export const enseignantsAPI = {
  getListe: () => api.get('/enseignants/'),
  getUn: (id) => api.get(`/enseignants/${id}/`),
  creer: (data) => api.post('/enseignants/', data),
  modifier: (id, data) => api.patch(`/enseignants/${id}/`, data),
  getMesCours: (id) => api.get(`/enseignants/${id}/mes_cours/`),
};

// ══════════════════════════════════════════════════════════════
// MODULE 2 — Cours & Matières
// ══════════════════════════════════════════════════════════════
export const coursAPI = {
  getListe: (params = {}) => api.get('/cours/', { params }),
  getUn: (id) => api.get(`/cours/${id}/`),
  creer: (data) => api.post('/cours/', data),
  modifier: (id, data) => api.patch(`/cours/${id}/`, data),
};

// ══════════════════════════════════════════════════════════════
// MODULE 3 — Notes
// ══════════════════════════════════════════════════════════════
export const notesAPI = {
  /** Saisir ou modifier une note */
  saisir: (data) => api.post('/notes/', data),

  /** Bulletin complet d'un étudiant */
  getBulletin: (etudiantId, annee) =>
    api.get('/notes/bulletin/', { params: { etudiant_id: etudiantId, annee } }),

  /** Statistiques d'un cours */
  getStatistiques: (coursId) =>
    api.get('/notes/statistiques/', { params: { cours_id: coursId } }),

  /** Liste des étudiants à risque (notes < 10) */
  getEtudiantsARisque: () => api.get('/notes/etudiants_a_risque/'),
};

// ══════════════════════════════════════════════════════════════
// MODULE 4 — Présences
// ══════════════════════════════════════════════════════════════
export const presencesAPI = {
  getListe: (params = {}) => api.get('/presences/', { params }),

  /** Pointage via QR Code (entrée) */
  pointerQR: (qr_code, emploi_du_temps_id) =>
    api.post('/presences/qr/', { qr_code, emploi_du_temps_id }),

  /** Pointage via reconnaissance faciale (sortie) */
  pointerFaciale: (etudiant_id, emploi_du_temps_id) =>
    api.post('/presences/faciale/', { etudiant_id, emploi_du_temps_id }),
};

// ══════════════════════════════════════════════════════════════
// MODULE 5 — Paiements
// ══════════════════════════════════════════════════════════════
export const paiementsAPI = {
  getListe: (params = {}) => api.get('/paiements/', { params }),
  creer: (data) => api.post('/paiements/', data),
  getDashboard: () => api.get('/paiements/dashboard/'),
  getEnRetard: () => api.get('/paiements/en_retard/'),
  marquerPaye: (id, mode_paiement) =>
    api.post(`/paiements/${id}/marquer_paye/`, { mode_paiement }),
};

// ══════════════════════════════════════════════════════════════
// MODULE 6 — Planning / Emplois du temps
// ══════════════════════════════════════════════════════════════
export const planningAPI = {
  getListe: (params = {}) => api.get('/planning/', { params }),
  creer: (data) => api.post('/planning/', data),
  annuler: (id, motif) => api.post(`/planning/${id}/annuler/`, { motif }),
};

// ══════════════════════════════════════════════════════════════
// Filières et Salles (données de référence)
// ══════════════════════════════════════════════════════════════
export const referenceAPI = {
  getFilieres: () => api.get('/filieres/'),
  getSalles: () => api.get('/salles/'),
  getGroupes: () => api.get('/groupes/'),
  getAnnonces: () => api.get('/annonces/'),
  creerAnnonce: (data) => api.post('/annonces/', data),
};

// ══════════════════════════════════════════════════════════════
// NOUVEAU : Échéancier de paiement (calendrier mensuel)
// ══════════════════════════════════════════════════════════════
export const echeancierAPI = {
  /** Calendrier d'un étudiant */
  getCalendrier: (etudiantId, annee) =>
    api.get('/echeancier/', { params: { etudiant_id: etudiantId, annee } }),

  /** Générer le calendrier pour un étudiant */
  generer: (data) => api.post('/echeancier/generer/', data),

  /** Admin confirme un paiement */
  payer: (id, mode_paiement='especes') =>
    api.post(`/echeancier/${id}/payer/`, { mode_paiement }),

  /** Dashboard financier admin */
  getDashboard: (annee='2025-2026') =>
    api.get('/echeancier/dashboard_admin/', { params: { annee } }),

  /** Liste des paiements en retard */
  getRetards: (annee='2025-2026') =>
    api.get('/echeancier/retards/', { params: { annee } }),
};

// ══════════════════════════════════════════════════════════════
// NOUVEAU : Communiqués (admin publie, tous lisent + like + commentaire)
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// MODULE 8 — Devoirs & Travaux de Groupe
// ══════════════════════════════════════════════════════════════
export const devoirsAPI = {
  // Devoirs
  kanban:             (params={}) => api.get('/devoirs/kanban/', { params }),
  getListe:           (params={}) => api.get('/devoirs/', { params }),
  getUn:              (id)        => api.get(`/devoirs/${id}/`),
  creer:              (data)      => api.post('/devoirs/', data),
  modifier:           (id, data)  => api.patch(`/devoirs/${id}/`, data),
  supprimer:          (id)        => api.delete(`/devoirs/${id}/`),
  publier:            (id)        => api.post(`/devoirs/${id}/publier/`),
  cloturer:           (id)        => api.post(`/devoirs/${id}/cloturer/`),
  statistiques:       (id)        => api.get(`/devoirs/${id}/statistiques/`),
  creerGroupesAuto:   (id)        => api.post(`/devoirs/${id}/creer_groupes_auto/`),
  plagiatGlobal:      (id)        => api.get(`/devoirs/${id}/plagiat_global/`),

  // Groupes de travail
  getGroupes:         (params={}) => api.get('/groupes-travail/', { params }),
  getGroupe:          (id)        => api.get(`/groupes-travail/${id}/`),
  creerGroupe:        (data)      => api.post('/groupes-travail/', data),
  mesGroupes:         ()          => api.get('/groupes-travail/mes_groupes/'),
  rejoindreGroupe:    (id)        => api.post(`/groupes-travail/${id}/rejoindre/`),
  quitterGroupe:      (id)        => api.post(`/groupes-travail/${id}/quitter/`),
  getMessages:        (id)        => api.get(`/groupes-travail/${id}/messages/`),
  envoyerMessage:     (id, contenu) => api.post(`/groupes-travail/${id}/envoyer_message/`, { contenu }),
  getFichiers:        (id)        => api.get(`/groupes-travail/${id}/fichiers/`),
  partagerFichier:    (id, form)  => api.post(`/groupes-travail/${id}/partager_fichier/`, form, { headers:{ 'Content-Type':'multipart/form-data' } }),
  getContributions:   (id)        => api.get(`/groupes-travail/${id}/contributions/`),

  // Soumissions
  getSoumissions:     (params={}) => api.get('/soumissions/', { params }),
  soumettre:          (form)      => api.post('/soumissions/', form, { headers:{ 'Content-Type':'multipart/form-data' } }),
  mesSoumissions:     ()          => api.get('/soumissions/mes_soumissions/'),
  corriger:           (id, data)  => api.post(`/soumissions/${id}/corriger/`, data),
  lancerPlagiat:      (id)        => api.post(`/soumissions/${id}/lancer_plagiat/`),

  // Calendrier
  getCalendrier:      (params={}) => api.get('/calendrier/', { params }),
  creerEvenement:     (data)      => api.post('/calendrier/', data),

  // Notifications
  getNotifications:   ()          => api.get('/notifications/'),
  getNonLues:         ()          => api.get('/notifications/non_lues/'),
  marquerLu:          (ids=[])    => api.post('/notifications/marquer_lu/', { ids }),

  // Badges
  getCatalogue:       ()          => api.get('/badges/'),
  mesBadges:          ()          => api.get('/badges/mes_badges/'),
  classement:         ()          => api.get('/badges/classement/'),
};

export const admissionIAAPI = {
  testerAdmission: (data) => api.post('/demandes/tester_admission/', data),
  getResultat:     (id)   => api.get(`/demandes/${id}/resultat_ia/`),
  genererQuestions: (filiere, nb_questions, candidat_id) =>
    axios.post(`${FLASK_IA_URL}/api/ia/admission/generer`, { filiere, nb_questions, candidat_id }),
  evaluer: (candidat_id, filiere, session_token, reponses) =>
    axios.post(`${FLASK_IA_URL}/api/ia/admission/evaluer`, { candidat_id, filiere, session_token, reponses }),
};

export const communiquesAPI = {
  /** Liste des communiqués */
  getListe: (params={}) => api.get('/communiques/', { params }),

  /** Détail d'un communiqué */
  getUn: (id) => api.get(`/communiques/${id}/`),

  /** Admin publie un communiqué */
  publier: (data) => api.post('/communiques/', data),

  /** Modifier un communiqué (admin) */
  modifier: (id, data) => api.patch(`/communiques/${id}/`, data),

  /** Supprimer un communiqué (admin) */
  supprimer: (id) => api.delete(`/communiques/${id}/`),

  /** Liker ou unliker */
  liker: (id) => api.post(`/communiques/${id}/liker/`),

  /** Ajouter un commentaire */
  commenter: (id, contenu, parent=null) =>
    api.post(`/communiques/${id}/commenter/`, { contenu, parent }),

  /** Supprimer un commentaire */
  supprimerCommentaire: (communiqueId, commentaireId) =>
    api.delete(`/communiques/${communiqueId}/commentaire/${commentaireId}/`),
    /** Badge étudiant (données pour PDF) */
  getBadge: (id) => api.get(`/etudiants/${id}/badge/`),
  
  /** Upload photo de profil */
  uploadPhoto: (id, formData) => api.patch(`/etudiants/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
}),
};
