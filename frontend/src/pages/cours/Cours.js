import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Bouton from '../../components/common/Bouton';
import Modal from '../../components/common/Modal';
import FormField, { inputStyle } from '../../components/common/FormField';
import { coursAPI, enseignantsAPI, referenceAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

const Cours = () => {
  const { estAdmin } = useAuth();
  const [cours,      setCours]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [enseignants,setEnseignants]= useState([]);
  const [filieres,   setFilieres]   = useState([]);
  const [formulaire, setFormulaire] = useState({ code_cours:'', intitule:'', coefficient:1, semestre:1, enseignant:'', filiere:'', niveau:'L1' });
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur,     setErreur]     = useState('');

  useEffect(() => {
    charger();
    enseignantsAPI.getListe().then(r => setEnseignants(r.data.results || r.data));
    referenceAPI.getFilieres().then(r => setFilieres(r.data.results || r.data));
  }, []); // eslint-disable-line

  const charger = async () => {
    setLoading(true);
    try { const r = await coursAPI.getListe(); setCours(r.data.results || r.data); } catch {}
    setLoading(false);
  };

  const handleCreer = async (e) => {
    e.preventDefault(); setSauvegarde(true); setErreur('');
    try { await coursAPI.creer(formulaire); setModal(false); charger(); }
    catch (err) { setErreur(JSON.stringify(err.response?.data || 'Erreur')); }
    finally { setSauvegarde(false); }
  };

  const colonnes = [
    { key:'code_cours', label:'Code' },
    { key:'intitule',   label:'Intitulé' },
    { key:'coefficient',label:'Coeff' },
    { key:'semestre',   label:'Semestre', render: v => v ? `S${v}` : '—' },
    { key:'niveau',     label:'Niveau' },
    { key:'enseignant_nom', label:'Enseignant' },
  ];

  return (
    <Layout titre="📚 Cours et Matières">
      {estAdmin && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'16px' }}>
          <Bouton onClick={() => setModal(true)}>+ Nouveau cours</Bouton>
        </div>
      )}
      <Card style={{ padding:0 }}>
        <Table colonnes={colonnes} donnees={cours} loading={loading} vide="Aucun cours" />
      </Card>
      <Modal titre="+ Nouveau cours" visible={modal} onClose={() => setModal(false)}>
        <form onSubmit={handleCreer}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
            <FormField label="Code cours" required><input value={formulaire.code_cours} onChange={e=>setFormulaire({...formulaire,code_cours:e.target.value})} style={inputStyle} /></FormField>
            <FormField label="Intitulé" required><input value={formulaire.intitule} onChange={e=>setFormulaire({...formulaire,intitule:e.target.value})} style={inputStyle} /></FormField>
            <FormField label="Coefficient"><input type="number" step="0.5" value={formulaire.coefficient} onChange={e=>setFormulaire({...formulaire,coefficient:e.target.value})} style={inputStyle} /></FormField>
            <FormField label="Semestre">
              <select value={formulaire.semestre} onChange={e=>setFormulaire({...formulaire,semestre:e.target.value})} style={{...inputStyle,padding:'10px 14px',border:'1.5px solid #d1d5db',borderRadius:'8px'}}>
                <option value={1}>S1</option><option value={2}>S2</option>
              </select>
            </FormField>
            <FormField label="Enseignant">
              <select value={formulaire.enseignant} onChange={e=>setFormulaire({...formulaire,enseignant:e.target.value})} style={{...inputStyle,padding:'10px 14px',border:'1.5px solid #d1d5db',borderRadius:'8px'}}>
                <option value="">Aucun</option>
                {enseignants.map(e=><option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
              </select>
            </FormField>
            <FormField label="Filière">
              <select value={formulaire.filiere} onChange={e=>setFormulaire({...formulaire,filiere:e.target.value})} style={{...inputStyle,padding:'10px 14px',border:'1.5px solid #d1d5db',borderRadius:'8px'}}>
                <option value="">—</option>
                {filieres.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </FormField>
          </div>
          {erreur && <p style={{ color:'#ef4444', fontSize:'13px', marginBottom:'12px' }}>{erreur}</p>}
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <Bouton variante="light" onClick={() => setModal(false)}>Annuler</Bouton>
            <Bouton type="submit" disabled={sauvegarde}>{sauvegarde ? '⏳...' : '✅ Créer'}</Bouton>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Cours;
