import React, { useState, useEffect, useRef } from 'react';
import Layout    from '../../components/layout/Layout';
import Table     from '../../components/common/Table';
import Modal     from '../../components/common/Modal';
import Badge     from '../../components/common/Badge';
import Bouton    from '../../components/common/Bouton';
import Card      from '../../components/common/Card';
import FormField, { inputStyle } from '../../components/common/FormField';
import { etudiantsAPI, referenceAPI } from '../../api/services';
import { couleurStatut, formatDate }  from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const selectStyle = {
  width:'100%', padding:'10px 14px', border:'1.5px solid #e7e5e4',
  borderRadius:'10px', fontSize:'14px', background:'#fafaf9', outline:'none',
};

// ── Génération du badge PDF côté client ──────
const genererBadgePDF = async (badge) => {
  const { jsPDF } = await import('jspdf');
  const QRCode = await import('qrcode');

  // Générer QR code en base64
  const qrDataUrl = await QRCode.toDataURL(badge.matricule, {
    width: 120, margin: 1,
    color: { dark: '#064e3b', light: '#ffffff' }
  });

  // Format carte bancaire : 85.6 x 54 mm
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });

  // ── Fond vert foncé header ──
  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, 85.6, 16, 'F');

  // ── Titre ──
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SMARTCAMPUS', 42.8, 7, { align: 'center' });
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Carte Étudiant', 42.8, 12, { align: 'center' });

  // ── Fond blanc corps ──
  doc.setFillColor(240, 253, 244);
  doc.rect(0, 16, 85.6, 38, 'F');

  // ── Photo ou placeholder ──
  if (badge.photo_url) {
    try {
      doc.addImage(badge.photo_url, 'JPEG', 3, 19, 16, 18);
    } catch(e) {
      doc.setFillColor(209, 250, 229);
      doc.roundedRect(3, 19, 16, 18, 2, 2, 'F');
      doc.setTextColor(6, 78, 59);
      doc.setFontSize(16);
      doc.text('👤', 5, 31);
    }
  } else {
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(3, 19, 16, 18, 2, 2, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text('PHOTO', 11, 29, { align: 'center' });
  }

  // ── Nom étudiant ──
  doc.setTextColor(6, 78, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const nomComplet = `${badge.nom} ${badge.prenom}`;
  doc.text(nomComplet.substring(0, 22), 22, 23);

  // ── Infos ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  const infos = [
    ['Matricule', badge.matricule],
    ['Filière',   badge.filiere || '—'],
    ['Niveau',    badge.niveau],
    ['Année',     badge.annee_scolaire],
  ];
  infos.forEach(([label, val], i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label, 22, 29 + i * 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(val), 40, 29 + i * 5);
  });

  // ── QR Code ──
  doc.addImage(qrDataUrl, 'PNG', 65, 19, 18, 18);

  // ── Ligne séparatrice bas ──
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.3);
  doc.line(3, 50, 82.6, 50);

  // ── Texte bas ──
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5);
  doc.text('Université SmartCampus — Document officiel', 42.8, 53, { align: 'center' });

  // ── Bordure ──
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.5);
  doc.roundedRect(0.5, 0.5, 84.6, 53, 2, 2, 'S');

  doc.save(`badge_${badge.matricule}.pdf`);
};

const Etudiants = () => {
  const { estAdmin } = useAuth();

  const [etudiants,     setEtudiants]     = useState([]);
  const [filieres,      setFilieres]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [recherche,     setRecherche]     = useState('');
  const [filtreFiliere, setFiltreFiliere] = useState('');
  const [filtreNiveau,  setFiltreNiveau]  = useState('');
  const [modalOuvert,   setModalOuvert]   = useState(false);
  const [modalProfil,   setModalProfil]   = useState(false);
  const [modalModifier, setModalModifier] = useState(false);
  const [modalBadge,    setModalBadge]    = useState(false);
  const [etudiantActif, setEtudiantActif] = useState(null);
  const [profil,        setProfil]        = useState({});
  const [badge,         setBadge]         = useState(null);
  const [badgeLoading,  setBadgeLoading]  = useState(false);
  const [erreurForm,    setErreurForm]    = useState('');
  const [sauvegarde,    setSauvegarde]    = useState(false);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const photoRef = useRef();

  const [formulaire, setFormulaire] = useState({
    email:'', mot_de_passe:'', nom:'', prenom:'', sexe:'M',
    date_naissance:'', lieu_naissance:'', nationalite:'Malagasy',
    adresse:'', contact:'', matricule:'', filiere:'',
    niveau:'L1', annee_scolaire:'2025-2026', serie_bacc:'', annee_bacc:'', statut:'actif',
  });

  const [formModif, setFormModif] = useState({
    nom:'', prenom:'', sexe:'M', contact:'', adresse:'',
    lieu_naissance:'', nationalite:'Malagasy', filiere:'',
    niveau:'L1', statut:'actif', serie_bacc:'', annee_bacc:'',
  });

  const champ     = (key, val) => setFormulaire(f => ({...f, [key]:val}));
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

  // ── Ouvrir modal badge ───────────────────────
  const voirBadge = async (etudiant) => {
    setEtudiantActif(etudiant);
    setModalBadge(true);
    setBadgeLoading(true);
    setBadge(null);
    try {
      const res = await etudiantsAPI.getBadge(etudiant.id);
      setBadge(res.data);
    } catch(e) {
      setBadge(null);
    }
    setBadgeLoading(false);
  };

  // ── Télécharger le badge en PDF ──────────────
  const telechargerBadge = async () => {
    if (!badge) return;
    try {
      await genererBadgePDF(badge);
    } catch(e) {
      alert('Erreur génération PDF : ' + e.message);
    }
  };

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
    setPhotoPreview(etudiant.photo || null);
    setModalProfil(false);
    setModalModifier(true);
  };

  // ── Changer la photo de profil ───────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErreurForm('La photo ne doit pas dépasser 2 Mo');
      return;
    }
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleModifier = async (e) => {
    e.preventDefault();
    setSauvegarde(true); setErreurForm('');
    try {
      // Si une nouvelle photo a été sélectionnée
      const fichierPhoto = photoRef.current?.files?.[0];
      if (fichierPhoto) {
        const formData = new FormData();
        Object.entries(formModif).forEach(([k,v]) => { if(v) formData.append(k, v); });
        formData.append('photo', fichierPhoto);
        await etudiantsAPI.uploadPhoto(etudiantActif.id, formData);
      } else {
        await etudiantsAPI.modifier(etudiantActif.id, formModif);
      }
      setModalModifier(false);
      setPhotoPreview(null);
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
      } else { setErreurForm('Erreur lors de la création'); }
    } finally { setSauvegarde(false); }
  };

  const colonnes = [
    { key:'matricule',   label:'Matricule' },
    { key:'photo', label:'Photo', render:(v,r) => (
      v
        ? <img src={v} alt="" style={{ width:32,height:32,borderRadius:'50%',objectFit:'cover',border:'2px solid #d1fae5' }} />
        : <div style={{ width:32,height:32,borderRadius:'50%',background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>👤</div>
    )},
    { key:'nom',         label:'Nom complet', render:(v,r)=>`${r.nom} ${r.prenom}` },
    { key:'filiere_nom', label:'Filière' },
    { key:'niveau',      label:'Niveau' },
    { key:'contact',     label:'Contact' },
    { key:'statut',      label:'Statut', render: v => <Badge type={couleurStatut(v)}>{v}</Badge> },
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
              <Bouton variante="ghost" petit onClick={() => voirBadge(row)}>🪪 Badge</Bouton>
              {estAdmin && (
                <Bouton variante="light" petit onClick={() => ouvrirModification(row)}>✏️</Bouton>
              )}
            </div>
          )}
        />
      </Card>

      {/* ══ Modal Badge ══ */}
      <Modal titre="🪪 Badge Étudiant" visible={modalBadge}
        onClose={() => { setModalBadge(false); setBadge(null); }} largeur="420px">
        {badgeLoading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#a8a29e' }}>
            Chargement du badge…
          </div>
        ) : badge ? (
          <div>
            {/* Aperçu carte badge */}
            <div style={{
              background:'linear-gradient(135deg,#064e3b,#047857)',
              borderRadius:'14px', padding:'0', overflow:'hidden',
              boxShadow:'0 8px 24px rgba(6,78,59,0.3)', marginBottom:'16px',
              width:'340px', height:'214px', margin:'0 auto 16px', position:'relative',
            }}>
              {/* Header */}
              <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid rgba(255,255,255,0.15)' }}>
                <div style={{ color:'#fff', fontWeight:'800', fontSize:'14px', letterSpacing:'1px' }}>
                  SMARTCAMPUS
                </div>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'10px' }}>Carte Étudiant</div>
              </div>
              {/* Corps */}
              <div style={{ display:'flex', gap:'14px', padding:'12px 16px', alignItems:'flex-start' }}>
                {/* Photo */}
                <div style={{ width:'60px', height:'60px', borderRadius:'50%',
                  border:'2px solid rgba(255,255,255,0.5)', overflow:'hidden',
                  background:'rgba(255,255,255,0.1)', flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {badge.photo_url
                    ? <img src={badge.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ fontSize:'24px' }}>👤</span>
                  }
                </div>
                {/* Infos */}
                <div style={{ flex:1 }}>
                  <div style={{ color:'#fff', fontWeight:'700', fontSize:'15px', marginBottom:'6px' }}>
                    {badge.nom} {badge.prenom}
                  </div>
                  {[
                    ['Matricule', badge.matricule],
                    ['Filière',   badge.filiere || '—'],
                    ['Niveau',    badge.niveau],
                    ['Année',     badge.annee_scolaire],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:'flex', gap:'6px', marginBottom:'2px' }}>
                      <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'10px', minWidth:'52px' }}>{label}</span>
                      <span style={{ color:'#fff', fontSize:'11px', fontWeight:'600' }}>{val}</span>
                    </div>
                  ))}
                </div>
                {/* QR Code */}
                {badge.qr_code && (
                  <div style={{ width:'50px', height:'50px', background:'#fff',
                    borderRadius:'6px', padding:'3px', flexShrink:0 }}>
                    <img src={`data:image/png;base64,${badge.qr_code}`}
                      alt="QR" style={{ width:'100%', height:'100%' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Bouton télécharger */}
            <div style={{ display:'flex', justifyContent:'center' }}>
              <Bouton variante="primary" onClick={telechargerBadge}>
                📥 Télécharger en PDF
              </Bouton>
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center', color:'#ef4444', padding:'30px' }}>
            Impossible de charger le badge.
          </div>
        )}
      </Modal>

      {/* ══ Modal Profil ══ */}
      <Modal titre={`📋 ${etudiantActif?.nom} ${etudiantActif?.prenom}`}
        visible={modalProfil} onClose={() => setModalProfil(false)} largeur="560px">
        {etudiantActif && (
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            {/* Photo + infos */}
            <div style={{ display:'flex', gap:'16px', alignItems:'center',
              background:'#f8fafc', borderRadius:'10px', padding:'16px' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'50%',
                border:'3px solid #d1fae5', overflow:'hidden', flexShrink:0,
                background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {etudiantActif.photo
                  ? <img src={etudiantActif.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:'28px' }}>👤</span>
                }
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', flex:1 }}>
                {[
                  ['Matricule',   etudiantActif.matricule],
                  ['Filière',     etudiantActif.filiere_nom],
                  ['Niveau',      etudiantActif.niveau],
                  ['Statut',      etudiantActif.statut],
                  ['Contact',     etudiantActif.contact],
                  ['Inscription', formatDate(etudiantActif.date_inscription)],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize:'11px', color:'#9ca3af', textTransform:'uppercase', marginBottom:'2px' }}>{label}</div>
                    <div style={{ fontWeight:'600', color:'#1f2937', fontSize:'13px' }}>{val || '—'}</div>
                  </div>
                ))}
              </div>
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

            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <Bouton variante="ghost" onClick={() => { setModalProfil(false); voirBadge(etudiantActif); }}>
                🪪 Voir badge
              </Bouton>
              {estAdmin && (
                <Bouton variante="primary" onClick={() => ouvrirModification(etudiantActif)}>
                  ✏️ Modifier
                </Bouton>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ══ Modal Modifier ══ */}
      <Modal titre={`✏️ Modifier — ${etudiantActif?.nom} ${etudiantActif?.prenom}`}
        visible={modalModifier} onClose={() => { setModalModifier(false); setPhotoPreview(null); }} largeur="640px">
        <form onSubmit={handleModifier}>

          {/* ── Photo de profil ── */}
          <div style={{ background:'#f0fdf4', borderRadius:'10px', padding:'14px 16px',
            marginBottom:'16px', display:'flex', alignItems:'center', gap:'16px' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'50%',
              border:'3px solid #6ee7b7', overflow:'hidden', flexShrink:0,
              background:'#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer' }} onClick={() => photoRef.current?.click()}>
              {photoPreview
                ? <img src={photoPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <span style={{ fontSize:'28px' }}>👤</span>
              }
            </div>
            <div>
              <div style={{ fontWeight:'600', fontSize:'13px', color:'#065f46', marginBottom:'6px' }}>
                📸 Photo de profil
              </div>
              <Bouton variante="light" petit onClick={() => photoRef.current?.click()}>
                {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
              </Bouton>
              <input ref={photoRef} type="file" accept="image/*"
                style={{ display:'none' }} onChange={handlePhotoChange} />
              <div style={{ fontSize:'11px', color:'#a8a29e', marginTop:'4px' }}>
                JPG, PNG — max 2 Mo
              </div>
            </div>
          </div>

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
              <input value={formModif.nom} onChange={e=>champModif('nom',e.target.value)} style={inputStyle} />
            </FormField>
            <FormField label="Prénom" required>
              <input value={formModif.prenom} onChange={e=>champModif('prenom',e.target.value)} style={inputStyle} />
            </FormField>
            <FormField label="Sexe">
              <select value={formModif.sexe} onChange={e=>champModif('sexe',e.target.value)} style={selectStyle}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </FormField>
            <FormField label="Contact">
              <input value={formModif.contact} onChange={e=>champModif('contact',e.target.value)}
                placeholder="034 XX XXX XX" style={inputStyle} />
            </FormField>
            <FormField label="Lieu de naissance">
              <input value={formModif.lieu_naissance} onChange={e=>champModif('lieu_naissance',e.target.value)} style={inputStyle} />
            </FormField>
            <FormField label="Nationalité">
              <input value={formModif.nationalite} onChange={e=>champModif('nationalite',e.target.value)} style={inputStyle} />
            </FormField>
          </div>
          <FormField label="Adresse">
            <input value={formModif.adresse} onChange={e=>champModif('adresse',e.target.value)} style={inputStyle} />
          </FormField>

          <div style={{ background:'#fef9f0', borderRadius:'8px', padding:'10px 14px',
            marginBottom:'16px', fontSize:'13px', color:'#92400e', fontWeight:'600' }}>
            🎓 Informations académiques
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Filière">
              <select value={formModif.filiere} onChange={e=>champModif('filiere',e.target.value)} style={selectStyle}>
                <option value="">— Choisir —</option>
                {filieres.map(f=><option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </FormField>
            <FormField label="Niveau">
              <select value={formModif.niveau} onChange={e=>champModif('niveau',e.target.value)} style={selectStyle}>
                {['L1','L2','L3','M1','M2'].map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </FormField>
            <FormField label="Statut">
              <select value={formModif.statut} onChange={e=>champModif('statut',e.target.value)} style={selectStyle}>
                <option value="actif">Actif</option>
                <option value="suspendu">Suspendu</option>
                <option value="diplome">Diplômé</option>
                <option value="abandonne">Abandonné</option>
              </select>
            </FormField>
            <FormField label="Série Bac">
              <select value={formModif.serie_bacc} onChange={e=>champModif('serie_bacc',e.target.value)} style={selectStyle}>
                <option value="">—</option>
                {['A','C','D','E','F','G','OSE','TI'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </div>

          {erreurForm && (
            <div style={{ background:'#fee2e2', borderRadius:'8px', padding:'10px',
              color:'#991b1b', fontSize:'13px', marginBottom:'12px' }}>❌ {erreurForm}</div>
          )}
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <Bouton variante="light" onClick={() => { setModalModifier(false); setPhotoPreview(null); }}>Annuler</Bouton>
            <Bouton type="submit" variante="primary" disabled={sauvegarde}>
              {sauvegarde ? '⏳ Sauvegarde...' : '✅ Enregistrer'}
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
              {sauvegarde ? '⏳ Création...' : "✅ Créer l'étudiant"}
            </Bouton>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Etudiants;
