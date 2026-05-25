/**
 * pages/planning/Planning.js — Module 6 : Emplois du Temps
 * ===========================================================
 * Affiche l'emploi du temps en grille hebdomadaire.
 * Anti-conflits : si salle ou enseignant déjà pris, erreur claire.
 */
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';

import Modal from '../../components/common/Modal';
import Bouton from '../../components/common/Bouton';
import FormField, { inputStyle } from '../../components/common/FormField';
import { planningAPI, coursAPI, referenceAPI, enseignantsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const COULEURS_COURS = ['#dbeafe','#d1fae5','#fde68a','#fce7f3','#ede9fe','#ffedd5'];

const Planning = () => {
  const { estAdmin } = useAuth();
  const [seances,     setSeances]     = useState([]);
  const [cours,       setCours]       = useState([]);
  const [salles,      setSalles]      = useState([]);
  const [groupes,     setGroupes]     = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modalAjout,  setModalAjout]  = useState(false);
  const [erreur,      setErreur]      = useState('');
  const [sauvegarde,  setSauvegarde]  = useState(false);
  const [formulaire,  setFormulaire]  = useState({
    cours:'', salle:'', groupe:'', enseignant:'',
    jour_semaine:1, heure_debut:'08:00', heure_fin:'10:00', type_seance:'cours'
  });

  useEffect(() => {
    charger();
    Promise.all([
      coursAPI.getListe(), referenceAPI.getSalles(),
      enseignantsAPI.getListe(), referenceAPI.getGroupes()
    ]).then(([cRes, sRes, eRes, gRes]) => {
      setCours(cRes.data.results || cRes.data);
      setSalles(sRes.data.results || sRes.data);
      setEnseignants(eRes.data.results || eRes.data);
      setGroupes(gRes.data.results || gRes.data);
    });
  }, []); // eslint-disable-line

  const charger = async () => {
    setLoading(true);
    try {
      const res = await planningAPI.getListe();
      setSeances(res.data.results || res.data);
    } catch { }
    setLoading(false);
  };

  const handleCreer = async (e) => {
    e.preventDefault();
    setSauvegarde(true); setErreur('');
    try {
      await planningAPI.creer(formulaire);
      setModalAjout(false);
      charger();
    } catch (err) {
      setErreur(err.response?.data?.erreur || JSON.stringify(err.response?.data || 'Erreur'));
    } finally { setSauvegarde(false); }
  };

  // Organiser les séances par jour pour la grille
  const seancesParJour = JOURS.reduce((acc, jour, i) => {
    acc[i+1] = seances.filter(s => s.jour_semaine === i+1).sort((a,b) => a.heure_debut.localeCompare(b.heure_debut));
    return acc;
  }, {});

  return (
    <Layout titre="📅 Emplois du Temps">
      {estAdmin && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'20px' }}>
          <Bouton onClick={() => setModalAjout(true)}>+ Ajouter un cours</Bouton>
        </div>
      )}

      {/* Grille hebdomadaire */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color:'#6b7280' }}>Chargement...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'12px' }}>
          {JOURS.map((jour, i) => (
            <div key={jour}>
              {/* En-tête du jour */}
              <div style={{
                background:'#1e3a5f', color:'#fff', borderRadius:'8px 8px 0 0',
                padding:'10px', textAlign:'center', fontWeight:'700', fontSize:'13px'
              }}>
                {jour}
              </div>
              {/* Séances du jour */}
              <div style={{ background:'#f8fafc', borderRadius:'0 0 8px 8px', padding:'8px',
                minHeight:'200px', border:'1px solid #e5e7eb', borderTop:'none',
                display:'flex', flexDirection:'column', gap:'6px' }}>
                {seancesParJour[i+1].length === 0 ? (
                  <div style={{ textAlign:'center', color:'#d1d5db', padding:'20px', fontSize:'12px' }}>
                    Libre
                  </div>
                ) : seancesParJour[i+1].map((s, idx) => (
                  <div key={s.id} style={{
                    background: COULEURS_COURS[idx % COULEURS_COURS.length],
                    borderRadius:'6px', padding:'8px 10px', fontSize:'12px',
                    borderLeft:'3px solid #1e3a5f'
                  }}>
                    <div style={{ fontWeight:'700', color:'#1e3a5f', marginBottom:'2px' }}>
                      {s.heure_debut?.slice(0,5)} – {s.heure_fin?.slice(0,5)}
                    </div>
                    <div style={{ fontWeight:'600', color:'#374151' }}>{s.cours_nom}</div>
                    <div style={{ color:'#6b7280', fontSize:'11px' }}>{s.salle_nom}</div>
                    <div style={{ color:'#6b7280', fontSize:'11px' }}>{s.groupe_nom}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Légende */}
      <div style={{ display:'flex', gap:'16px', marginTop:'16px', flexWrap:'wrap' }}>
        {[['cours','Cours'],['td','TD'],['tp','TP'],['examen','Examen']].map(([k,v]) => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'#6b7280' }}>
            <span style={{ width:'12px', height:'12px', borderRadius:'3px', background:'#dbeafe', display:'inline-block' }}/>
            {v}
          </div>
        ))}
      </div>

      {/* Modal ajout */}
      <Modal titre="+ Ajouter un cours au planning" visible={modalAjout} onClose={() => setModalAjout(false)}>
        <form onSubmit={handleCreer}>
          <FormField label="Cours" required>
            <select value={formulaire.cours} onChange={e=>setFormulaire({...formulaire,cours:e.target.value})}
              style={{...inputStyle, padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:'8px'}}>
              <option value="">Choisir...</option>
              {cours.map(c=><option key={c.id} value={c.id}>{c.code_cours} — {c.intitule}</option>)}
            </select>
          </FormField>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
            <FormField label="Enseignant" required>
              <select value={formulaire.enseignant} onChange={e=>setFormulaire({...formulaire,enseignant:e.target.value})}
                style={{...inputStyle, padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:'8px'}}>
                <option value="">Choisir...</option>
                {enseignants.map(e=><option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
              </select>
            </FormField>
            <FormField label="Salle" required>
              <select value={formulaire.salle} onChange={e=>setFormulaire({...formulaire,salle:e.target.value})}
                style={{...inputStyle, padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:'8px'}}>
                <option value="">Choisir...</option>
                {salles.map(s=><option key={s.id} value={s.id}>{s.nom} ({s.capacite} places)</option>)}
              </select>
            </FormField>
            <FormField label="Groupe" required>
              <select value={formulaire.groupe} onChange={e=>setFormulaire({...formulaire,groupe:e.target.value})}
                style={{...inputStyle, padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:'8px'}}>
                <option value="">Choisir...</option>
                {groupes.map(g=><option key={g.id} value={g.id}>{g.nom}</option>)}
              </select>
            </FormField>
            <FormField label="Jour">
              <select value={formulaire.jour_semaine} onChange={e=>setFormulaire({...formulaire,jour_semaine:parseInt(e.target.value)})}
                style={{...inputStyle, padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:'8px'}}>
                {JOURS.map((j,i)=><option key={i+1} value={i+1}>{j}</option>)}
              </select>
            </FormField>
            <FormField label="Heure début">
              <input type="time" value={formulaire.heure_debut} onChange={e=>setFormulaire({...formulaire,heure_debut:e.target.value})} style={inputStyle} />
            </FormField>
            <FormField label="Heure fin">
              <input type="time" value={formulaire.heure_fin} onChange={e=>setFormulaire({...formulaire,heure_fin:e.target.value})} style={inputStyle} />
            </FormField>
          </div>
          {erreur && (
            <div style={{ background:'#fee2e2', borderRadius:'8px', padding:'10px', marginBottom:'12px', color:'#991b1b', fontSize:'13px' }}>
              {erreur}
            </div>
          )}
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <Bouton variante="light" onClick={() => setModalAjout(false)}>Annuler</Bouton>
            <Bouton type="submit" disabled={sauvegarde}>{sauvegarde ? '⏳...' : '✅ Ajouter'}</Bouton>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Planning;
