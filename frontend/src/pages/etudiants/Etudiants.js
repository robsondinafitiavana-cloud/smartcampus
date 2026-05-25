/**
 * pages/etudiants/Etudiants.js — Module 1 : Gestion des Étudiants
 */
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

const selectStyle = {
  width:'100%', padding:'10px 14px', border:'1.5px solid #d1d5db',
  borderRadius:'8px', fontSize:'14px', background:'#fff', outline:'none',
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
  const [etudiantActif, setEtudiantActif] = useState(null);
  const [profil,        setProfil]        = useState({});
  const [erreurForm,    setErreurForm]    = useState('');
  const [sauvegarde,    setSauvegarde]    = useState(false);

  // État du formulaire avec TOUS les champs
  const [formulaire, setFormulaire] = useState({
    // Compte utilisateur
    email:          '',
    mot_de_passe:   '',
    // Infos personnelles
    nom:            '',
    prenom:         '',
    sexe:           'M',
    date_naissance: '',
    lieu_naissance: '',
    nationalite:    'Malagasy',
    adresse:        '',
    contact:        '',
    // Infos académiques
    matricule:      '',
    filiere:        '',
    niveau:         'L1',
    annee_scolaire: '2025-2026',
    serie_bacc:     '',
    annee_bacc:     '',
    statut:         'actif',
  });

  const champ = (key, val) => setFormulaire(f => ({ ...f, [key]: val }));

  useEffect(() => {
    charger();
    referenceAPI.getFilieres().then(r => setFilieres(r.data.results || r.data)).catch(()=>{});
  }, [filtreFiliere, filtreNiveau, recherche]); // eslint-disable-line

  const charger = async () => {
    setLoading(true);
    try {
      const res = await etudiantsAPI.getListe({
        filiere: filtreFiliere || undefined,
        niveau:  filtreNiveau  || undefined,
        q:       recherche     || undefined,
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
        presence: presRes.status === 'fulfilled' ? presRes.value.data : null,
        finance:  finRes.status  === 'fulfilled' ? finRes.value.data  : null,
      });
    } catch(e) {}
  };

  const handleCreer = async (e) => {
    e.preventDefault();
    // Validation manuelle
    if (!formulaire.nom.trim())        return setErreurForm('Le nom est requis');
    if (!formulaire.prenom.trim())     return setErreurForm('Le prénom est requis');
    if (!formulaire.matricule.trim())  return setErreurForm('Le matricule est requis');
    if (!formulaire.email.trim())      return setErreurForm("L'email est requis");
    if (formulaire.mot_de_passe.length < 8) return setErreurForm('Mot de passe minimum 8 caractères');

    setSauvegarde(true);
    setErreurForm('');
    try {
      // Nettoyer les champs vides optionnels
      const data = { ...formulaire };
      if (!data.filiere)        delete data.filiere;
      if (!data.date_naissance) delete data.date_naissance;
      if (!data.annee_bacc)     delete data.annee_bacc;

      await etudiantsAPI.creer(data);
      setModalOuvert(false);
      charger();
      // Réinitialiser
      setFormulaire({
        email:'', mot_de_passe:'', nom:'', prenom:'', sexe:'M',
        date_naissance:'', lieu_naissance:'', nationalite:'Malagasy',
        adresse:'', contact:'', matricule:'', filiere:'',
        niveau:'L1', annee_scolaire:'2025-2026', serie_bacc:'', annee_bacc:'', statut:'actif'
      });
    } catch (err) {
      const errData = err.response?.data;
      if (typeof errData === 'object') {
        const messages = Object.entries(errData).map(([k,v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(' | ');
        setErreurForm(messages);
      } else {
        setErreurForm('Erreur lors de la création. Vérifiez les champs.');
      }
    } finally { setSauvegarde(false); }
  };

  const colonnes = [
    { key:'matricule',   label:'Matricule' },
    { key:'nom',         label:'Nom complet', render:(v,r) => `${r.nom} ${r.prenom}` },
    { key:'filiere_nom', label:'Filière' },
    { key:'niveau',      label:'Niveau' },
    { key:'contact',     label:'Contact' },
    { key:'statut',      label:'Statut',
      render: v => <Badge type={couleurStatut(v)}>{v}</Badge> },
  ];

  return (
    <Layout titre="🎓 Gestion des Étudiants">
      {/* Barre de recherche et filtres */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center' }}>
        <input
          placeholder="🔍 Rechercher nom, matricule..."
          value={recherche} onChange={e => setRecherche(e.target.value)}
          style={{ ...inputStyle, width:'260px', padding:'10px 14px',
            border:'1.5px solid #d1d5db', borderRadius:'8px' }}
        />
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
        <Table
          colonnes={colonnes} donnees={etudiants}
          loading={loading} vide="Aucun étudiant trouvé"
          actions={row => (
            <Bouton variante="ghost" petit onClick={() => voirProfil(row)}>
              Voir profil
            </Bouton>
          )}
        />
      </Card>

      {/* ══ Modal Profil ══ */}
      <Modal
        titre={`📋 ${etudiantActif?.nom} ${etudiantActif?.prenom}`}
        visible={modalProfil} onClose={() => setModalProfil(false)} largeur="560px"
      >
        {etudiantActif && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px',
              background:'#f8fafc', borderRadius:'8px', padding:'16px' }}>
              {[
                ['Matricule', etudiantActif.matricule],
                ['Filière',   etudiantActif.filiere_nom],
                ['Niveau',    etudiantActif.niveau],
                ['Statut',    etudiantActif.statut],
                ['Contact',   etudiantActif.contact],
                ['Inscription', formatDate(etudiantActif.date_inscription)],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize:'11px', color:'#9ca3af', textTransform:'uppercase', marginBottom:'2px' }}>{label}</div>
                  <div style={{ fontWeight:'600', color:'#1f2937' }}>{val || '—'}</div>
                </div>
              ))}
            </div>

            {profil.presence && (
              <div style={{ background: profil.presence.alerte ? '#fef9f0' : '#f0fdf4',
                border:`1px solid ${profil.presence.alerte ? '#fde68a' : '#a7f3d0'}`,
                borderRadius:'8px', padding:'14px' }}>
                <div style={{ fontWeight:'600', marginBottom:'8px' }}>
                  {profil.presence.alerte ? '⚠️' : '✅'} Taux de présence
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ flex:1, height:'10px', background:'#e5e7eb', borderRadius:'5px' }}>
                    <div style={{ height:'100%', borderRadius:'5px',
                      width:`${profil.presence.taux_presence_pct}%`,
                      background: profil.presence.alerte ? '#f59e0b' : '#10b981' }}/>
                  </div>
                  <strong style={{ color: profil.presence.alerte ? '#f59e0b' : '#10b981' }}>
                    {profil.presence.taux_presence_pct}%
                  </strong>
                </div>
                <div style={{ fontSize:'12px', color:'#6b7280', marginTop:'4px' }}>
                  {profil.presence.seances_presentes}/{profil.presence.total_seances} séances
                </div>
              </div>
            )}

            {profil.finance && (
              <div style={{ background: profil.finance.peut_passer_examen ? '#f0fdf4' : '#fef2f2',
                border:`1px solid ${profil.finance.peut_passer_examen ? '#a7f3d0' : '#fecaca'}`,
                borderRadius:'8px', padding:'14px' }}>
                <div style={{ fontWeight:'600', marginBottom:'8px' }}>💰 Situation financière</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', fontSize:'14px' }}>
                  <div>Payé: <strong style={{ color:'#10b981' }}>
                    {Number(profil.finance.total_paye).toLocaleString('fr-FR')} Ar
                  </strong></div>
                  <div>Dû: <strong style={{ color:'#ef4444' }}>
                    {Number(profil.finance.total_du).toLocaleString('fr-FR')} Ar
                  </strong></div>
                </div>
                <div style={{ marginTop:'8px', fontWeight:'600',
                  color: profil.finance.peut_passer_examen ? '#10b981' : '#ef4444' }}>
                  {profil.finance.message}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══ Modal Créer étudiant ══ */}
      <Modal titre="➕ Nouvel étudiant" visible={modalOuvert}
        onClose={() => { setModalOuvert(false); setErreurForm(''); }} largeur="680px">
        <form onSubmit={handleCreer}>

          {/* Section compte */}
          <div style={{ background:'#eff6ff', borderRadius:'8px', padding:'12px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#1d4ed8', fontWeight:'600' }}>
            🔐 Compte de connexion
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Email de connexion" required>
              <input type="email" value={formulaire.email}
                onChange={e => champ('email', e.target.value)}
                placeholder="ex: rakoto@smartcampus.mg" style={inputStyle} />
            </FormField>
            <FormField label="Mot de passe (min 8 caractères)" required>
              <input type="password" value={formulaire.mot_de_passe}
                onChange={e => champ('mot_de_passe', e.target.value)}
                placeholder="Minimum 8 caractères" style={inputStyle} />
            </FormField>
          </div>

          {/* Section identité */}
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
            <FormField label="Sexe">
              <select value={formulaire.sexe} onChange={e => champ('sexe', e.target.value)}
                style={selectStyle}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </FormField>
            <FormField label="Date de naissance">
              <input type="date" value={formulaire.date_naissance}
                onChange={e => champ('date_naissance', e.target.value)} style={inputStyle} />
            </FormField>
            <FormField label="Lieu de naissance">
              <input value={formulaire.lieu_naissance}
                onChange={e => champ('lieu_naissance', e.target.value)}
                placeholder="ex: Antananarivo" style={inputStyle} />
            </FormField>
            <FormField label="Contact (téléphone)">
              <input value={formulaire.contact} onChange={e => champ('contact', e.target.value)}
                placeholder="ex: 034 00 000 00" style={inputStyle} />
            </FormField>
            <FormField label="Nationalité">
              <input value={formulaire.nationalite}
                onChange={e => champ('nationalite', e.target.value)} style={inputStyle} />
            </FormField>
            <FormField label="Adresse">
              <input value={formulaire.adresse} onChange={e => champ('adresse', e.target.value)}
                placeholder="Adresse complète" style={inputStyle} />
            </FormField>
          </div>

          {/* Section académique */}
          <div style={{ background:'#fef9f0', borderRadius:'8px', padding:'12px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#92400e', fontWeight:'600' }}>
            🎓 Informations académiques
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Matricule" required>
              <input value={formulaire.matricule}
                onChange={e => champ('matricule', e.target.value)}
                placeholder="ex: INF2025001" style={inputStyle} />
            </FormField>
            <FormField label="Filière">
              <select value={formulaire.filiere} onChange={e => champ('filiere', e.target.value)}
                style={selectStyle}>
                <option value="">— Choisir une filière —</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </FormField>
            <FormField label="Niveau">
              <select value={formulaire.niveau} onChange={e => champ('niveau', e.target.value)}
                style={selectStyle}>
                {['L1','L2','L3','M1','M2'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </FormField>
            <FormField label="Année scolaire">
              <select value={formulaire.annee_scolaire}
                onChange={e => champ('annee_scolaire', e.target.value)} style={selectStyle}>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </FormField>
            <FormField label="Série Baccalauréat">
              <select value={formulaire.serie_bacc}
                onChange={e => champ('serie_bacc', e.target.value)} style={selectStyle}>
                <option value="">— Choisir —</option>
                {['A','C','D','E','F','G','OSE','TI'].map(s =>
                  <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Année Baccalauréat">
              <input type="number" value={formulaire.annee_bacc}
                onChange={e => champ('annee_bacc', e.target.value)}
                placeholder="ex: 2024" min="2000" max="2030" style={inputStyle} />
            </FormField>
          </div>

          {/* Erreur */}
          {erreurForm && (
            <div style={{ background:'#fee2e2', borderRadius:'8px', padding:'12px',
              color:'#991b1b', fontSize:'13px', marginBottom:'12px', border:'1px solid #fecaca' }}>
              ❌ {erreurForm}
            </div>
          )}

          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'8px' }}>
            <Bouton variante="light" onClick={() => { setModalOuvert(false); setErreurForm(''); }}>
              Annuler
            </Bouton>
            <Bouton type="submit" disabled={sauvegarde}>
              {sauvegarde ? '⏳ Création en cours...' : '✅ Créer l\'étudiant'}
            </Bouton>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Etudiants;
