/**
 * context/AuthContext.js — Gestion globale de l'authentification
 * ================================================================
 * Stocke l'utilisateur connecté (avec son profil_id) et le rend
 * disponible partout dans l'app via useAuth().
 *
 * Utilisation dans n'importe quel composant :
 *   const { utilisateur, role, estAdmin, deconnecter } = useAuth();
 */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/services';

const AuthContext = createContext(null);

/** Hook raccourci */
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement,  setChargement]  = useState(true);

  // Au démarrage : recharger l'utilisateur depuis localStorage si token présent
  useEffect(() => {
    const token         = localStorage.getItem('access_token');
    const userSauvegarde = localStorage.getItem('utilisateur');
    if (token && userSauvegarde) {
      try {
        setUtilisateur(JSON.parse(userSauvegarde));
      } catch {
        localStorage.clear();
      }
    }
    setChargement(false);
  }, []);

  /**
   * Connecter l'utilisateur.
   * La réponse contient : { access, refresh, utilisateur: { id, email, role, profil_id } }
   * profil_id = ID de la table etudiants ou enseignants selon le rôle
   */
  const connecter = async (email, motDePasse) => {
    const res = await authAPI.connexion(email, motDePasse);
    const { access, refresh, utilisateur: user } = res.data;

    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('utilisateur',   JSON.stringify(user)); // profil_id inclus
    setUtilisateur(user);
    return user;
  };

  const deconnecter = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) await authAPI.deconnexion(refresh);
    } catch { /* ignorer les erreurs réseau lors de la déconnexion */ }
    localStorage.clear();
    setUtilisateur(null);
  };

  const valeur = {
    utilisateur,
    role:          utilisateur?.role         || null,
    estConnecte:   !!utilisateur,
    chargement,
    connecter,
    deconnecter,
    estAdmin:      utilisateur?.role === 'admin',
    estEnseignant: utilisateur?.role === 'enseignant',
    estEtudiant:   utilisateur?.role === 'etudiant',
  };

  return (
    <AuthContext.Provider value={valeur}>
      {children}
    </AuthContext.Provider>
  );
};
