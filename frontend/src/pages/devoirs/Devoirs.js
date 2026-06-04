import React, { useState, useEffect, useRef } from 'react';
import Layout    from '../../components/layout/Layout';
import Card      from '../../components/common/Card';
import Bouton    from '../../components/common/Bouton';
import Modal     from '../../components/common/Modal';
import StatCard  from '../../components/common/StatCard';
import FormField, { inputStyle } from '../../components/common/FormField';
import { devoirsAPI, coursAPI, enseignantsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

// ─── Couleurs thème projet ───────────────────
const VERT    = '#059669';
const VERT_BG = '#ecfdf5';

// ─── Types devoirs ───────────────────────────
const TYPE_BADGE = {
  individuel: { bg:'#dbeafe', color:'#1e40af', label:'Individuel' },
  groupe:     { bg:'#d1fae5', color:'#065f46', label:'Groupe'     },
  examen:     { bg:'#fef3c7', color:'#92400e', label:'Examen'     },
};

const STATUT_BADGE = {
  brouillon: { bg:'#f5f5f4', color:'#78716c', label:'Brouillon' },
  publie:    { bg:'#d1fae5', color:'#065f46', label:'Publié'    },
  clos:      { bg:'#fee2e2', color:'#991b1b', label:'Clôturé'   },
};

const KANBAN_COLS = [
  { key:'todo',       label:'À faire',   couleur:'#78716c', fond:'#fafaf9' },
  { key:'inprogress', label:'En cours',  couleur:'#1d4ed8', fond:'#eff6ff' },
  { key:'done',       label:'Terminé',   couleur:'#15803d', fond:'#f0fdf4' },
  { key:'late',       label:'En retard', couleur:'#b91c1c', fond:'#fef2f2' },
];

// ─── Petits composants réutilisables ─────────
const Pill = ({ bg, color, children }) => (
  <span style={{ fontSize:'11px', padding:'2px 9px', borderRadius:'20px',
    fontWeight:'600', background:bg, color, display:'inline-block' }}>
    {children}
  </span>
);

const SectionTitre = ({ children, actions }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
    marginBottom:'14px' }}>
    <h3 style={{ fontSize:'15px', fontWeight:'700', color:'#1c1917', margin:0 }}>
      {children}
    </h3>
    {actions}
  </div>
);

// ─── Carte Kanban ─────────────────────────────
const CarteDevoir = ({ devoir, onClick }) => {
  const type   = TYPE_BADGE[devoir.type_devoir]   || TYPE_BADGE.individuel;
  const date   = new Date(devoir.date_limite);
  const diff   = Math.ceil((date - Date.now()) / 86400000);
  const retard = devoir.est_en_retard;
  return (
    <div onClick={() => onClick(devoir)} style={{
      background:'#fff', border:'1px solid #e7e5e4', borderRadius:'10px',
      padding:'12px', marginBottom:'8px', cursor:'pointer',
      transition:'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
    >
      <div style={{ fontWeight:'600', fontSize:'13px', color:'#1c1917', marginBottom:'3px' }}>
        {devoir.titre}
      </div>
      <div style={{ fontSize:'11px', color:'#a8a29e', marginBottom:'8px' }}>
        {devoir.cours_code} · {devoir.cours_nom}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:'11px', color: retard ? '#b91c1c' : '#78716c' }}>
          📅 {retard ? 'En retard' : diff === 0 ? "Auj." : diff > 0 ? `J-${diff}` : date.toLocaleDateString('fr-FR')}
        </span>
        <Pill bg={type.bg} color={type.color}>{type.label}</Pill>
      </div>
      {devoir.nb_soumissions > 0 && (
        <div style={{ height:'3px', background:'#f5f5f4', borderRadius:'2px',
          marginTop:'8px', overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:'2px',
            background: retard ? '#ef4444' : VERT,
            width:`${Math.min(100, devoir.nb_soumissions * 5)}%` }} />
        </div>
      )}
    </div>
  );
};

// ─── Tableau Kanban ───────────────────────────
const TabKanban = ({ role, onSelectDevoir }) => {
  const [kanban,  setKanban]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    devoirsAPI.kanban().then(r => { setKanban(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color:'#a8a29e', padding:'30px', textAlign:'center' }}>Chargement…</div>;
  if (!kanban) return null;

  const stats = kanban.stats || {};
  return (
    <div>
      {/* Stats */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
        <StatCard icone="📋" label="À faire"   valeur={stats.a_faire   || 0} couleur='#78716c' />
        <StatCard icone="⚡" label="En cours"  valeur={stats.en_cours  || 0} couleur='#1d4ed8' />
        <StatCard icone="✅" label="Terminés"  valeur={stats.termines  || 0} couleur={VERT}    />
        <StatCard icone="⚠️" label="En retard" valeur={stats.en_retard || 0} couleur='#ef4444' />
      </div>
      {/* Colonnes */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
        {KANBAN_COLS.map(col => {
          const devoirs = kanban.colonnes?.[col.key] || [];
          return (
            <div key={col.key} style={{
              background: col.fond, borderRadius:'12px',
              padding:'10px', minHeight:'200px',
              border:`1px solid ${col.couleur}22`,
            }}>
              <div style={{ display:'flex', alignItems:'center',
                justifyContent:'space-between', marginBottom:'10px' }}>
                <span style={{ fontSize:'12px', fontWeight:'700', color:col.couleur,
                  display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ width:'8px', height:'8px', borderRadius:'50%',
                    background:col.couleur, display:'inline-block' }} />
                  {col.label}
                </span>
                <span style={{ fontSize:'11px', background:'#fff',
                  border:'1px solid #e7e5e4', borderRadius:'10px',
                  padding:'1px 7px', color:'#78716c' }}>{devoirs.length}</span>
              </div>
              {devoirs.length === 0
                ? <div style={{ color:'#d6d3d1', fontSize:'12px', textAlign:'center', paddingTop:'20px' }}>—</div>
                : devoirs.map(d => <CarteDevoir key={d.id} devoir={d} onClick={onSelectDevoir} />)
              }
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Formulaire création devoir ───────────────
const TabCreerDevoir = ({ onCreer }) => {
  const [form, setForm] = useState({
    cours:'', enseignant:'', titre:'', consignes:'',
    type_devoir:'individuel', date_limite:'', note_max:20,
    coefficient:1, detection_plagiat:true,
    creation_groupes_auto:false, taille_groupe_max:4,
  });
  const [cours,       setCours]       = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [erreur,      setErreur]      = useState('');

  useEffect(() => {
    coursAPI.getListe().then(r => setCours(r.data.results || r.data));
    enseignantsAPI.getListe().then(r => setEnseignants(r.data.results || r.data));
  }, []);

  const champ = k => e => setForm(f => ({
    ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }));

  const handleCreer = async e => {
    e.preventDefault();
    setLoading(true); setErreur('');
    try {
      await devoirsAPI.creer(form);
      alert('✅ Devoir créé avec succès !');
      setForm({ cours:'', enseignant:'', titre:'', consignes:'',
        type_devoir:'individuel', date_limite:'', note_max:20,
        coefficient:1, detection_plagiat:true,
        creation_groupes_auto:false, taille_groupe_max:4 });
      onCreer && onCreer();
    } catch(err) {
      setErreur(JSON.stringify(err.response?.data || 'Erreur'));
    }
    setLoading(false);
  };

  const sel = { ...inputStyle, padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:'8px' };

  return (
    <Card titre="✚ Nouveau devoir">
      <form onSubmit={handleCreer}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <FormField label="Titre du devoir" required>
            <input value={form.titre} onChange={champ('titre')}
              placeholder="Ex: Projet Django REST API" style={inputStyle} required />
          </FormField>
          <FormField label="Type">
            <select value={form.type_devoir} onChange={champ('type_devoir')} style={sel}>
              <option value="individuel">Individuel</option>
              <option value="groupe">Travail de groupe</option>
              <option value="examen">Examen</option>
            </select>
          </FormField>
          <FormField label="Cours" required>
            <select value={form.cours} onChange={champ('cours')} style={sel} required>
              <option value="">— Sélectionner —</option>
              {cours.map(c => <option key={c.id} value={c.id}>{c.intitule}</option>)}
            </select>
          </FormField>
          <FormField label="Enseignant" required>
            <select value={form.enseignant} onChange={champ('enseignant')} style={sel} required>
              <option value="">— Sélectionner —</option>
              {enseignants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
            </select>
          </FormField>
          <FormField label="Date limite" required>
            <input type="datetime-local" value={form.date_limite}
              onChange={champ('date_limite')} style={inputStyle} required />
          </FormField>
          <FormField label="Note max">
            <input type="number" value={form.note_max} onChange={champ('note_max')}
              min={0} max={100} style={inputStyle} />
          </FormField>
        </div>

        <FormField label="Consignes / Description">
          <textarea value={form.consignes} onChange={champ('consignes')}
            placeholder="Décrivez les consignes détaillées…"
            style={{ ...inputStyle, height:'80px', resize:'vertical' }} />
        </FormField>

        <div style={{ display:'flex', gap:'24px', flexWrap:'wrap', marginTop:'4px' }}>
          <label style={{ fontSize:'13px', display:'flex', alignItems:'center', gap:'7px', cursor:'pointer' }}>
            <input type="checkbox" checked={form.detection_plagiat} onChange={champ('detection_plagiat')} />
            Détection plagiat automatique
          </label>
          {form.type_devoir === 'groupe' && (
            <>
              <label style={{ fontSize:'13px', display:'flex', alignItems:'center', gap:'7px', cursor:'pointer' }}>
                <input type="checkbox" checked={form.creation_groupes_auto} onChange={champ('creation_groupes_auto')} />
                Créer les groupes automatiquement
              </label>
              <label style={{ fontSize:'13px', display:'flex', alignItems:'center', gap:'7px' }}>
                Taille max groupe :
                <input type="number" value={form.taille_groupe_max} onChange={champ('taille_groupe_max')}
                  min={2} max={10} style={{ ...inputStyle, width:'60px', display:'inline' }} />
              </label>
            </>
          )}
        </div>

        {erreur && (
          <div style={{ marginTop:'12px', padding:'10px 14px', background:'#fee2e2',
            color:'#991b1b', borderRadius:'8px', fontSize:'13px' }}>{erreur}</div>
        )}

        <div style={{ marginTop:'16px', display:'flex', gap:'10px' }}>
          <Bouton type="submit" disabled={loading}>
            {loading ? 'Création…' : '✚ Créer le devoir'}
          </Bouton>
        </div>
      </form>
    </Card>
  );
};

// ─── Panneau corrections ──────────────────────
const TabCorrections = ({ devoirSelectionne }) => {
  const [soumissions, setSoumissions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [notes,       setNotes]       = useState({});
  const [comments,    setComments]    = useState({});

  useEffect(() => {
    if (!devoirSelectionne) return;
    setLoading(true);
    devoirsAPI.getSoumissions({ devoir_id: devoirSelectionne.id })
      .then(r => { setSoumissions(r.data.results || r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [devoirSelectionne]);

  const corriger = async id => {
    try {
      await devoirsAPI.corriger(id, { note_obtenue: notes[id], commentaire_correction: comments[id] || '' });
      setSoumissions(prev => prev.map(s => s.id === id
        ? { ...s, note_obtenue: notes[id], commentaire_correction: comments[id] } : s));
      alert('✅ Correction enregistrée !');
    } catch(e) { alert('Erreur : ' + (e.response?.data?.detail || e.message)); }
  };

  const lancerPlagiat = async id => {
    try {
      const r = await devoirsAPI.lancerPlagiat(id);
      setSoumissions(prev => prev.map(s => s.id === id
        ? { ...s, pourcentage_plagiat: r.data.pourcentage_plagiat, alerte_plagiat: r.data.alerte } : s));
    } catch(e) { alert('Erreur plagiat'); }
  };

  if (!devoirSelectionne)
    return <div style={{ color:'#a8a29e', textAlign:'center', padding:'40px', fontSize:'14px' }}>
      Cliquez sur un devoir dans le tableau pour corriger les soumissions.
    </div>;

  if (loading) return <div style={{ color:'#a8a29e', padding:'20px', textAlign:'center' }}>Chargement…</div>;

  return (
    <Card titre={`✏️ Corrections — ${devoirSelectionne.titre}`}
      badge={<Pill bg='#dbeafe' color='#1e40af'>{soumissions.length} soumissions</Pill>}>
      {soumissions.length === 0
        ? <div style={{ color:'#a8a29e', textAlign:'center', padding:'30px' }}>Aucune soumission reçue</div>
        : soumissions.map(s => (
          <div key={s.id} style={{ border:'1px solid #e7e5e4', borderRadius:'10px',
            padding:'14px', marginBottom:'12px', background:'#fafaf9' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%',
                  background:VERT_BG, color:VERT, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:'13px', fontWeight:'700', flexShrink:0 }}>
                  {(s.etudiant_nom || s.groupe_nom || '?')[0]}
                </div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#1c1917' }}>
                    {s.etudiant_nom || s.groupe_nom || `Soumission #${s.id}`}
                  </div>
                  <div style={{ display:'flex', gap:'6px', marginTop:'2px' }}>
                    {s.est_en_retard && <Pill bg='#fee2e2' color='#991b1b'>En retard</Pill>}
                    {s.alerte_plagiat && <Pill bg='#fef3c7' color='#92400e'>⚠️ Plagiat {s.pourcentage_plagiat}%</Pill>}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                {s.pourcentage_plagiat === 0
                  ? <Bouton variante="light" petit onClick={() => lancerPlagiat(s.id)}>🔍 Analyser</Bouton>
                  : <span style={{ fontSize:'12px', fontWeight:'600',
                      color: s.alerte_plagiat ? '#b91c1c' : s.pourcentage_plagiat > 25 ? '#92400e' : '#15803d' }}>
                      Similarité : {s.pourcentage_plagiat}%
                    </span>
                }
                {s.note_obtenue != null
                  ? <span style={{ fontSize:'17px', fontWeight:'700', color:VERT }}>{s.note_obtenue}/20</span>
                  : <span style={{ fontSize:'12px', color:'#a8a29e' }}>Non corrigé</span>
                }
              </div>
            </div>

            {s.commentaire_correction && (
              <div style={{ fontSize:'12px', color:'#57534e', background:'#fff',
                border:'1px solid #e7e5e4', borderRadius:'8px',
                padding:'8px 12px', marginBottom:'10px', lineHeight:'1.5' }}>
                {s.commentaire_correction}
              </div>
            )}

            <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
              <div style={{ flex:1 }}>
                <textarea placeholder="Commentaire de correction…"
                  value={comments[s.id] || ''}
                  onChange={e => setComments(p => ({ ...p, [s.id]: e.target.value }))}
                  style={{ ...inputStyle, height:'55px', resize:'none', width:'100%', boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                <input type="number" placeholder="/20" min={0} max={20} step={0.5}
                  value={notes[s.id] || ''}
                  onChange={e => setNotes(p => ({ ...p, [s.id]: e.target.value }))}
                  style={{ ...inputStyle, width:'70px' }} />
                <Bouton variante="success" petit disabled={!notes[s.id]}
                  onClick={() => corriger(s.id)}>✓ Sauver</Bouton>
              </div>
            </div>
          </div>
        ))
      }
    </Card>
  );
};

// ─── Détection plagiat ────────────────────────
const TabPlagiat = ({ devoirSelectionne }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!devoirSelectionne) return;
    setLoading(true);
    devoirsAPI.plagiatGlobal(devoirSelectionne.id)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [devoirSelectionne]);

  if (!devoirSelectionne)
    return <div style={{ color:'#a8a29e', textAlign:'center', padding:'40px', fontSize:'14px' }}>
      Sélectionnez un devoir dans le tableau.
    </div>;

  if (loading) return <div style={{ color:'#a8a29e', padding:'20px', textAlign:'center' }}>Analyse…</div>;

  const resultats = data?.resultats || [];
  return (
    <Card titre={`🔍 Plagiat — ${devoirSelectionne.titre}`}
      badge={data?.nb_alertes > 0
        ? <Pill bg='#fee2e2' color='#991b1b'>{data.nb_alertes} alerte(s)</Pill>
        : <Pill bg='#d1fae5' color='#065f46'>Aucune alerte</Pill>}>
      {resultats.map(r => (
        <div key={r.soumission_id} style={{ display:'flex', alignItems:'center',
          gap:'12px', padding:'9px 0', borderBottom:'1px solid #f5f5f4' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'50%',
            background:VERT_BG, color:VERT, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'11px', fontWeight:'700', flexShrink:0 }}>
            {r.etudiant_nom[0]}
          </div>
          <span style={{ fontSize:'13px', flex:1 }}>{r.etudiant_nom}</span>
          <div style={{ width:'120px', height:'6px', background:'#f5f5f4',
            borderRadius:'3px', overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:'3px', width:`${r.pourcentage}%`,
              background: r.niveau === 'danger' ? '#ef4444'
                        : r.niveau === 'warn'   ? '#f59e0b' : VERT }} />
          </div>
          <span style={{ fontSize:'12px', fontWeight:'700', minWidth:'36px', textAlign:'right',
            color: r.niveau === 'danger' ? '#b91c1c'
                 : r.niveau === 'warn'   ? '#92400e' : '#15803d' }}>
            {r.pourcentage}%
          </span>
        </div>
      ))}
      <div style={{ display:'flex', gap:'16px', marginTop:'12px', fontSize:'11px', color:'#a8a29e' }}>
        <span>🟢 0–24% : Acceptable</span>
        <span>🟡 25–59% : Suspect</span>
        <span>🔴 60%+ : Plagiat probable</span>
      </div>
    </Card>
  );
};

// ─── Chat groupe ──────────────────────────────
const ChatGroupe = ({ groupeId, onRetour }) => {
  const { utilisateur } = useAuth();
  const [groupe,   setGroupe]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [fichiers, setFichiers] = useState([]);
  const [onglet,   setOnglet]   = useState('chat');
  const [contenu,  setContenu]  = useState('');
  const [envoi,    setEnvoi]    = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([
      devoirsAPI.getGroupe(groupeId),
      devoirsAPI.getMessages(groupeId),
      devoirsAPI.getFichiers(groupeId),
    ]).then(([g, m, f]) => {
      setGroupe(g.data);
      setMessages(m.data.results || m.data);
      setFichiers(f.data.results || f.data);
    });
  }, [groupeId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const envoyer = async () => {
    if (!contenu.trim() || envoi) return;
    setEnvoi(true);
    try {
      const r = await devoirsAPI.envoyerMessage(groupeId, contenu.trim());
      setMessages(p => [...p, r.data]);
      setContenu('');
    } catch(e) { alert('Erreur : ' + e.message); }
    setEnvoi(false);
  };

  const partagerFichier = async e => {
    const f = e.target.files[0]; if (!f) return;
    const form = new FormData(); form.append('fichier', f);
    try {
      const r = await devoirsAPI.partagerFichier(groupeId, form);
      setFichiers(p => [...p, r.data]);
    } catch { alert('Erreur partage fichier'); }
  };

  const COULEURS = ['#dbeafe:#1e40af','#d1fae5:#065f46','#fef3c7:#92400e','#ede9fe:#4c1d95'].map(c => c.split(':'));
  const getAv = (nom, i) => {
    const [bg, color] = COULEURS[i % 4];
    return { bg, color, initiales:(nom||'?').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase() };
  };

  const tabStyle = (key) => ({
    padding:'9px 14px', fontSize:'12px', background:'none', border:'none',
    borderBottom: onglet === key ? `2px solid ${VERT}` : '2px solid transparent',
    color: onglet === key ? VERT : '#78716c',
    fontWeight: onglet === key ? '700' : '500',
    cursor:'pointer',
  });

  if (!groupe) return <div style={{ color:'#a8a29e', padding:'30px', textAlign:'center' }}>Chargement…</div>;
  const membres = groupe.membres_detail || [];

  return (
    <Card noPadding>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#064e3b,#047857)',
        padding:'12px 18px', display:'flex', alignItems:'center', gap:'10px' }}>
        <button onClick={onRetour} style={{ background:'rgba(255,255,255,0.2)',
          border:'none', color:'#fff', borderRadius:'7px', padding:'4px 10px',
          cursor:'pointer', fontSize:'12px' }}>← Retour</button>
        <span style={{ color:'#fff', fontWeight:'700', fontSize:'14px', flex:1 }}>
          👥 {groupe.nom}
        </span>
        <Pill bg='rgba(255,255,255,0.2)' color='#fff'>
          {groupe.nb_membres} membres
        </Pill>
      </div>

      {/* Onglets */}
      <div style={{ display:'flex', borderBottom:'1px solid #e7e5e4' }}>
        <button style={tabStyle('chat')}    onClick={() => setOnglet('chat')}>💬 Chat</button>
        <button style={tabStyle('membres')} onClick={() => setOnglet('membres')}>👥 Membres</button>
        <button style={tabStyle('fichiers')} onClick={() => setOnglet('fichiers')}>📎 Fichiers ({fichiers.length})</button>
      </div>

      {/* Chat */}
      {onglet === 'chat' && (
        <div style={{ display:'flex', flexDirection:'column', height:'420px' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'14px', background:'#fafaf9' }}>
            {messages.length === 0
              ? <div style={{ textAlign:'center', color:'#d6d3d1', fontSize:'13px', marginTop:'40px' }}>
                  Démarrez la conversation !
                </div>
              : messages.map((msg, i) => {
                  const estMoi = msg.auteur === utilisateur?.profil_id;
                  const mi = membres.findIndex(m => m.etudiant === msg.auteur);
                  const av = getAv(msg.auteur_nom, mi >= 0 ? mi : i);
                  return (
                    <div key={msg.id} style={{ display:'flex', gap:'8px', marginBottom:'10px',
                      flexDirection: estMoi ? 'row-reverse' : 'row' }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%',
                        background:av.bg, color:av.color, display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:'10px', fontWeight:'700', flexShrink:0 }}>
                        {av.initiales}
                      </div>
                      <div style={{ maxWidth:'72%' }}>
                        <div style={{ fontSize:'10px', color:'#a8a29e', marginBottom:'2px',
                          textAlign: estMoi ? 'right' : 'left' }}>
                          {estMoi ? 'Moi' : msg.auteur_nom}
                        </div>
                        <div style={{
                          background: estMoi ? 'linear-gradient(135deg,#064e3b,#047857)' : '#fff',
                          color: estMoi ? '#fff' : '#1c1917',
                          border: estMoi ? 'none' : '1px solid #e7e5e4',
                          borderRadius: estMoi ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          padding:'8px 11px', fontSize:'13px', lineHeight:'1.5',
                          boxShadow: estMoi ? '0 2px 8px rgba(6,78,59,0.3)' : 'none',
                        }}>
                          {msg.contenu}
                        </div>
                        <div style={{ fontSize:'10px', color:'#d6d3d1', marginTop:'2px',
                          textAlign: estMoi ? 'right' : 'left' }}>
                          {new Date(msg.date_envoi).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })
            }
            <div ref={bottomRef} />
          </div>
          <div style={{ display:'flex', gap:'8px', padding:'10px 14px',
            borderTop:'1px solid #e7e5e4', background:'#fff' }}>
            <input value={contenu} onChange={e => setContenu(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && envoyer()}
              placeholder="Écrire un message…"
              style={{ ...inputStyle, flex:1, borderRadius:'20px' }} />
            <Bouton onClick={envoyer} disabled={envoi || !contenu.trim()} petit>
              Envoyer
            </Bouton>
          </div>
        </div>
      )}

      {/* Membres */}
      {onglet === 'membres' && (
        <div style={{ padding:'14px', maxHeight:'420px', overflowY:'auto' }}>
          {membres.map((m, i) => {
            const av = getAv(m.etudiant_nom, i);
            return (
              <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'10px',
                padding:'10px 0', borderBottom:'1px solid #f5f5f4' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%',
                  background:av.bg, color:av.color, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:'12px', fontWeight:'700', flexShrink:0 }}>
                  {av.initiales}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#1c1917', marginBottom:'5px' }}>
                    {m.etudiant_nom}
                    {groupe.chef === m.etudiant && (
                      <Pill bg='#fef3c7' color='#92400e' style={{ marginLeft:'7px' }}>Chef</Pill>
                    )}
                  </div>
                  <div style={{ height:'5px', background:'#f5f5f4', borderRadius:'3px', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:'3px', width:`${m.contribution_pct}%`,
                      background: m.contribution_pct > 30 ? VERT : m.contribution_pct > 15 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
                <span style={{ fontSize:'11px', color:'#a8a29e', minWidth:'30px', textAlign:'right' }}>
                  {m.contribution_pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Fichiers */}
      {onglet === 'fichiers' && (
        <div style={{ padding:'14px', maxHeight:'420px', overflowY:'auto' }}>
          <label style={{ display:'flex', alignItems:'center', gap:'8px',
            padding:'9px 14px', background:VERT_BG, border:`1px dashed ${VERT}`,
            borderRadius:'9px', cursor:'pointer', fontSize:'13px', color:VERT,
            marginBottom:'12px', fontWeight:'600' }}>
            📎 Partager un fichier
            <input type="file" style={{ display:'none' }} onChange={partagerFichier} />
          </label>
          {fichiers.length === 0
            ? <div style={{ color:'#d6d3d1', textAlign:'center', padding:'20px', fontSize:'13px' }}>
                Aucun fichier partagé
              </div>
            : fichiers.map(f => (
              <div key={f.id} style={{ display:'flex', alignItems:'center', gap:'10px',
                padding:'8px 0', borderBottom:'1px solid #f5f5f4' }}>
                <span style={{ fontSize:'22px' }}>📄</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'13px', fontWeight:'600' }}>{f.nom_fichier}</div>
                  <div style={{ fontSize:'11px', color:'#a8a29e' }}>
                    {f.taille_ko} Ko · {new Date(f.date_depot).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <a href={f.fichier} download style={{ fontSize:'12px', color:VERT, fontWeight:'600' }}>
                  ↓ Télécharger
                </a>
              </div>
            ))
          }
        </div>
      )}
    </Card>
  );
};

// ─── Groupes de travail (étudiant) ───────────
const TabGroupes = () => {
  const [groupes,      setGroupes]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [groupeOuvert, setGroupeOuvert] = useState(null);

  useEffect(() => {
    devoirsAPI.mesGroupes()
      .then(r => { setGroupes(r.data.results || r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (groupeOuvert)
    return <ChatGroupe groupeId={groupeOuvert} onRetour={() => setGroupeOuvert(null)} />;

  if (loading) return <div style={{ color:'#a8a29e', padding:'20px', textAlign:'center' }}>Chargement…</div>;

  if (groupes.length === 0)
    return <Card><div style={{ color:'#a8a29e', textAlign:'center', padding:'30px', fontSize:'14px' }}>
      Vous n'êtes dans aucun groupe pour l'instant.
    </div></Card>;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'14px' }}>
      {groupes.map(g => {
        const membres = g.membres_detail || [];
        const COULEURS = ['#dbeafe:#1e40af','#d1fae5:#065f46','#fef3c7:#92400e','#ede9fe:#4c1d95'].map(c=>c.split(':'));
        return (
          <Card key={g.id} titre={g.nom}
            badge={<Pill bg={g.est_complet ? '#d1fae5' : '#fef3c7'}
              color={g.est_complet ? '#065f46' : '#92400e'}>
              {g.est_complet ? 'Complet' : `${g.nb_membres} membres`}
            </Pill>}>
            <div style={{ fontSize:'12px', color:'#78716c', marginBottom:'10px' }}>
              📚 {g.devoir_titre}
            </div>
            {membres.slice(0,4).map((m, i) => {
              const [bg, color] = COULEURS[i % 4];
              const initiales = (m.etudiant_nom||'?').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();
              return (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'5px' }}>
                  <div style={{ width:'22px', height:'22px', borderRadius:'50%',
                    background:bg, color, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:'9px', fontWeight:'700', flexShrink:0 }}>
                    {initiales}
                  </div>
                  <span style={{ fontSize:'12px', flex:1 }}>{m.etudiant_nom}</span>
                  <div style={{ width:'50px', height:'4px', background:'#f5f5f4', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${m.contribution_pct}%`, background:VERT, borderRadius:'2px' }} />
                  </div>
                  <span style={{ fontSize:'10px', color:'#a8a29e' }}>{m.contribution_pct}%</span>
                </div>
              );
            })}
            <div style={{ marginTop:'12px' }}>
              <Bouton petit onClick={() => setGroupeOuvert(g.id)}>💬 Ouvrir le chat</Bouton>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// ─── Badges ───────────────────────────────────
const TabBadges = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    devoirsAPI.mesBadges()
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color:'#a8a29e', padding:'20px', textAlign:'center' }}>Chargement…</div>;

  const badges = data?.badges || [];
  const EMO = { excellence:'🏆', ponctualite:'⏰', collaboration:'🤝', integrite:'🛡️', progression:'📈' };
  const FOND = { gold:'#fef3c7', blue:'#dbeafe', green:'#d1fae5', purple:'#ede9fe' };

  return (
    <div>
      <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
        <StatCard icone="🏅" label="Badges obtenus" valeur={data?.nb_obtenus || 0} couleur={VERT} />
        <StatCard icone="🎯" label="Total badges"   valeur={data?.nb_total   || 0} couleur='#78716c' />
        <StatCard icone="⭐" label="Points totaux"  valeur={data?.points_total || 0} couleur='#d97706' />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
        {badges.map(b => (
          <div key={b.code} style={{
            background:'#fff', border:'1px solid #e7e5e4', borderRadius:'12px',
            padding:'16px 12px', textAlign:'center',
            opacity: b.obtenu ? 1 : 0.4,
            filter: b.obtenu ? 'none' : 'grayscale(1)',
            boxShadow: b.obtenu ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
          }}>
            <div style={{ width:'44px', height:'44px', borderRadius:'50%',
              background: FOND[b.couleur] || '#f5f5f4',
              display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 auto 10px', fontSize:'22px' }}>
              {EMO[b.categorie] || '🎖️'}
            </div>
            <div style={{ fontSize:'12px', fontWeight:'700', color:'#1c1917', marginBottom:'4px' }}>
              {b.nom}
            </div>
            <div style={{ fontSize:'11px', color:'#a8a29e', lineHeight:'1.4', marginBottom:'6px' }}>
              {b.description}
            </div>
            {b.obtenu
              ? <Pill bg='#d1fae5' color='#065f46'>+{b.points} pts</Pill>
              : <span style={{ fontSize:'10px', color:'#d6d3d1' }}>🔒 Verrouillé</span>
            }
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Notifications ────────────────────────────
const TabNotifications = () => {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    devoirsAPI.getNotifications()
      .then(r => { setNotifs(r.data.results || r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const marquerLu = ids => {
    devoirsAPI.marquerLu(ids).then(() =>
      setNotifs(p => p.map(n => ids.includes(n.id) ? { ...n, est_lu:true } : n))
    );
  };

  const EMO = {
    nouveau_devoir:'📚', rappel_echeance:'⏰', soumission_recue:'📩',
    devoir_corrige:'✅', alerte_retard:'⚠️', alerte_plagiat:'🔍',
    badge_obtenu:'🏅', message_groupe:'💬',
  };

  if (loading) return <div style={{ color:'#a8a29e', padding:'20px', textAlign:'center' }}>Chargement…</div>;

  const nonLues = notifs.filter(n => !n.est_lu);
  return (
    <Card titre="🔔 Notifications"
      actions={nonLues.length > 0 &&
        <Bouton variante="light" petit onClick={() => marquerLu(nonLues.map(n=>n.id))}>
          Tout marquer lu ({nonLues.length})
        </Bouton>
      }>
      {notifs.length === 0
        ? <div style={{ color:'#a8a29e', textAlign:'center', padding:'30px' }}>Aucune notification</div>
        : notifs.map(n => (
          <div key={n.id} style={{ display:'flex', gap:'10px', padding:'10px 0',
            borderBottom:'1px solid #f5f5f4', opacity: n.est_lu ? 0.55 : 1 }}>
            <span style={{ fontSize:'18px', flexShrink:0 }}>{EMO[n.type_notif] || '🔔'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'13px', fontWeight: n.est_lu ? '500' : '700', color:'#1c1917' }}>
                {n.titre}
              </div>
              <div style={{ fontSize:'12px', color:'#78716c', marginTop:'2px', lineHeight:'1.5' }}>
                {n.message}
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'11px', color:'#a8a29e' }}>
                {new Date(n.date_envoi).toLocaleDateString('fr-FR')}
              </div>
              {!n.est_lu && (
                <button onClick={() => marquerLu([n.id])}
                  style={{ fontSize:'11px', color:VERT, background:'none',
                    border:'none', cursor:'pointer', marginTop:'3px', fontWeight:'600' }}>
                  Marquer lu
                </button>
              )}
            </div>
          </div>
        ))
      }
    </Card>
  );
};

// ─── Calendrier ───────────────────────────────
const TabCalendrier = () => {
  const today = new Date();
  const [evenements, setEvenements] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    devoirsAPI.getCalendrier({ mois: today.getMonth()+1, annee: today.getFullYear() })
      .then(r => { setEvenements(r.data.results || r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line

  const TYPE_CFG = {
    devoir: { color:'#1d4ed8', emoji:'📚' },
    examen: { color:'#b91c1c', emoji:'✍️' },
    rendu:  { color:VERT,      emoji:'📤' },
    conge:  { color:'#78716c', emoji:'🌴' },
  };

  if (loading) return <div style={{ color:'#a8a29e', padding:'20px', textAlign:'center' }}>Chargement…</div>;

  const premier = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const decalage = (premier + 6) % 7;
  const nbJours  = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'20px' }}>
      <Card titre={today.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px' }}>
          {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(j => (
            <div key={j} style={{ textAlign:'center', fontSize:'11px', fontWeight:'700',
              color:'#a8a29e', padding:'4px 0' }}>{j}</div>
          ))}
          {Array.from({length: decalage}).map((_,i) => <div key={`v${i}`} />)}
          {Array.from({length: nbJours}).map((_,i) => {
            const jour = i + 1;
            const estAuj = jour === today.getDate();
            const evts = evenements.filter(e => new Date(e.date_debut).getDate() === jour);
            return (
              <div key={jour} style={{
                minHeight:'36px', borderRadius:'7px', padding:'3px 5px',
                background: estAuj ? 'linear-gradient(135deg,#064e3b,#047857)' : '#fafaf9',
                border:`1px solid ${estAuj ? 'transparent' : '#f5f5f4'}`,
              }}>
                <div style={{ fontSize:'12px', fontWeight: estAuj ? '700' : '400',
                  color: estAuj ? '#fff' : '#1c1917' }}>{jour}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'2px', marginTop:'2px' }}>
                  {evts.map(e => (
                    <div key={e.id} style={{ width:'6px', height:'6px', borderRadius:'50%',
                      background:(TYPE_CFG[e.type_event]||TYPE_CFG.devoir).color }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display:'flex', gap:'14px', marginTop:'12px', flexWrap:'wrap' }}>
          {Object.entries(TYPE_CFG).map(([k,v]) => (
            <span key={k} style={{ fontSize:'11px', color:'#78716c', display:'flex', alignItems:'center', gap:'4px' }}>
              <span style={{ width:'8px', height:'8px', borderRadius:'50%',
                background:v.color, display:'inline-block' }} />
              {k.charAt(0).toUpperCase()+k.slice(1)}
            </span>
          ))}
        </div>
      </Card>

      <Card titre="Événements du mois">
        {evenements.length === 0
          ? <div style={{ color:'#a8a29e', fontSize:'13px' }}>Aucun événement</div>
          : evenements.map(e => {
              const cfg = TYPE_CFG[e.type_event] || TYPE_CFG.devoir;
              return (
                <div key={e.id} style={{ display:'flex', gap:'9px', padding:'8px 0',
                  borderBottom:'1px solid #f5f5f4' }}>
                  <div style={{ width:'32px', height:'32px', borderRadius:'8px',
                    background:cfg.color+'18', display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                    {cfg.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#1c1917' }}>{e.titre}</div>
                    <div style={{ fontSize:'11px', color:'#a8a29e' }}>
                      {new Date(e.date_debut).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                      {e.filiere_nom && ` · ${e.filiere_nom}`}
                    </div>
                  </div>
                </div>
              );
            })
        }
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════
const Devoirs = () => {
  const { role, estAdmin, estEnseignant, estEtudiant } = useAuth();
  const [onglet,            setOnglet]            = useState('kanban');
  const [devoirSelectionne, setDevoirSelectionne] = useState(null);

  // Onglets selon le rôle
  const ONGLETS = {
    admin: [
      { key:'kanban',         label:'📋 Tableau'      },
      { key:'corrections',    label:'✏️ Corrections'   },
      { key:'plagiat',        label:'🔍 Plagiat'        },
      { key:'creer',          label:'✚ Créer devoir'   },
      { key:'calendrier',     label:'📅 Calendrier'    },
      { key:'notifications',  label:'🔔 Notifications' },
    ],
    enseignant: [
      { key:'kanban',         label:'📋 Tableau'      },
      { key:'corrections',    label:'✏️ Corrections'   },
      { key:'plagiat',        label:'🔍 Plagiat'        },
      { key:'creer',          label:'✚ Créer devoir'   },
      { key:'calendrier',     label:'📅 Calendrier'    },
      { key:'notifications',  label:'🔔 Notifications' },
    ],
    etudiant: [
      { key:'kanban',         label:'📋 Mes devoirs'  },
      { key:'groupes',        label:'👥 Mes groupes'  },
      { key:'badges',         label:'🏅 Badges'        },
      { key:'calendrier',     label:'📅 Calendrier'   },
      { key:'notifications',  label:'🔔 Notifications' },
    ],
  };

  const onglets = ONGLETS[role] || ONGLETS.etudiant;

  const selectionnerDevoir = devoir => {
    setDevoirSelectionne(devoir);
    if (estEnseignant || estAdmin) setOnglet('corrections');
  };

  return (
    <Layout titre="📚 Devoirs & Travaux de Groupe">

      {/* Barre d'onglets */}
      <div style={{ display:'flex', borderBottom:'1px solid #e7e5e4',
        background:'#fff', borderRadius:'14px 14px 0 0',
        marginBottom:'0', overflowX:'auto',
        boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
        border:'1px solid #e7e5e4', borderBottomLeftRadius:0, borderBottomRightRadius:0 }}>
        {onglets.map(t => (
          <button key={t.key} onClick={() => setOnglet(t.key)} style={{
            padding:'12px 18px', fontSize:'13px',
            background:'none', border:'none',
            borderBottom: onglet === t.key ? `2px solid ${VERT}` : '2px solid transparent',
            color: onglet === t.key ? VERT : '#78716c',
            fontWeight: onglet === t.key ? '700' : '500',
            cursor:'pointer', whiteSpace:'nowrap',
            transition:'color 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div style={{ padding:'20px 0 0' }}>

        {onglet === 'kanban' && (
          <div>
            <SectionTitre>Tableau de bord des devoirs</SectionTitre>
            <TabKanban role={role} onSelectDevoir={selectionnerDevoir} />
          </div>
        )}

        {onglet === 'creer' && (estAdmin || estEnseignant) && (
          <TabCreerDevoir onCreer={() => setOnglet('kanban')} />
        )}

        {onglet === 'corrections' && (estAdmin || estEnseignant) && (
          <div>
            {devoirSelectionne && (
              <div style={{ marginBottom:'12px' }}>
                <Bouton variante="light" petit onClick={() => setDevoirSelectionne(null)}>
                  ← Changer de devoir
                </Bouton>
              </div>
            )}
            <TabCorrections devoirSelectionne={devoirSelectionne} />
          </div>
        )}

        {onglet === 'plagiat' && (estAdmin || estEnseignant) && (
          <TabPlagiat devoirSelectionne={devoirSelectionne} />
        )}

        {onglet === 'groupes' && estEtudiant && <TabGroupes />}

        {onglet === 'badges' && estEtudiant && <TabBadges />}

        {onglet === 'calendrier' && <TabCalendrier />}

        {onglet === 'notifications' && <TabNotifications />}

      </div>
    </Layout>
  );
};

export default Devoirs;
