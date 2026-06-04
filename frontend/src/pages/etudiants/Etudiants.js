import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Bouton from '../../components/common/Bouton';
import Card from '../../components/common/Card';
import FormField, { inputStyle } from '../../components/common/FormField';
import { etudiantsAPI, referenceAPI } from '../../api/services';
import { couleurStatut, formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';

const selectStyle = {
  width:'100%', padding:'10px 14px', border:'1.5px solid #e7e5e4',
  borderRadius:'10px', fontSize:'14px', background:'#fafaf9', outline:'none',
};

const Etudiants = () => {
  const { estAdmin }    = useAuth();
  const [etudiants,     setEtudiants]     = useState([]);
  const [filieres,      setFilieres]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [recherche,     setRecherche]     = useState('');
  const [filtreFiliere, setFiltreFiliere] = useState('');
  const [filtreNiveau,  setFiltreNiveau]  = useState('');
  const [modalOuvert,   setModalOuvert]   = useState(false);
  const [modalProfil,   setModalProfil]   = useState(false);
  const [modalModifier, setModalModifier] = useState(false);
  const [etudiantActif, setEtudiantActif] = useState(null);
  const [profil,        setProfil]        = useState({});
  const [erreurForm,    setErreurForm]    = useState('');
  const [sauvegarde,    setSauvegarde]    = useState(false);

  const [formulaire, setFormulaire] = useState({
    email:'', mot_de_passe:'', nom:'', prenom:'', sexe:'M',
    date_naissance:'', lieu_naissance:'', nationalite:'Malagasy',
    adresse:'', contact:'', matricule:'', filiere:'',
    niveau:'L1', annee_scolaire:'2025-2026', serie_bacc:'', annee_bacc:'', statut:'actif',
  });

  // Formulaire modification
  const [formModif, setFormModif] = useState({
    nom:'', prenom:'', sexe:'M', contact:'', adresse:'',
    lieu_naissance:'', nationalite:'Malagasy', filiere:'',
    niveau:'L1', statut:'actif', serie_bacc:'', annee_bacc:'',
  });

  const champ = (key, val) => setFormulaire(f => ({...f, [key]:val}));
  const champModif = (key, val) => setFormModif(f => ({...f, [key]:val}));

  useEffect(() => {
    charger();
    referenceAPI.getFilieres().then(r => setFilieres(r.data.results || r.data)).catch(()=>{});
  }, [filtreFiliere, filtreNiveau, recherche]); // eslint-disable-line

  const charger = async () => {
    setLoading(true);
    try {
      const res = await etudiantsAPI.getListe({
        filiere: filtreFiliere||undefined, niveau: filtreNiveau||undefined, q: recherche||undefined,
      });
      setEtudiants(res.data.results || res.data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const voirProfil = async (etudiant) => {
    setEtudiantActif(etudiant);
    setModalProfil(true);
    try {
      const [presRes, finRes] = await Promise.allSettled([
        etudiantsAPI.getTauxPresence(etudiant.id),
        etudiantsAPI.getSituationFinanciere(etudiant.id),
      ]);
      setProfil({
        presence: presRes.status==='fulfilled' ? presRes.value.data : null,
        finance:  finRes.status==='fulfilled'  ? finRes.value.data  : null,
      });
    } catch(e) {}
  };

  // Ouvrir le modal de modification
  const ouvrirModification = (etudiant) => {
    setEtudiantActif(etudiant);
    setFormModif({
      nom:            etudiant.nom            || '',
      prenom:         etudiant.prenom         || '',
      sexe:           etudiant.sexe           || 'M',
      contact:        etudiant.contact        || '',
      adresse:        etudiant.adresse        || '',
      lieu_naissance: etudiant.lieu_naissance || '',
      nationalite:    etudiant.nationalite    || 'Malagasy',
      filiere:        etudiant.filiere        || '',
      niveau:         etudiant.niveau         || 'L1',
      statut:         etudiant.statut         || 'actif',
      serie_bacc:     etudiant.serie_bacc     || '',
      annee_bacc:     etudiant.annee_bacc     || '',
    });
    setModalProfil(false);
    setModalModifier(true);
  };

  // Sauvegarder les modifications
  const handleModifier = async (e) => {
    e.preventDefault();
    setSauvegarde(true); setErreurForm('');
    try {
      await etudiantsAPI.modifier(etudiantActif.id, formModif);
      setModalModifier(false);
      charger();
    } catch(err) {
      const errData = err.response?.data;
      if (typeof errData === 'object') {
        setErreurForm(Object.entries(errData).map(([k,v])=>`${k}: ${Array.isArray(v)?v[0]:v}`).join(' | '));
      } else {
        setErreurForm('Erreur lors de la modification');
      }
    } finally { setSauvegarde(false); }
  };

  const handleCreer = async (e) => {
    e.preventDefault();
    if (!formulaire.nom.trim())       return setErreurForm('Le nom est requis');
    if (!formulaire.prenom.trim())    return setErreurForm('Le prénom est requis');
    if (!formulaire.matricule.trim()) return setErreurForm('Le matricule est requis');
    if (!formulaire.email.trim())     return setErreurForm("L'email est requis");
    if (formulaire.mot_de_passe.length < 8) return setErreurForm('Mot de passe minimum 8 caractères');

    setSauvegarde(true); setErreurForm('');
    try {
      const data = {...formulaire};
      if (!data.filiere)        delete data.filiere;
      if (!data.date_naissance) delete data.date_naissance;
      if (!data.annee_bacc)     delete data.annee_bacc;
      await etudiantsAPI.creer(data);
      setModalOuvert(false);
      charger();
      setFormulaire({ email:'', mot_de_passe:'', nom:'', prenom:'', sexe:'M',
        date_naissance:'', lieu_naissance:'', nationalite:'Malagasy', adresse:'',
        contact:'', matricule:'', filiere:'', niveau:'L1', annee_scolaire:'2025-2026',
        serie_bacc:'', annee_bacc:'', statut:'actif' });
    } catch(err) {
      const errData = err.response?.data;
      if (typeof errData === 'object') {
        setErreurForm(Object.entries(errData).map(([k,v])=>`${k}: ${Array.isArray(v)?v[0]:v}`).join(' | '));
      } else {
        setErreurForm('Erreur lors de la création');
      }
    } finally { setSauvegarde(false); }
  };

  const colonnes = [
    { key:'matricule',   label:'Matricule' },
    { key:'nom',         label:'Nom complet', render:(v,r)=>`${r.nom} ${r.prenom}` },
    { key:'filiere_nom', label:'Filière' },
    { key:'niveau',      label:'Niveau' },
    { key:'contact',     label:'Contact' },
    { key:'statut',      label:'Statut',
      render: v => <Badge type={couleurStatut(v)}>{v}</Badge> },
  ];

  return (
    <Layout titre="🎓 Gestion des Étudiants">
      {/* Filtres */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="🔍 Rechercher nom, matricule..."
          value={recherche} onChange={e => setRecherche(e.target.value)}
          style={{ ...inputStyle, width:'260px', padding:'10px 14px' }} />
        <select value={filtreFiliere} onChange={e => setFiltreFiliere(e.target.value)}
          style={{ ...selectStyle, width:'160px' }}>
          <option value="">Toutes filières</option>
          {filieres.map(f => <option key={f.id} value={f.code}>{f.nom}</option>)}
        </select>
        <select value={filtreNiveau} onChange={e => setFiltreNiveau(e.target.value)}
          style={{ ...selectStyle, width:'130px' }}>
          <option value="">Tous niveaux</option>
          {['L1','L2','L3','M1','M2'].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {estAdmin && (
          <Bouton onClick={() => setModalOuvert(true)} style={{ marginLeft:'auto' }}>
            + Nouvel étudiant
          </Bouton>
        )}
      </div>

      {/* Tableau */}
      <Card style={{ padding:0 }}>
        <Table colonnes={colonnes} donnees={etudiants} loading={loading}
          vide="Aucun étudiant trouvé"
          actions={row => (
            <div style={{ display:'flex', gap:'6px' }}>
              <Bouton variante="ghost" petit onClick={() => voirProfil(row)}>Profil</Bouton>
              {estAdmin && (
                <Bouton variante="light" petit onClick={() => ouvrirModification(row)}>✏️ Modifier</Bouton>
              )}
            </div>
          )}
        />
      </Card>

      {/* ══ Modal Profil ══ */}
      <Modal titre={`📋 ${etudiantActif?.nom} ${etudiantActif?.prenom}`}
        visible={modalProfil} onClose={() => setModalProfil(false)} largeur="560px">
        {etudiantActif && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px',
              background:'#f8fafc', borderRadius:'8px', padding:'16px' }}>
              {[
                ['Matricule',    etudiantActif.matricule],
                ['Filière',      etudiantActif.filiere_nom],
                ['Niveau',       etudiantActif.niveau],
                ['Statut',       etudiantActif.statut],
                ['Contact',      etudiantActif.contact],
                ['Inscription',  formatDate(etudiantActif.date_inscription)],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize:'11px', color:'#9ca3af', textTransform:'uppercase', marginBottom:'2px' }}>{label}</div>
                  <div style={{ fontWeight:'600', color:'#1f2937' }}>{val || '—'}</div>
                </div>
              ))}
            </div>

            {profil.presence && (
              <div style={{ background:profil.presence.alerte?'#fef9f0':'#f0fdf4',
                border:`1px solid ${profil.presence.alerte?'#fde68a':'#a7f3d0'}`,
                borderRadius:'8px', padding:'14px' }}>
                <div style={{ fontWeight:'600', marginBottom:'8px' }}>
                  {profil.presence.alerte?'⚠️':'✅'} Taux de présence
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ flex:1, height:'10px', background:'#e5e7eb', borderRadius:'5px' }}>
                    <div style={{ height:'100%', borderRadius:'5px',
                      width:`${profil.presence.taux_presence_pct}%`,
                      background:profil.presence.alerte?'#f59e0b':'#10b981' }}/>
                  </div>
                  <strong style={{ color:profil.presence.alerte?'#f59e0b':'#10b981' }}>
                    {profil.presence.taux_presence_pct}%
                  </strong>
                </div>
              </div>
            )}

            {estAdmin && (
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <Bouton variante="primary" onClick={() => ouvrirModification(etudiantActif)}>
                  ✏️ Modifier les informations
                </Bouton>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══ Modal Modifier ══ */}
      <Modal titre={`✏️ Modifier — ${etudiantActif?.nom} ${etudiantActif?.prenom}`}
        visible={modalModifier} onClose={() => setModalModifier(false)} largeur="640px">
        <form onSubmit={handleModifier}>
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px',
            padding:'12px', marginBottom:'16px', fontSize:'13px', color:'#92400e' }}>
            ℹ️ Le mot de passe ne peut pas être modifié ici pour des raisons de sécurité.
          </div>

          <div style={{ background:'#f0fdf4', borderRadius:'8px', padding:'10px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#065f46', fontWeight:'600' }}>
            👤 Informations personnelles
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Nom" required>
              <input value={formModif.nom} onChange={e=>champModif('nom',e.target.value)}
                style={inputStyle} />
            </FormField>
            <FormField label="Prénom" required>
              <input value={formModif.prenom} onChange={e=>champModif('prenom',e.target.value)}
                style={inputStyle} />
            </FormField>
            <FormField label="Sexe">
              <select value={formModif.sexe} onChange={e=>champModif('sexe',e.target.value)}
                style={selectStyle}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </FormField>
            <FormField label="Contact">
              <input value={formModif.contact} onChange={e=>champModif('contact',e.target.value)}
                placeholder="034 XX XXX XX" style={inputStyle} />
            </FormField>
            <FormField label="Lieu de naissance">
              <input value={formModif.lieu_naissance} onChange={e=>champModif('lieu_naissance',e.target.value)}
                style={inputStyle} />
            </FormField>
            <FormField label="Nationalité">
              <input value={formModif.nationalite} onChange={e=>champModif('nationalite',e.target.value)}
                style={inputStyle} />
            </FormField>
          </div>
          <FormField label="Adresse">
            <input value={formModif.adresse} onChange={e=>champModif('adresse',e.target.value)}
              style={inputStyle} />
          </FormField>

          <div style={{ background:'#fef9f0', borderRadius:'8px', padding:'10px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#92400e', fontWeight:'600' }}>
            🎓 Informations académiques
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Filière">
              <select value={formModif.filiere} onChange={e=>champModif('filiere',e.target.value)}
                style={selectStyle}>
                <option value="">— Choisir —</option>
                {filieres.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </FormField>
            <FormField label="Niveau">
              <select value={formModif.niveau} onChange={e=>champModif('niveau',e.target.value)}
                style={selectStyle}>
                {['L1','L2','L3','M1','M2'].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </FormField>
            <FormField label="Statut">
              <select value={formModif.statut} onChange={e=>champModif('statut',e.target.value)}
                style={selectStyle}>
                <option value="actif">Actif</option>
                <option value="suspendu">Suspendu</option>
                <option value="diplome">Diplômé</option>
                <option value="abandonne">Abandonné</option>
              </select>
            </FormField>
            <FormField label="Série Bac">
              <select value={formModif.serie_bacc} onChange={e=>champModif('serie_bacc',e.target.value)}
                style={selectStyle}>
                <option value="">—</option>
                {['A','C','D','E','F','G','OSE','TI'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </div>

          {erreurForm && (
            <div style={{ background:'#fee2e2', borderRadius:'8px', padding:'10px',
              color:'#991b1b', fontSize:'13px', marginBottom:'12px' }}>
              ❌ {erreurForm}
            </div>
          )}
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <Bouton variante="light" onClick={() => setModalModifier(false)}>Annuler</Bouton>
            <Bouton type="submit" variante="primary" disabled={sauvegarde}>
              {sauvegarde ? '⏳ Sauvegarde...' : '✅ Enregistrer les modifications'}
            </Bouton>
          </div>
        </form>
      </Modal>

      {/* ══ Modal Créer étudiant ══ */}
      <Modal titre="➕ Nouvel étudiant" visible={modalOuvert}
        onClose={() => { setModalOuvert(false); setErreurForm(''); }} largeur="680px">
        <form onSubmit={handleCreer}>
          <div style={{ background:'#eff6ff', borderRadius:'8px', padding:'10px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#1d4ed8', fontWeight:'600' }}>
            🔐 Compte de connexion
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Email *" required>
              <input type="email" value={formulaire.email} onChange={e=>champ('email',e.target.value)}
                placeholder="ex: rakoto@smartcampus.mg" style={inputStyle} />
            </FormField>
            <FormField label="Mot de passe (min 8 car.) *" required>
              <input type="password" value={formulaire.mot_de_passe} onChange={e=>champ('mot_de_passe',e.target.value)}
                style={inputStyle} />
            </FormField>
          </div>

          <div style={{ background:'#f0fdf4', borderRadius:'8px', padding:'10px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#166534', fontWeight:'600' }}>
            👤 Informations personnelles
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Nom *" required>
              <input value={formulaire.nom} onChange={e=>champ('nom',e.target.value)} style={inputStyle} />
            </FormField>
            <FormField label="Prénom *" required>
              <input value={formulaire.prenom} onChange={e=>champ('prenom',e.target.value)} style={inputStyle} />
            </FormField>
            <FormField label="Sexe">
              <select value={formulaire.sexe} onChange={e=>champ('sexe',e.target.value)} style={selectStyle}>
                <option value="M">Masculin</option><option value="F">Féminin</option>
              </select>
            </FormField>
            <FormField label="Contact">
              <input value={formulaire.contact} onChange={e=>champ('contact',e.target.value)}
                placeholder="034 XX XXX XX" style={inputStyle} />
            </FormField>
          </div>

          <div style={{ background:'#fef9f0', borderRadius:'8px', padding:'10px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#92400e', fontWeight:'600' }}>
            🎓 Informations académiques
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Matricule *" required>
              <input value={formulaire.matricule} onChange={e=>champ('matricule',e.target.value)}
                placeholder="INF2025001" style={inputStyle} />
            </FormField>
            <FormField label="Filière">
              <select value={formulaire.filiere} onChange={e=>champ('filiere',e.target.value)} style={selectStyle}>
                <option value="">— Choisir —</option>
                {filieres.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </FormField>
            <FormField label="Niveau">
              <select value={formulaire.niveau} onChange={e=>champ('niveau',e.target.value)} style={selectStyle}>
                {['L1','L2','L3','M1','M2'].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </FormField>
            <FormField label="Année scolaire">
              <select value={formulaire.annee_scolaire} onChange={e=>champ('annee_scolaire',e.target.value)} style={selectStyle}>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </FormField>
          </div>

          {erreurForm && (
            <div style={{ background:'#fee2e2', borderRadius:'8px', padding:'10px',
              color:'#991b1b', fontSize:'13px', marginBottom:'12px' }}>❌ {erreurForm}</div>
          )}
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <Bouton variante="light" onClick={() => { setModalOuvert(false); setErreurForm(''); }}>Annuler</Bouton>
            <Bouton type="submit" variante="primary" disabled={sauvegarde}>
              {sauvegarde ? '⏳ Création...' : '✅ Créer l\'étudiant'}
            </Bouton>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};
export default Etudiants;