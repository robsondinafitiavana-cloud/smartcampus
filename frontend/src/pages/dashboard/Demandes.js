import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Bouton from '../../components/common/Bouton';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import FormField, { inputStyle } from '../../components/common/FormField';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const FILIERE_LABEL  = { INF:'💻 Informatique', GST:'📊 Gestion', DRT:'⚖️ Droit' };
const FILIERE_COULEUR = { INF:'#059669', GST:'#6366f1', DRT:'#dc2626' };

const Demandes = () => {
  const { estAdmin }     = useAuth();
  const navigate         = useNavigate();
  const [demandes,       setDemandes]       = useState([]);
  const [toutes,         setToutes]         = useState([]);  // toutes sans filtre
  const [loading,        setLoading]        = useState(true);
  const [filtreStatut,   setFiltreStatut]   = useState('en_attente');
  const [modalApprouver, setModalApprouver] = useState(false);
  const [modalRefuser,   setModalRefuser]   = useState(false);
  const [demandeActive,  setDemandeActive]  = useState(null);
  const [motifRefus,     setMotifRefus]     = useState('');
  const [traitement,     setTraitement]     = useState(false);
  const [resultatApprobation, setResultatApprobation] = useState(null);

  useEffect(() => {
    if (!estAdmin) { navigate('/dashboard'); return; }
    charger();
  }, []); // eslint-disable-line

  // Charger toutes les demandes une seule fois
  const charger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/demandes/');
      const data = res.data.results || res.data;
      setToutes(data);
      setDemandes(data.filter(d => d.statut === 'en_attente'));
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  // Filtrer côté frontend pour éviter les problèmes de rechargement
  useEffect(() => {
    if (filtreStatut === '') {
      setDemandes(toutes);
    } else {
      setDemandes(toutes.filter(d => d.statut === filtreStatut));
    }
  }, [filtreStatut, toutes]);

  const handleApprouver = async () => {
    setTraitement(true);
    try {
      const res = await api.post(`/demandes/${demandeActive.id}/approuver/`);
      setResultatApprobation(res.data);
      // Recharger toutes les demandes
      await charger();
    } catch(err) {
      alert('Erreur : ' + (err.response?.data?.erreur || 'Erreur serveur'));
      setModalApprouver(false);
    } finally { setTraitement(false); }
  };

  const handleRefuser = async () => {
    if (!motifRefus.trim()) { alert('Veuillez saisir un motif'); return; }
    setTraitement(true);
    try {
      await api.post(`/demandes/${demandeActive.id}/refuser/`, { motif: motifRefus });
      setModalRefuser(false);
      setMotifRefus('');
      await charger();
      setFiltreStatut('refusee');
    } catch(err) {
      alert('Erreur : ' + (err.response?.data?.erreur || 'Erreur'));
    } finally { setTraitement(false); }
  };

  const stats = {
    total:     toutes.length,
    attente:   toutes.filter(d => d.statut === 'en_attente').length,
    approuvees:toutes.filter(d => d.statut === 'approuvee').length,
    refusees:  toutes.filter(d => d.statut === 'refusee').length,
  };

  const colonnes = [
    { key:'prenom', label:'Candidat',
      render:(v,r) => (
        <div>
          <div style={{ fontWeight:'700', color:'#1c1917' }}>{r.prenom} {r.nom}</div>
          <div style={{ fontSize:'12px', color:'#a8a29e' }}>{r.email}</div>
          {r.contact && <div style={{ fontSize:'12px', color:'#a8a29e' }}>📞 {r.contact}</div>}
        </div>
      )
    },
    { key:'filiere', label:'Filière',
      render: v => (
        <span style={{ padding:'4px 12px', borderRadius:'99px', fontSize:'12px', fontWeight:'700',
          background:`${FILIERE_COULEUR[v]}15`, color:FILIERE_COULEUR[v],
          border:`1px solid ${FILIERE_COULEUR[v]}30` }}>
          {FILIERE_LABEL[v] || v}
        </span>
      )
    },
    { key:'score_test', label:'Score',
      render: v => (
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ flex:1, height:'8px', background:'#e7e5e4', borderRadius:'99px', maxWidth:'80px' }}>
            <div style={{ height:'100%', borderRadius:'99px', width:`${v}%`,
              background:v>=80?'#059669':v>=60?'#f59e0b':'#ef4444' }}/>
          </div>
          <span style={{ fontWeight:'800', fontSize:'14px',
            color:v>=80?'#059669':v>=60?'#d97706':'#dc2626' }}>{v}%</span>
        </div>
      )
    },
    { key:'nb_bonnes', label:'Réponses',
      render:(v,r) => <span style={{ color:'#78716c' }}>{v}/{r.nb_questions}</span>
    },
    { key:'date_demande', label:'Date',
      render: v => new Date(v).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})
    },
    { key:'statut', label:'Statut',
      render: v => (
        <Badge type={v==='approuvee'?'success':v==='refusee'?'danger':'warning'} dot>
          {v==='approuvee'?'✅ Approuvée':v==='refusee'?'❌ Refusée':'⏳ En attente'}
        </Badge>
      )
    },
  ];

  return (
    <Layout
      titre="📋 Demandes d'inscription"
      sousTitre="Candidats ayant réussi le test d'admission"
      actions={
        <div style={{ display:'flex', gap:'6px' }}>
          {[
            { val:'en_attente', label:'En attente',  count:stats.attente },
            { val:'approuvee',  label:'Approuvées',  count:stats.approuvees },
            { val:'refusee',    label:'Refusées',    count:stats.refusees },
            { val:'',           label:'Toutes',      count:stats.total },
          ].map(s => (
            <button key={s.val} onClick={() => setFiltreStatut(s.val)} style={{
              padding:'7px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'600',
              cursor:'pointer', transition:'all 0.15s', border:'1.5px solid',
              borderColor:filtreStatut===s.val?'#059669':'#e7e5e4',
              background:filtreStatut===s.val?'#059669':'#fff',
              color:filtreStatut===s.val?'#fff':'#78716c',
            }}>
              {s.label}
              <span style={{ marginLeft:'6px', background:filtreStatut===s.val?'rgba(255,255,255,0.3)':'#f5f5f4',
                color:filtreStatut===s.val?'#fff':'#78716c',
                borderRadius:'99px', padding:'1px 7px', fontSize:'11px', fontWeight:'700' }}>
                {s.count}
              </span>
            </button>
          ))}
        </div>
      }
    >
      {/* Stats */}
      <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', marginBottom:'24px' }}>
        <StatCard icone="📋" couleur="#6366f1" valeur={stats.total}      label="Total demandes"/>
        <StatCard icone="⏳" couleur="#f59e0b" valeur={stats.attente}    label="En attente"
          sousTitre={stats.attente>0?'⚠️ Action requise':''}/>
        <StatCard icone="✅" couleur="#059669" valeur={stats.approuvees}  label="Approuvées"
          sousTitre="Comptes créés"/>
        <StatCard icone="❌" couleur="#ef4444" valeur={stats.refusees}    label="Refusées"/>
      </div>

      {/* Alerte */}
      {stats.attente > 0 && filtreStatut !== 'en_attente' && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'12px',
          padding:'14px 20px', marginBottom:'20px',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'20px' }}>🔔</span>
            <span style={{ fontSize:'14px', color:'#92400e', fontWeight:'600' }}>
              {stats.attente} demande{stats.attente>1?'s':''} en attente de traitement
            </span>
          </div>
          <Bouton variante="warning" petit onClick={() => setFiltreStatut('en_attente')}>
            Traiter maintenant
          </Bouton>
        </div>
      )}

      {/* Tableau */}
      <Card noPadding>
        <Table
          colonnes={colonnes}
          donnees={demandes}
          loading={loading}
          vide="Aucune demande dans cette catégorie"
          actions={row => row.statut === 'en_attente' ? (
            <div style={{ display:'flex', gap:'6px' }}>
              <Bouton variante="success" petit onClick={() => {
                setDemandeActive(row);
                setResultatApprobation(null);
                setModalApprouver(true);
              }}>✅ Approuver</Bouton>
              <Bouton variante="danger" petit onClick={() => {
                setDemandeActive(row);
                setMotifRefus('');
                setModalRefuser(true);
              }}>❌ Refuser</Bouton>
            </div>
          ) : row.statut === 'approuvee' ? (
            <div style={{ fontSize:'12px', color:'#059669', fontWeight:'600' }}>
              ✅ Traité<br/>
              <span style={{ color:'#a8a29e', fontWeight:'400' }}>
                {row.date_traitement && new Date(row.date_traitement).toLocaleDateString('fr-FR')}
              </span>
            </div>
          ) : (
            <div style={{ fontSize:'12px', color:'#dc2626', fontWeight:'600' }}>
              ❌ Refusé
            </div>
          )}
        />
      </Card>

      {/* ══ Modal Approuver ══ */}
      <Modal titre="✅ Approuver la demande"
        visible={modalApprouver}
        onClose={() => { setModalApprouver(false); setResultatApprobation(null); }}>
        {demandeActive && !resultatApprobation && (
          <div>
            <div style={{ background:`${FILIERE_COULEUR[demandeActive.filiere]}12`,
              border:`1px solid ${FILIERE_COULEUR[demandeActive.filiere]}30`,
              borderRadius:'14px', padding:'20px', marginBottom:'20px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {[
                  ['Candidat', `${demandeActive.prenom} ${demandeActive.nom}`],
                  ['Email',    demandeActive.email],
                  ['Filière',  FILIERE_LABEL[demandeActive.filiere]],
                  ['Score',    `${demandeActive.score_test}% (${demandeActive.nb_bonnes}/${demandeActive.nb_questions})`],
                ].map(([l,v]) => (
                  <div key={l}>
                    <div style={{ fontSize:'11px', color:'#a8a29e', fontWeight:'700',
                      textTransform:'uppercase', marginBottom:'3px' }}>{l}</div>
                    <div style={{ fontWeight:'700', color:'#1c1917', fontSize:'14px' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:'#f0fdf4', border:'1px solid #a7f3d0', borderRadius:'10px',
              padding:'14px', marginBottom:'20px', fontSize:'13px', color:'#065f46', lineHeight:1.6 }}>
              ✅ En approuvant :<br/>
              • Un <strong>compte étudiant</strong> sera créé automatiquement<br/>
              • Un <strong>matricule</strong> sera généré<br/>
              • Un <strong>mot de passe temporaire</strong> sera affiché
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <Bouton variante="light" onClick={() => setModalApprouver(false)}>Annuler</Bouton>
              <Bouton variante="success" disabled={traitement} onClick={handleApprouver}>
                {traitement ? '⏳ Création...' : '✅ Approuver et créer le compte'}
              </Bouton>
            </div>
          </div>
        )}

        {resultatApprobation && (
          <div>
            <div style={{ background:'linear-gradient(135deg,#064e3b,#047857)',
              borderRadius:'14px', padding:'24px', marginBottom:'20px', textAlign:'center', color:'#fff' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>🎉</div>
              <div style={{ fontSize:'18px', fontWeight:'800', marginBottom:'6px' }}>Compte créé !</div>
              <div style={{ opacity:0.8, fontSize:'14px' }}>{resultatApprobation.message}</div>
            </div>
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a',
              borderRadius:'12px', padding:'20px', marginBottom:'16px' }}>
              <div style={{ fontSize:'13px', fontWeight:'700', color:'#92400e', marginBottom:'14px' }}>
                ⚠️ Informations à communiquer à l'étudiant
              </div>
              {[
                ['📧 Email',             resultatApprobation.email],
                ['🎓 Matricule',         resultatApprobation.matricule],
                ['🔐 Mot de passe temp.',resultatApprobation.mot_de_passe_temp],
              ].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', padding:'10px 14px', background:'#fff',
                  borderRadius:'8px', border:'1px solid #fde68a', marginBottom:'8px' }}>
                  <span style={{ fontSize:'13px', color:'#78716c' }}>{l}</span>
                  <span style={{ fontWeight:'800', color:'#1c1917', fontSize:'14px',
                    background:'#fef9f0', padding:'4px 12px', borderRadius:'6px' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background:'#f0fdf4', borderRadius:'8px', padding:'10px 14px',
              fontSize:'12px', color:'#065f46', marginBottom:'16px' }}>
              💡 {resultatApprobation.note}
            </div>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <Bouton variante="primary" onClick={() => {
                setModalApprouver(false);
                setResultatApprobation(null);
                setFiltreStatut('approuvee');
              }}>
                Voir les approuvés →
              </Bouton>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ Modal Refuser ══ */}
      <Modal titre="❌ Refuser la demande"
        visible={modalRefuser} onClose={() => setModalRefuser(false)}>
        {demandeActive && (
          <div>
            <div style={{ background:'#fef2f2', border:'1px solid #fecaca',
              borderRadius:'12px', padding:'16px', marginBottom:'20px' }}>
              <div style={{ fontWeight:'700', color:'#991b1b', marginBottom:'4px' }}>
                {demandeActive.prenom} {demandeActive.nom}
              </div>
              <div style={{ fontSize:'13px', color:'#a8a29e' }}>
                {FILIERE_LABEL[demandeActive.filiere]} · Score : {demandeActive.score_test}%
              </div>
            </div>
            <FormField label="Motif du refus *">
              <textarea value={motifRefus} onChange={e => setMotifRefus(e.target.value)}
                placeholder="Ex: Places limitées, dossier incomplet..."
                rows={4}
                style={{ ...inputStyle, resize:'vertical', fontFamily:'inherit', lineHeight:1.6 }}/>
            </FormField>
            <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
              <Bouton variante="light" onClick={() => setModalRefuser(false)}>Annuler</Bouton>
              <Bouton variante="danger" disabled={traitement||!motifRefus.trim()} onClick={handleRefuser}>
                {traitement ? '⏳...' : '❌ Confirmer le refus'}
              </Bouton>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};
export default Demandes;