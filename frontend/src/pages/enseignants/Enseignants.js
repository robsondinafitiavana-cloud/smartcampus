/**
 * pages/enseignants/Enseignants.js — Module 2 : Enseignants
 */
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Bouton from '../../components/common/Bouton';
import Modal from '../../components/common/Modal';
import FormField, { inputStyle } from '../../components/common/FormField';
import { enseignantsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

const selectStyle = {
  width:'100%', padding:'10px 14px', border:'1.5px solid #d1d5db',
  borderRadius:'8px', fontSize:'14px', background:'#fff', outline:'none',
};

const Enseignants = () => {
  const { estAdmin }   = useAuth();
  const [enseignants,  setEnseignants]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modalOuvert,  setModalOuvert]  = useState(false);
  const [erreur,       setErreur]       = useState('');
  const [sauvegarde,   setSauvegarde]   = useState(false);

  // Tous les champs du formulaire
  const [formulaire, setFormulaire] = useState({
    // Compte de connexion
    email:       '',
    mot_de_passe:'smartcampus123',
    // Infos personnelles
    nom:         '',
    prenom:      '',
    contact:     '',
    // Infos professionnelles
    specialite:  '',
    grade:       '',
  });

  const champ = (key, val) => setFormulaire(f => ({ ...f, [key]: val }));

  useEffect(() => { charger(); }, []); // eslint-disable-line

  const charger = async () => {
    setLoading(true);
    try {
      const res = await enseignantsAPI.getListe();
      setEnseignants(res.data.results || res.data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const handleCreer = async (e) => {
    e.preventDefault();
    if (!formulaire.nom.trim())    return setErreur('Le nom est requis');
    if (!formulaire.prenom.trim()) return setErreur('Le prénom est requis');
    if (!formulaire.email.trim())  return setErreur("L'email est requis");

    setSauvegarde(true); setErreur('');
    try {
      await enseignantsAPI.creer(formulaire);
      setModalOuvert(false);
      charger();
      setFormulaire({ email:'', mot_de_passe:'smartcampus123', nom:'', prenom:'',
        contact:'', specialite:'', grade:'' });
    } catch (err) {
      const errData = err.response?.data;
      if (typeof errData === 'object') {
        const messages = Object.entries(errData)
          .map(([k,v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ');
        setErreur(messages);
      } else {
        setErreur('Erreur lors de la création');
      }
    } finally { setSauvegarde(false); }
  };

  const colonnes = [
    { key:'nom',        label:'Nom complet', render:(v,r) => `${r.nom} ${r.prenom}` },
    { key:'specialite', label:'Spécialité' },
    { key:'grade',      label:'Grade' },
    { key:'contact',    label:'Contact' },
    { key:'date_embauche', label:'Depuis' },
  ];

  return (
    <Layout titre="👨‍🏫 Gestion des Enseignants">
      {estAdmin && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'16px' }}>
          <Bouton onClick={() => setModalOuvert(true)}>+ Nouvel enseignant</Bouton>
        </div>
      )}

      <Card style={{ padding:0 }}>
        <Table colonnes={colonnes} donnees={enseignants}
          loading={loading} vide="Aucun enseignant enregistré" />
      </Card>

      {/* ══ Modal Créer enseignant ══ */}
      <Modal titre="➕ Nouvel enseignant" visible={modalOuvert}
        onClose={() => { setModalOuvert(false); setErreur(''); }} largeur="600px">
        <form onSubmit={handleCreer}>

          {/* Compte */}
          <div style={{ background:'#eff6ff', borderRadius:'8px', padding:'12px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#1d4ed8', fontWeight:'600' }}>
            🔐 Compte de connexion
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Email de connexion" required>
              <input type="email" value={formulaire.email}
                onChange={e => champ('email', e.target.value)}
                placeholder="ex: prof.rakoto@smartcampus.mg" style={inputStyle} />
            </FormField>
            <FormField label="Mot de passe">
              <input type="text" value={formulaire.mot_de_passe}
                onChange={e => champ('mot_de_passe', e.target.value)}
                style={inputStyle} />
            </FormField>
          </div>

          {/* Identité */}
          <div style={{ background:'#f0fdf4', borderRadius:'8px', padding:'12px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#166534', fontWeight:'600' }}>
            👤 Informations personnelles
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Nom" required>
              <input value={formulaire.nom} onChange={e => champ('nom', e.target.value)}
                placeholder="Nom de famille" style={inputStyle} />
            </FormField>
            <FormField label="Prénom" required>
              <input value={formulaire.prenom} onChange={e => champ('prenom', e.target.value)}
                placeholder="Prénom" style={inputStyle} />
            </FormField>
            <FormField label="Contact (téléphone)">
              <input value={formulaire.contact} onChange={e => champ('contact', e.target.value)}
                placeholder="ex: 034 00 000 00" style={inputStyle} />
            </FormField>
          </div>

          {/* Professionnel */}
          <div style={{ background:'#fef9f0', borderRadius:'8px', padding:'12px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#92400e', fontWeight:'600' }}>
            📚 Informations professionnelles
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Spécialité">
              <input value={formulaire.specialite}
                onChange={e => champ('specialite', e.target.value)}
                placeholder="ex: Développement Web, Comptabilité" style={inputStyle} />
            </FormField>
            <FormField label="Grade">
              <select value={formulaire.grade} onChange={e => champ('grade', e.target.value)}
                style={selectStyle}>
                <option value="">— Choisir —</option>
                <option value="Vacataire">Vacataire</option>
                <option value="Assistant">Assistant</option>
                <option value="Maître de conférence">Maître de conférence</option>
                <option value="Professeur">Professeur</option>
                <option value="Professeur Titulaire">Professeur Titulaire</option>
              </select>
            </FormField>
          </div>

          {/* Info mot de passe */}
          <div style={{ background:'#f8fafc', borderRadius:'8px', padding:'10px 14px',
            marginBottom:'14px', fontSize:'12px', color:'#6b7280', border:'1px solid #e5e7eb' }}>
            💡 Le mot de passe par défaut est <strong>smartcampus123</strong>. L'enseignant pourra le changer après connexion.
          </div>

          {erreur && (
            <div style={{ background:'#fee2e2', borderRadius:'8px', padding:'12px',
              color:'#991b1b', fontSize:'13px', marginBottom:'12px', border:'1px solid #fecaca' }}>
              ❌ {erreur}
            </div>
          )}

          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <Bouton variante="light" onClick={() => { setModalOuvert(false); setErreur(''); }}>
              Annuler
            </Bouton>
            <Bouton type="submit" disabled={sauvegarde}>
              {sauvegarde ? '⏳ Création...' : '✅ Créer l\'enseignant'}
            </Bouton>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Enseignants;