/**
 * utils/helpers.js — Fonctions utilitaires partagées
 */

/** Formater une date "2026-05-01" → "01/05/2026" */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

/** Formater un montant en Ariary */
export const formatAriary = (montant) => {
  if (montant == null) return '—';
  return new Intl.NumberFormat('fr-FR').format(montant) + ' Ar';
};

/** Retourner la couleur selon le statut */
export const couleurStatut = (statut) => {
  const map = {
    actif: 'success', suspendu: 'danger', diplome: 'info',
    paye: 'success', en_attente: 'warning', en_retard: 'danger',
    present: 'success', absent: 'danger', retard: 'warning',
  };
  return map[statut] || 'muted';
};

/** Calculer la mention selon la moyenne */
export const getMention = (moyenne) => {
  if (moyenne >= 16) return { label: 'Très Bien', color: '#10b981' };
  if (moyenne >= 14) return { label: 'Bien',      color: '#3b82f6' };
  if (moyenne >= 12) return { label: 'Assez Bien',color: '#6366f1' };
  if (moyenne >= 10) return { label: 'Passable',  color: '#f59e0b' };
  return              { label: 'Insuffisant',     color: '#ef4444' };
};

/** Tronquer un texte long */
export const tronquer = (texte, max = 40) =>
  texte?.length > max ? texte.substring(0, max) + '…' : texte;
