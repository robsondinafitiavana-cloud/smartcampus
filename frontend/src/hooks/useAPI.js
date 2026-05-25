/**
 * hooks/useAPI.js — Hook générique pour les appels API
 * =====================================================
 * Évite de réécrire loading/error/data dans chaque composant.
 *
 * Utilisation :
 *   const { data, loading, error, refetch } = useAPI(etudiantsAPI.getListe);
 */
import { useState, useEffect, useCallback } from 'react';

const useAPI = (fonctionAPI, params = null, executer = true) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async (paramsOverride) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fonctionAPI(paramsOverride ?? params);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.erreur || err.response?.data || 'Erreur serveur');
    } finally {
      setLoading(false);
    }
  }, [fonctionAPI, params]); // eslint-disable-line

  useEffect(() => {
    if (executer) fetch();
  }, [executer]); // eslint-disable-line

  return { data, loading, error, refetch: fetch };
};

export default useAPI;
