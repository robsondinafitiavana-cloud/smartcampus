import React, { useState, useEffect, useRef } from 'react';
import Layout    from '../../components/layout/Layout';
import Card      from '../../components/common/Card';
import Bouton    from '../../components/common/Bouton';
import Modal     from '../../components/common/Modal';
import FormField, { inputStyle } from '../../components/common/FormField';
import { devoirsAPI, coursAPI, enseignantsAPI, etudiantsAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

const VERT    = '#059669';
const VERT_BG = '#ecfdf5';

const selectStyle = {
  width:'100%', padding:'10px 14px', border:'1.5px solid #e7e5e4',
  borderRadius:'10px', fontSize:'14px', background:'#fafaf9', outline:'none',
};

const Pill = ({ bg, color, children }) => (
  <span style={{ fontSize:'11px', padding:'2px 9px', borderRadius:'20px',
    fontWeight:'600', background:bg, color, display:'inline-block' }}>
    {children}
  </span>
);

// ══════════════════════════════════════════════
//  KANBAN
// ══════════════════════════════════════════════
const TabKanban = ({ onSelectDevoir }) => {
  const [kanban,  setKanban]  = useState(null);
  const [loading, setLoading] = useState(true);

  const charger = () => {
    setLoading(true);
    devoirsAPI.kanban().then(r => { setKanban(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { charger(); }, []);

  const COLS = [
    { key:'todo',       label:'À faire',   couleur:'#78716c', fond:'#fafaf9' },
    { key:'inprogress', label:'En cours',  couleur:'#1d4ed8', fond:'#eff6ff' },
    { key:'done',       label:'Terminé',   couleur:'#15803d', fond:'#f0fdf4' },
    { key:'late',       label:'En retard', couleur:'#b91c1c', fond:'#fef2f2' },
  ];

  if (loading) return <div style={{ textAlign:'center', padding:'40px', color:'#a8a29e' }}>Chargement…</div>;

  const stats = kanban?.stats || {};
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
        {[
          { label:'À faire',   val: stats.a_faire  ||0, color:'#78716c' },
          { label:'En cours',  val: stats.en_cours ||0, color:'#1d4ed8' },
          { label:'Terminés',  val: stats.termines ||0, color:VERT },
          { label:'En retard', val: stats.en_retard||0, color:'#b91c1c' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'1px solid #e7e5e4',
            borderRadius:'10px', padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:'22px', fontWeight:'700', color:s.color }}>{s.val}</div>
            <div style={{ fontSize:'11px', color:'#a8a29e', marginTop:'2px' }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
        {COLS.map(col => {
          const devoirs = kanban?.colonnes?.[col.key] || [];
          return (
            <div key={col.key} style={{ background:col.fond, borderRadius:'10px',
              padding:'10px', minHeight:'150px', border:`1px solid ${col.couleur}22` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                <span style={{ fontSize:'12px', fontWeight:'700', color:col.couleur }}>
                  {col.label}
                </span>
                <span style={{ fontSize:'11px', background:'#fff', border:'1px solid #e7e5e4',
                  borderRadius:'10px', padding:'1px 7px', color:'#78716c' }}>
                  {devoirs.length}
                </span>
              </div>
              {devoirs.map(d => (
                <div key={d.id} onClick={() => onSelectDevoir(d)}
                  style={{ background:'#fff', border:'1px solid #e7e5e4', borderRadius:'8px',
                    padding:'10px', marginBottom:'6px', cursor:'pointer' }}>
                  <div style={{ fontWeight:'600', fontSize:'13px', marginBottom:'3px' }}>{d.titre}</div>
                  <div style={{ fontSize:'11px', color:'#a8a29e', marginBottom:'5px' }}>{d.cours_code}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'11px', color: d.est_en_retard?'#b91c1c':'#78716c' }}>
                      📅 {new Date(d.date_limite).toLocaleDateString('fr-FR')}
                    </span>
                    <Pill bg={ d.type_devoir==='groupe'?'#d1fae5': d.type_devoir==='examen'?'#fef3c7':'#dbeafe' }
                      color={ d.type_devoir==='groupe'?'#065f46': d.type_devoir==='examen'?'#92400e':'#1e40af' }>
                      {d.type_devoir}
                    </Pill>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
//  CRÉER DEVOIR (avec upload PDF sujet)
// ══════════════════════════════════════════════
const TabCreerDevoir = ({ onCreer }) => {
  const [form, setForm]       = useState({
    cours:'', enseignant:'', titre:'', consignes:'',
    type_devoir:'individuel', date_limite:'', note_max:20,
    detection_plagiat:true, creation_groupes_auto:false, taille_groupe_max:4,
  });
  const [cours,       setCours]       = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [fichierSujet, setFichierSujet] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [erreur,  setErreur]    = useState('');
  const fichierRef = useRef();

  useEffect(() => {
    coursAPI.getListe().then(r => setCours(r.data.results||r.data));
    enseignantsAPI.getListe().then(r => setEnseignants(r.data.results||r.data));
  }, []);

  const champ = k => e => setForm(f => ({
    ...f, [k]: e.target.type==='checkbox' ? e.target.checked : e.target.value
  }));

  const handleCreer = async e => {
    e.preventDefault();
    if (!form.titre || !form.cours || !form.date_limite) {
      return setErreur('Titre, cours et date limite sont requis');
    }
    setLoading(true); setErreur('');
    try {
      // Utiliser FormData si fichier sujet
      let data;
      if (fichierSujet) {
        data = new FormData();
        Object.entries(form).forEach(([k,v]) => data.append(k, v));
        data.append('fichier_sujet', fichierSujet);
        await devoirsAPI.creerAvecFichier(data);
      } else {
        await devoirsAPI.creer(form);
      }
      alert('✅ Devoir créé !');
      onCreer && onCreer();
    } catch(err) {
      setErreur(JSON.stringify(err.response?.data || 'Erreur'));
    }
    setLoading(false);
  };

  return (
    <Card titre="✚ Nouveau devoir">
      <form onSubmit={handleCreer}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <FormField label="Titre *">
            <input value={form.titre} onChange={champ('titre')}
              placeholder="Ex: Projet Django REST" style={inputStyle} required />
          </FormField>
          <FormField label="Type">
            <select value={form.type_devoir} onChange={champ('type_devoir')} style={selectStyle}>
              <option value="individuel">Individuel</option>
              <option value="groupe">Travail de groupe</option>
              <option value="examen">Examen</option>
            </select>
          </FormField>
          <FormField label="Cours *">
            <select value={form.cours} onChange={champ('cours')} style={selectStyle} required>
              <option value="">— Sélectionner —</option>
              {cours.map(c => <option key={c.id} value={c.id}>{c.intitule}</option>)}
            </select>
          </FormField>
          <FormField label="Enseignant *">
            <select value={form.enseignant} onChange={champ('enseignant')} style={selectStyle} required>
              <option value="">— Sélectionner —</option>
              {enseignants.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
            </select>
          </FormField>
          <FormField label="Date limite *">
            <input type="datetime-local" value={form.date_limite}
              onChange={champ('date_limite')} style={inputStyle} required />
          </FormField>
          <FormField label="Note max">
            <input type="number" value={form.note_max} onChange={champ('note_max')}
              min={0} max={100} style={inputStyle} />
          </FormField>
        </div>

        <FormField label="Consignes">
          <textarea value={form.consignes} onChange={champ('consignes')}
            placeholder="Décrivez les consignes…"
            style={{ ...inputStyle, height:'70px', resize:'vertical' }} />
        </FormField>

        {/* Upload sujet PDF */}
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px',
          padding:'12px', marginBottom:'12px' }}>
          <div style={{ fontSize:'13px', fontWeight:'600', color:'#1e40af', marginBottom:'8px' }}>
            📎 Sujet / Document PDF (optionnel)
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <Bouton variante="light" petit onClick={() => fichierRef.current?.click()}>
              {fichierSujet ? `📄 ${fichierSujet.name}` : 'Choisir un PDF'}
            </Bouton>
            {fichierSujet && (
              <Bouton variante="light" petit onClick={() => setFichierSujet(null)}>✕</Bouton>
            )}
            <input ref={fichierRef} type="file" accept=".pdf"
              style={{ display:'none' }} onChange={e => setFichierSujet(e.target.files[0])} />
            <span style={{ fontSize:'11px', color:'#a8a29e' }}>PDF uniquement</span>
          </div>
        </div>

        <div style={{ display:'flex', gap:'20px', flexWrap:'wrap', marginBottom:'14px' }}>
          <label style={{ fontSize:'13px', display:'flex', alignItems:'center', gap:'7px', cursor:'pointer' }}>
            <input type="checkbox" checked={form.detection_plagiat} onChange={champ('detection_plagiat')} />
            Détection plagiat auto
          </label>
          {form.type_devoir === 'groupe' && (
            <>
              <label style={{ fontSize:'13px', display:'flex', alignItems:'center', gap:'7px', cursor:'pointer' }}>
                <input type="checkbox" checked={form.creation_groupes_auto} onChange={champ('creation_groupes_auto')} />
                Créer groupes automatiquement
              </label>
              <label style={{ fontSize:'13px', display:'flex', alignItems:'center', gap:'7px' }}>
                Taille max :
                <input type="number" value={form.taille_groupe_max} onChange={champ('taille_groupe_max')}
                  min={2} max={10} style={{ ...inputStyle, width:'60px' }} />
              </label>
            </>
          )}
        </div>

        {erreur && (
          <div style={{ background:'#fee2e2', borderRadius:'8px', padding:'10px',
            color:'#991b1b', fontSize:'13px', marginBottom:'12px' }}>❌ {erreur}</div>
        )}
        <Bouton type="submit" disabled={loading}>
          {loading ? '⏳ Création…' : '✚ Créer le devoir'}
        </Bouton>
      </form>
    </Card>
  );
};

// ══════════════════════════════════════════════
//  GESTION GROUPES (prof)
// ══════════════════════════════════════════════
const TabGroupes = ({ devoirSelectionne, estEnseignant, estAdmin }) => {
  const [groupes,     setGroupes]     = useState([]);
  const [etudiants,   setEtudiants]   = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [modalGroupe, setModalGroupe] = useState(false);
  const [chatOuvert,  setChatOuvert]  = useState(null);
  const [formGroupe,  setFormGroupe]  = useState({ nom:'', membres_ids:[] });
  const [devoirs,     setDevoirs]     = useState([]);
  const [devoirId,    setDevoirId]    = useState(devoirSelectionne?.id || '');

  useEffect(() => {
    devoirsAPI.getListe().then(r => setDevoirs(r.data.results||r.data));
    etudiantsAPI.getListe().then(r => setEtudiants(r.data.results||r.data));
  }, []);

  useEffect(() => {
    if (devoirId) chargerGroupes();
  }, [devoirId]); // eslint-disable-line

  const chargerGroupes = () => {
    setLoading(true);
    devoirsAPI.getGroupes({ devoir_id: devoirId })
      .then(r => { setGroupes(r.data.results||r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const creerGroupe = async () => {
    if (!formGroupe.nom || !devoirId) return alert('Nom et devoir requis');
    try {
      await devoirsAPI.creerGroupe({ ...formGroupe, devoir: devoirId });
      setModalGroupe(false);
      setFormGroupe({ nom:'', membres_ids:[] });
      chargerGroupes();
    } catch(e) { alert('Erreur : ' + JSON.stringify(e.response?.data)); }
  };

  const toggleMembre = (id) => {
    setFormGroupe(f => ({
      ...f,
      membres_ids: f.membres_ids.includes(id)
        ? f.membres_ids.filter(x => x !== id)
        : [...f.membres_ids, id]
    }));
  };

  if (chatOuvert) {
    return <MiniChat groupe={chatOuvert} onRetour={() => { setChatOuvert(null); chargerGroupes(); }} />;
  }

  return (
    <div>
      {/* Sélecteur devoir */}
      <div style={{ display:'flex', gap:'12px', marginBottom:'16px', alignItems:'center', flexWrap:'wrap' }}>
        <select value={devoirId} onChange={e => setDevoirId(e.target.value)} style={{ ...selectStyle, width:'300px' }}>
          <option value="">— Sélectionner un devoir —</option>
          {devoirs.filter(d => d.type_devoir === 'groupe').map(d => (
            <option key={d.id} value={d.id}>{d.titre}</option>
          ))}
        </select>
        {(estEnseignant || estAdmin) && devoirId && (
          <Bouton onClick={() => setModalGroupe(true)}>➕ Créer un groupe</Bouton>
        )}
        {(estEnseignant || estAdmin) && devoirId && (
          <Bouton variante="light" onClick={async () => {
            try {
              await devoirsAPI.creerGroupesAuto(devoirId);
              chargerGroupes();
              alert('✅ Groupes créés automatiquement !');
            } catch(e) { alert('Erreur'); }
          }}>🤖 Groupes auto</Bouton>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'30px', color:'#a8a29e' }}>Chargement…</div>
      ) : groupes.length === 0 && devoirId ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#a8a29e', background:'#fafaf9',
          borderRadius:'10px', border:'1px solid #e7e5e4' }}>
          Aucun groupe créé pour ce devoir.<br/>
          <span style={{ fontSize:'12px' }}>Créez manuellement ou utilisez "Groupes auto"</span>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'14px' }}>
          {groupes.map(g => {
            const membres = g.membres_detail || [];
            return (
              <div key={g.id} style={{ background:'#fff', border:'1px solid #e7e5e4',
                borderRadius:'12px', padding:'14px' }}>
                {/* Header groupe */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <span style={{ fontWeight:'700', fontSize:'14px', color:'#1c1917' }}>
                    👥 {g.nom}
                  </span>
                  <Pill bg={g.est_complet?'#d1fae5':'#fef3c7'} color={g.est_complet?'#065f46':'#92400e'}>
                    {g.nb_membres} membre{g.nb_membres>1?'s':''}
                  </Pill>
                </div>

                {/* Liste membres */}
                <div style={{ marginBottom:'12px' }}>
                  {membres.length === 0 ? (
                    <div style={{ fontSize:'12px', color:'#a8a29e' }}>Aucun membre</div>
                  ) : membres.map((m, i) => {
                    const AVBG  = ['#dbeafe','#d1fae5','#fef3c7','#ede9fe'][i%4];
                    const AVCOL = ['#1e40af','#065f46','#92400e','#4c1d95'][i%4];
                    return (
                      <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'8px',
                        padding:'5px 0', borderBottom:'1px solid #f5f5f4' }}>
                        <div style={{ width:'26px', height:'26px', borderRadius:'50%',
                          background:AVBG, color:AVCOL, display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:'10px', fontWeight:'700', flexShrink:0 }}>
                          {(m.etudiant_nom||'?')[0]}
                        </div>
                        <span style={{ fontSize:'12px', flex:1 }}>{m.etudiant_nom}</span>
                        {/* Barre contribution */}
                        <div style={{ width:'50px', height:'4px', background:'#f5f5f4',
                          borderRadius:'2px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${m.contribution_pct}%`,
                            background:VERT, borderRadius:'2px' }} />
                        </div>
                        <span style={{ fontSize:'10px', color:'#a8a29e', minWidth:'28px' }}>
                          {m.contribution_pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:'8px' }}>
                  <Bouton petit onClick={() => setChatOuvert(g)}>
                    💬 Chat du groupe
                  </Bouton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal créer groupe */}
      <Modal titre="➕ Créer un groupe" visible={modalGroupe}
        onClose={() => setModalGroupe(false)} largeur="500px">
        <FormField label="Nom du groupe">
          <input value={formGroupe.nom} onChange={e => setFormGroupe(f=>({...f,nom:e.target.value}))}
            placeholder="Ex: Groupe Alpha" style={inputStyle} />
        </FormField>
        <FormField label="Membres (sélectionner)">
          <div style={{ maxHeight:'200px', overflowY:'auto', border:'1px solid #e7e5e4',
            borderRadius:'8px', padding:'8px' }}>
            {etudiants.map(et => (
              <label key={et.id} style={{ display:'flex', alignItems:'center', gap:'8px',
                padding:'5px', cursor:'pointer', borderBottom:'1px solid #f5f5f4' }}>
                <input type="checkbox"
                  checked={formGroupe.membres_ids.includes(et.id)}
                  onChange={() => toggleMembre(et.id)} />
                <span style={{ fontSize:'13px' }}>{et.nom} {et.prenom}</span>
                <span style={{ fontSize:'11px', color:'#a8a29e' }}>{et.matricule}</span>
              </label>
            ))}
          </div>
        </FormField>
        <div style={{ marginTop:'8px', fontSize:'12px', color:'#a8a29e', marginBottom:'12px' }}>
          {formGroupe.membres_ids.length} membre(s) sélectionné(s)
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <Bouton onClick={creerGroupe}>✅ Créer</Bouton>
          <Bouton variante="light" onClick={() => setModalGroupe(false)}>Annuler</Bouton>
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════
//  MINI CHAT PAR GROUPE
// ══════════════════════════════════════════════
const MiniChat = ({ groupe, onRetour }) => {
  const { utilisateur } = useAuth();
  const [messages,  setMessages]  = useState([]);
  const [fichiers,  setFichiers]  = useState([]);
  const [contenu,   setContenu]   = useState('');
  const [onglet,    setOnglet]    = useState('chat');
  const [envoi,     setEnvoi]     = useState(false);
  const [loading,   setLoading]   = useState(true);
  const bottomRef = useRef();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      devoirsAPI.getMessages(groupe.id),
      devoirsAPI.getFichiers(groupe.id),
    ]).then(([m, f]) => {
      setMessages(m.data.results||m.data);
      setFichiers(f.data.results||f.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [groupe.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const envoyer = async () => {
    if (!contenu.trim() || envoi) return;
    setEnvoi(true);
    try {
      const r = await devoirsAPI.envoyerMessage(groupe.id, contenu.trim());
      setMessages(p => [...p, r.data]);
      setContenu('');
    } catch(e) { alert('Erreur envoi message'); }
    setEnvoi(false);
  };

  const partagerFichier = async e => {
    const f = e.target.files[0]; if (!f) return;
    if (!f.name.endsWith('.pdf') && !f.type.includes('pdf')) {
      return alert('Seuls les fichiers PDF sont acceptés');
    }
    const form = new FormData(); form.append('fichier', f);
    try {
      const r = await devoirsAPI.partagerFichier(groupe.id, form);
      setFichiers(p => [...p, r.data]);
      alert('✅ Fichier partagé !');
    } catch { alert('Erreur partage'); }
  };

  const AVBG  = ['#dbeafe','#d1fae5','#fef3c7','#ede9fe'];
  const AVCOL = ['#1e40af','#065f46','#92400e','#4c1d95'];
  const membres = groupe.membres_detail || [];

  const getAv = (nom, idx) => ({
    bg: AVBG[idx%4], color: AVCOL[idx%4],
    init: (nom||'?').split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
        <Bouton variante="light" petit onClick={onRetour}>← Retour</Bouton>
        <h3 style={{ margin:0, fontSize:'15px', fontWeight:'700' }}>
          💬 {groupe.nom}
        </h3>
        <Pill bg='#d1fae5' color='#065f46'>{groupe.nb_membres} membres</Pill>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'14px' }}>
        {/* Zone chat principale */}
        <div style={{ border:'1px solid #e7e5e4', borderRadius:'12px', overflow:'hidden' }}>
          {/* Onglets */}
          <div style={{ display:'flex', borderBottom:'1px solid #e7e5e4', background:'#fafaf9' }}>
            {[
              { key:'chat',     label:'💬 Messages' },
              { key:'fichiers', label:`📎 Fichiers (${fichiers.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setOnglet(t.key)} style={{
                padding:'9px 14px', fontSize:'12px', background:'none', border:'none',
                borderBottom: onglet===t.key ? `2px solid ${VERT}` : '2px solid transparent',
                color: onglet===t.key ? VERT : '#78716c',
                fontWeight: onglet===t.key ? '700' : '500', cursor:'pointer',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Messages */}
          {onglet === 'chat' && (
            <>
              <div style={{ height:'380px', overflowY:'auto', padding:'12px', background:'#fafaf9' }}>
                {loading ? (
                  <div style={{ textAlign:'center', color:'#a8a29e', padding:'30px' }}>Chargement…</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign:'center', color:'#d6d3d1', padding:'40px', fontSize:'13px' }}>
                    Aucun message — commencez la conversation !
                  </div>
                ) : messages.map((msg, i) => {
                  const estMoi = msg.auteur === utilisateur?.profil_id;
                  const mi = membres.findIndex(m => m.etudiant === msg.auteur);
                  const av = getAv(msg.auteur_nom, mi >= 0 ? mi : i);
                  return (
                    <div key={msg.id} style={{ display:'flex', gap:'8px', marginBottom:'10px',
                      flexDirection: estMoi ? 'row-reverse' : 'row' }}>
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%',
                        background:av.bg, color:av.color, display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:'10px', fontWeight:'700', flexShrink:0 }}>
                        {av.init}
                      </div>
                      <div style={{ maxWidth:'70%' }}>
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
                        }}>{msg.contenu}</div>
                        <div style={{ fontSize:'10px', color:'#d6d3d1', marginTop:'2px',
                          textAlign: estMoi ? 'right' : 'left' }}>
                          {new Date(msg.date_envoi).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div style={{ display:'flex', gap:'8px', padding:'10px', borderTop:'1px solid #e7e5e4', background:'#fff' }}>
                <input value={contenu} onChange={e => setContenu(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && !e.shiftKey && envoyer()}
                  placeholder="Écrire un message… (Entrée pour envoyer)"
                  style={{ ...inputStyle, flex:1, borderRadius:'20px' }} />
                <Bouton onClick={envoyer} disabled={envoi||!contenu.trim()} petit>
                  Envoyer
                </Bouton>
              </div>
            </>
          )}

          {/* Fichiers PDF */}
          {onglet === 'fichiers' && (
            <div style={{ padding:'12px', height:'420px', overflowY:'auto' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'8px',
                padding:'9px 14px', background:VERT_BG, border:`1px dashed ${VERT}`,
                borderRadius:'8px', cursor:'pointer', fontSize:'13px', color:VERT,
                marginBottom:'12px', fontWeight:'600' }}>
                📎 Partager un PDF
                <input type="file" accept=".pdf" style={{ display:'none' }} onChange={partagerFichier} />
              </label>
              {fichiers.length === 0 ? (
                <div style={{ color:'#d6d3d1', textAlign:'center', padding:'30px', fontSize:'13px' }}>
                  Aucun fichier partagé
                </div>
              ) : fichiers.map(f => (
                <div key={f.id} style={{ display:'flex', alignItems:'center', gap:'10px',
                  padding:'8px', border:'1px solid #e7e5e4', borderRadius:'8px', marginBottom:'6px' }}>
                  <span style={{ fontSize:'22px' }}>📄</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'13px', fontWeight:'600' }}>{f.nom_fichier}</div>
                    <div style={{ fontSize:'11px', color:'#a8a29e' }}>
                      {f.taille_ko} Ko · {new Date(f.date_depot).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <a href={f.fichier} target="_blank" rel="noreferrer"
                    style={{ fontSize:'12px', color:VERT, fontWeight:'600', textDecoration:'none' }}>
                    ↓ PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panneau membres */}
        <div style={{ border:'1px solid #e7e5e4', borderRadius:'12px', overflow:'hidden' }}>
          <div style={{ background:'linear-gradient(135deg,#064e3b,#047857)',
            padding:'10px 14px', color:'#fff', fontSize:'13px', fontWeight:'700' }}>
            👥 Membres du groupe
          </div>
          <div style={{ padding:'10px', maxHeight:'440px', overflowY:'auto' }}>
            {membres.map((m, i) => {
              const av = getAv(m.etudiant_nom, i);
              return (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'8px',
                  padding:'8px 0', borderBottom:'1px solid #f5f5f4' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'50%',
                    background:av.bg, color:av.color, display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:'11px', fontWeight:'700', flexShrink:0 }}>
                    {av.init}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'12px', fontWeight:'600' }}>{m.etudiant_nom}</div>
                    <div style={{ fontSize:'10px', color:'#a8a29e' }}>{m.etudiant_matricule}</div>
                  </div>
                </div>
              );
            })}
            {membres.length === 0 && (
              <div style={{ color:'#a8a29e', fontSize:'12px', textAlign:'center', padding:'20px' }}>
                Aucun membre
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════
//  SOUMETTRE DEVOIR (étudiant — upload PDF)
// ══════════════════════════════════════════════
const TabSoumettre = () => {
  const [devoirs,   setDevoirs]   = useState([]);
  const [groupes,   setGroupes]   = useState([]);
  const [devoirId,  setDevoirId]  = useState('');
  const [groupeId,  setGroupeId]  = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [fichier,   setFichier]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [succes,    setSucces]    = useState(false);
  const [mesSoumissions, setMesSoumissions] = useState([]);
  const fichierRef = useRef();

  useEffect(() => {
    devoirsAPI.getListe({ statut:'publie' }).then(r => setDevoirs(r.data.results||r.data));
    devoirsAPI.mesSoumissions().then(r => setMesSoumissions(r.data.soumissions||[])).catch(()=>{});
  }, []);

  useEffect(() => {
    if (devoirId) {
      const d = devoirs.find(x => String(x.id) === String(devoirId));
      if (d?.type_devoir === 'groupe') {
        devoirsAPI.mesGroupes().then(r => {
          const gs = (r.data.results||r.data).filter(g => String(g.devoir) === String(devoirId));
          setGroupes(gs);
        });
      } else setGroupes([]);
    }
  }, [devoirId]); // eslint-disable-line

  const handleSoumettre = async e => {
    e.preventDefault();
    if (!devoirId) return alert('Sélectionnez un devoir');
    if (!fichier)  return alert('Veuillez joindre votre PDF');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('devoir_id', devoirId);
      form.append('commentaire', commentaire);
      form.append('fichiers', fichier);
      if (groupeId) form.append('groupe_travail_id', groupeId);
      await devoirsAPI.soumettre(form);
      setSucces(true);
      setFichier(null); setCommentaire(''); setDevoirId(''); setGroupeId('');
      devoirsAPI.mesSoumissions().then(r => setMesSoumissions(r.data.soumissions||[])).catch(()=>{});
    } catch(e) { alert('Erreur : ' + JSON.stringify(e.response?.data||e.message)); }
    setLoading(false);
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
      {/* Formulaire soumission */}
      <Card titre="📤 Remettre un devoir">
        {succes && (
          <div style={{ background:'#d1fae5', border:'1px solid #a7f3d0', borderRadius:'8px',
            padding:'12px', marginBottom:'14px', color:'#065f46', fontWeight:'600', fontSize:'13px' }}>
            ✅ Devoir remis avec succès !
            <Bouton variante="light" petit onClick={() => setSucces(false)} style={{ marginLeft:'10px' }}>
              Remettre un autre
            </Bouton>
          </div>
        )}
        <form onSubmit={handleSoumettre}>
          <FormField label="Devoir *">
            <select value={devoirId} onChange={e => setDevoirId(e.target.value)} style={selectStyle} required>
              <option value="">— Sélectionner —</option>
              {devoirs.map(d => (
                <option key={d.id} value={d.id}>
                  {d.titre} ({d.type_devoir}) — {new Date(d.date_limite).toLocaleDateString('fr-FR')}
                </option>
              ))}
            </select>
          </FormField>

          {groupes.length > 0 && (
            <FormField label="Groupe de travail">
              <select value={groupeId} onChange={e => setGroupeId(e.target.value)} style={selectStyle}>
                <option value="">— Mon groupe —</option>
                {groupes.map(g => <option key={g.id} value={g.id}>{g.nom}</option>)}
              </select>
            </FormField>
          )}

          <FormField label="Commentaire (optionnel)">
            <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
              placeholder="Notes sur votre travail…"
              style={{ ...inputStyle, height:'60px', resize:'none' }} />
          </FormField>

          {/* Upload PDF obligatoire */}
          <div style={{ background:'#f0fdf4', border:'1px solid #a7f3d0', borderRadius:'8px',
            padding:'12px', marginBottom:'14px' }}>
            <div style={{ fontSize:'13px', fontWeight:'600', color:'#065f46', marginBottom:'8px' }}>
              📄 Fichier PDF de votre travail *
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <Bouton variante="light" petit onClick={() => fichierRef.current?.click()}>
                {fichier ? `✅ ${fichier.name}` : '📎 Choisir le PDF'}
              </Bouton>
              {fichier && (
                <Bouton variante="light" petit onClick={() => setFichier(null)}>✕</Bouton>
              )}
              <input ref={fichierRef} type="file" accept=".pdf"
                style={{ display:'none' }} onChange={e => setFichier(e.target.files[0])} />
            </div>
            {fichier && (
              <div style={{ fontSize:'11px', color:'#a8a29e', marginTop:'4px' }}>
                {(fichier.size/1024).toFixed(0)} Ko
              </div>
            )}
          </div>

          <Bouton type="submit" disabled={loading || !fichier}>
            {loading ? '⏳ Envoi…' : '📤 Remettre le devoir'}
          </Bouton>
        </form>
      </Card>

      {/* Mes soumissions */}
      <Card titre="📋 Mes soumissions">
        {mesSoumissions.length === 0 ? (
          <div style={{ color:'#a8a29e', textAlign:'center', padding:'30px', fontSize:'13px' }}>
            Aucune soumission
          </div>
        ) : mesSoumissions.map(s => (
          <div key={s.id} style={{ border:'1px solid #e7e5e4', borderRadius:'8px',
            padding:'10px', marginBottom:'8px' }}>
            <div style={{ fontWeight:'600', fontSize:'13px', marginBottom:'4px' }}>
              {s.devoir_titre || `Devoir #${s.devoir}`}
            </div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              <Pill bg={s.est_soumis?'#d1fae5':'#fef3c7'} color={s.est_soumis?'#065f46':'#92400e'}>
                {s.est_soumis ? '✅ Soumis' : '⏳ Brouillon'}
              </Pill>
              {s.est_en_retard && <Pill bg='#fee2e2' color='#991b1b'>En retard</Pill>}
              {s.note_obtenue != null && (
                <Pill bg='#dbeafe' color='#1e40af'>Note : {s.note_obtenue}/20</Pill>
              )}
            </div>
            {s.commentaire_correction && (
              <div style={{ fontSize:'12px', color:'#78716c', marginTop:'6px',
                background:'#fafaf9', borderRadius:'6px', padding:'6px 8px' }}>
                💬 {s.commentaire_correction}
              </div>
            )}
            {s.pieces_jointes?.length > 0 && (
              <div style={{ marginTop:'6px' }}>
                {s.pieces_jointes.map(pj => (
                  <a key={pj.id} href={pj.fichier} target="_blank" rel="noreferrer"
                    style={{ fontSize:'11px', color:VERT, textDecoration:'none', marginRight:'8px' }}>
                    📄 {pj.nom_fichier}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════
//  CORRECTIONS (prof)
// ══════════════════════════════════════════════
const TabCorrections = ({ devoirSelectionne }) => {
  const [soumissions, setSoumissions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [devoirs,     setDevoirs]     = useState([]);
  const [devoirId,    setDevoirId]    = useState(devoirSelectionne?.id||'');
  const [notes,       setNotes]       = useState({});
  const [comments,    setComments]    = useState({});

  useEffect(() => {
    devoirsAPI.getListe().then(r => setDevoirs(r.data.results||r.data));
  }, []);

  useEffect(() => {
    if (devoirId) {
      setLoading(true);
      devoirsAPI.getSoumissions({ devoir_id: devoirId })
        .then(r => { setSoumissions(r.data.results||r.data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [devoirId]);

  const corriger = async id => {
    try {
      await devoirsAPI.corriger(id, { note_obtenue: notes[id], commentaire_correction: comments[id]||'' });
      setSoumissions(p => p.map(s => s.id===id ? { ...s, note_obtenue:notes[id], commentaire_correction:comments[id] } : s));
      alert('✅ Correction enregistrée !');
    } catch(e) { alert('Erreur'); }
  };

  return (
    <div>
      <div style={{ marginBottom:'14px' }}>
        <select value={devoirId} onChange={e => setDevoirId(e.target.value)} style={{ ...selectStyle, width:'350px' }}>
          <option value="">— Sélectionner un devoir à corriger —</option>
          {devoirs.map(d => <option key={d.id} value={d.id}>{d.titre}</option>)}
        </select>
      </div>

      {!devoirId ? (
        <div style={{ textAlign:'center', padding:'40px', color:'#a8a29e' }}>
          Sélectionnez un devoir pour voir les soumissions
        </div>
      ) : loading ? (
        <div style={{ textAlign:'center', padding:'30px', color:'#a8a29e' }}>Chargement…</div>
      ) : soumissions.length === 0 ? (
        <div style={{ textAlign:'center', padding:'30px', color:'#a8a29e' }}>
          Aucune soumission reçue
        </div>
      ) : soumissions.map(s => (
        <div key={s.id} style={{ border:'1px solid #e7e5e4', borderRadius:'10px',
          padding:'14px', marginBottom:'10px', background:'#fafaf9' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'30px', height:'30px', borderRadius:'50%',
                background:VERT_BG, color:VERT, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'12px', fontWeight:'700' }}>
                {(s.etudiant_nom||s.groupe_nom||'?')[0]}
              </div>
              <div>
                <div style={{ fontSize:'13px', fontWeight:'600' }}>
                  {s.etudiant_nom||s.groupe_nom||`Soumission #${s.id}`}
                </div>
                <div style={{ display:'flex', gap:'5px', marginTop:'2px' }}>
                  {s.est_en_retard && <Pill bg='#fee2e2' color='#991b1b'>En retard</Pill>}
                  {s.alerte_plagiat && <Pill bg='#fef3c7' color='#92400e'>⚠️ Plagiat {s.pourcentage_plagiat}%</Pill>}
                </div>
              </div>
            </div>
            {s.note_obtenue != null
              ? <span style={{ fontSize:'18px', fontWeight:'700', color:VERT }}>{s.note_obtenue}/20</span>
              : <span style={{ fontSize:'12px', color:'#a8a29e' }}>Non corrigé</span>
            }
          </div>

          {/* Fichiers soumis */}
          {s.pieces_jointes?.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #e7e5e4', borderRadius:'6px',
              padding:'8px', marginBottom:'10px' }}>
              <div style={{ fontSize:'11px', color:'#a8a29e', marginBottom:'4px' }}>Fichiers remis :</div>
              {s.pieces_jointes.map(pj => (
                <a key={pj.id} href={pj.fichier} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px',
                    color:VERT, textDecoration:'none', padding:'3px 0' }}>
                  📄 {pj.nom_fichier}
                  <span style={{ color:'#a8a29e', fontSize:'10px' }}>({pj.taille_ko} Ko)</span>
                </a>
              ))}
            </div>
          )}

          <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
            <div style={{ flex:1 }}>
              <textarea placeholder="Commentaire de correction…"
                value={comments[s.id]||''}
                onChange={e => setComments(p => ({ ...p, [s.id]: e.target.value }))}
                style={{ ...inputStyle, height:'50px', resize:'none', width:'100%', boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
              <input type="number" placeholder="/20" min={0} max={20} step={0.5}
                value={notes[s.id]||''}
                onChange={e => setNotes(p => ({ ...p, [s.id]: e.target.value }))}
                style={{ ...inputStyle, width:'70px' }} />
              <Bouton variante="success" petit disabled={!notes[s.id]}
                onClick={() => corriger(s.id)}>✓ Corriger</Bouton>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════
const TabNotifications = () => {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    devoirsAPI.getNotifications()
      .then(r => { setNotifs(r.data.results||r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const marquerLu = ids => {
    devoirsAPI.marquerLu(ids).then(() =>
      setNotifs(p => p.map(n => ids.includes(n.id) ? {...n, est_lu:true} : n))
    );
  };

  const EMO = {
    nouveau_devoir:'📚', rappel_echeance:'⏰', soumission_recue:'📩',
    devoir_corrige:'✅', alerte_retard:'⚠️', alerte_plagiat:'🔍',
    badge_obtenu:'🏅', message_groupe:'💬',
  };

  if (loading) return <div style={{ color:'#a8a29e', padding:'20px' }}>Chargement…</div>;

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
            <span style={{ fontSize:'18px', flexShrink:0 }}>{EMO[n.type_notif]||'🔔'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:'13px', fontWeight: n.est_lu?'500':'700', color:'#1c1917' }}>
                {n.titre}
              </div>
              <div style={{ fontSize:'12px', color:'#78716c', marginTop:'2px' }}>{n.message}</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:'11px', color:'#a8a29e' }}>
                {new Date(n.date_envoi).toLocaleDateString('fr-FR')}
              </div>
              {!n.est_lu && (
                <button onClick={() => marquerLu([n.id])}
                  style={{ fontSize:'11px', color:VERT, background:'none', border:'none',
                    cursor:'pointer', marginTop:'2px', fontWeight:'600' }}>
                  Lu
                </button>
              )}
            </div>
          </div>
        ))
      }
    </Card>
  );
};

// ══════════════════════════════════════════════
//  PAGE PRINCIPALE
// ══════════════════════════════════════════════
const Devoirs = () => {
  const { role, estAdmin, estEnseignant, estEtudiant } = useAuth();
  const [onglet,            setOnglet]            = useState('kanban');
  const [devoirSelectionne, setDevoirSelectionne] = useState(null);

  const ONGLETS = {
    admin: [
      { key:'kanban',        label:'📋 Tableau'       },
      { key:'groupes',       label:'👥 Groupes'        },
      { key:'corrections',   label:'✏️ Corrections'    },
      { key:'creer',         label:'✚ Créer devoir'   },
      { key:'notifications', label:'🔔 Notifications'  },
    ],
    enseignant: [
      { key:'kanban',        label:'📋 Tableau'       },
      { key:'groupes',       label:'👥 Groupes'        },
      { key:'corrections',   label:'✏️ Corrections'    },
      { key:'creer',         label:'✚ Créer devoir'   },
      { key:'notifications', label:'🔔 Notifications'  },
    ],
    etudiant: [
      { key:'kanban',        label:'📋 Mes devoirs'   },
      { key:'soumettre',     label:'📤 Remettre'       },
      { key:'groupes',       label:'👥 Mes groupes'   },
      { key:'notifications', label:'🔔 Notifications'  },
    ],
  };

  const tabs = ONGLETS[role] || ONGLETS.etudiant;

  return (
    <Layout titre="📚 Devoirs & Travaux de Groupe">
      {/* Barre onglets */}
      <div style={{ display:'flex', borderBottom:'1px solid #e7e5e4',
        background:'#fff', borderRadius:'14px 14px 0 0',
        marginBottom:'0', overflowX:'auto',
        boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
        border:'1px solid #e7e5e4', borderBottomLeftRadius:0, borderBottomRightRadius:0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setOnglet(t.key)} style={{
            padding:'12px 18px', fontSize:'13px',
            background:'none', border:'none',
            borderBottom: onglet===t.key ? `2px solid ${VERT}` : '2px solid transparent',
            color: onglet===t.key ? VERT : '#78716c',
            fontWeight: onglet===t.key ? '700' : '500',
            cursor:'pointer', whiteSpace:'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding:'20px 0 0' }}>
        {onglet === 'kanban' && (
          <TabKanban onSelectDevoir={d => {
            setDevoirSelectionne(d);
            if (estEnseignant||estAdmin) setOnglet('corrections');
          }} />
        )}
        {onglet === 'creer'       && (estAdmin||estEnseignant) && <TabCreerDevoir onCreer={() => setOnglet('kanban')} />}
        {onglet === 'groupes'     && <TabGroupes devoirSelectionne={devoirSelectionne} estEnseignant={estEnseignant} estAdmin={estAdmin} />}
        {onglet === 'corrections' && (estAdmin||estEnseignant) && <TabCorrections devoirSelectionne={devoirSelectionne} />}
        {onglet === 'soumettre'   && estEtudiant && <TabSoumettre />}
        {onglet === 'notifications' && <TabNotifications />}
      </div>
    </Layout>
  );
};

export default Devoirs;
