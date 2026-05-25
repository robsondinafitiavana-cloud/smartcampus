/**
 * pages/communiques/Communiques.js — Communiqués
 * ================================================
 * ADMIN    : Publier, modifier, supprimer des communiqués
 * TOUS     : Lire, liker, commenter
 */
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Bouton from '../../components/common/Bouton';
import Modal from '../../components/common/Modal';
import FormField, { inputStyle, selectStyle } from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';
import { communiquesAPI } from '../../api/services';
import { formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

// Couleurs par catégorie
const CAT_STYLE = {
  general:    { bg:'#f0f9ff', border:'#bae6fd', color:'#0369a1', label:'Général' },
  academique: { bg:'#f0fdf4', border:'#a7f3d0', color:'#065f46', label:'Académique' },
  financier:  { bg:'#fffbeb', border:'#fde68a', color:'#92400e', label:'Financier' },
  evenement:  { bg:'#faf5ff', border:'#ddd6fe', color:'#5b21b6', label:'Événement' },
  urgent:     { bg:'#fef2f2', border:'#fecaca', color:'#991b1b', label:'🚨 Urgent' },
};

// ── Carte d'un communiqué ────────────────────────────────────
const CarteCommunique = ({ communique, onLike, onCommenter, onSupprimer, estAdmin, utilisateur }) => {
  const [showComments,  setShowComments]  = useState(false);
  const [nouveauComm,   setNouveauComm]   = useState('');
  const [loadingComm,   setLoadingComm]   = useState(false);
  const [liked,         setLiked]         = useState(communique.j_ai_like);
  const [nbLikes,       setNbLikes]       = useState(communique.nb_likes);
  const cat = CAT_STYLE[communique.categorie] || CAT_STYLE.general;

  const handleLike = async () => {
    try {
      const res = await onLike(communique.id);
      setLiked(res.j_ai_like);
      setNbLikes(res.nb_likes);
    } catch(e) { console.error(e); }
  };

  const handleCommenter = async (e) => {
    e.preventDefault();
    if (!nouveauComm.trim()) return;
    setLoadingComm(true);
    try {
      await onCommenter(communique.id, nouveauComm);
      setNouveauComm('');
      // Recharger la page pour voir le nouveau commentaire
      window.location.reload();
    } catch(e) { console.error(e); }
    setLoadingComm(false);
  };

  return (
    <div style={{
      background:'#fff', borderRadius:'16px',
      border:'1px solid #e7e5e4',
      boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
      overflow:'hidden',
      borderTop: communique.categorie === 'urgent' ? '3px solid #ef4444' : undefined,
      marginBottom:'16px',
    }}>
      {/* ── Header du communiqué ── */}
      <div style={{ padding:'20px 24px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            {/* Avatar auteur */}
            <div style={{
              width:'40px', height:'40px', borderRadius:'50%', flexShrink:0,
              background:'linear-gradient(135deg, #059669, #047857)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'14px', fontWeight:'700', color:'#fff',
            }}>
              {communique.auteur_role === 'admin' ? '👑' : communique.auteur_email?.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:'600', fontSize:'13px', color:'#1c1917' }}>
                {communique.auteur_email}
                {communique.auteur_role === 'admin' && (
                  <span style={{ marginLeft:'6px', fontSize:'11px', background:'#ecfdf5',
                    color:'#065f46', padding:'2px 8px', borderRadius:'99px', fontWeight:'700' }}>
                    Administration
                  </span>
                )}
              </div>
              <div style={{ fontSize:'12px', color:'#a8a29e', marginTop:'1px' }}>
                {new Date(communique.date_creation).toLocaleDateString('fr-FR', {
                  day:'numeric', month:'long', year:'numeric',
                  hour:'2-digit', minute:'2-digit'
                })}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            {/* Badge catégorie */}
            <span style={{
              padding:'4px 12px', borderRadius:'99px', fontSize:'12px',
              fontWeight:'600', background:cat.bg, color:cat.color,
              border:`1px solid ${cat.border}`
            }}>{cat.label}</span>

            {/* Épinglé */}
            {communique.est_epingle && (
              <span style={{ fontSize:'16px' }} title="Épinglé">📌</span>
            )}

            {/* Actions admin */}
            {estAdmin && (
              <button onClick={() => onSupprimer(communique.id)} style={{
                padding:'4px 10px', background:'#fef2f2',
                border:'1px solid #fecaca', borderRadius:'8px',
                color:'#dc2626', fontSize:'12px', cursor:'pointer',
                transition:'all 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background='#fee2e2'}
                onMouseLeave={e => e.currentTarget.style.background='#fef2f2'}
              >🗑</button>
            )}
          </div>
        </div>

        {/* Titre */}
        <h3 style={{ fontSize:'18px', fontWeight:'800', color:'#1c1917',
          letterSpacing:'-0.3px', marginBottom:'10px' }}>
          {communique.titre}
        </h3>

        {/* Contenu */}
        <p style={{ fontSize:'14px', color:'#57534e', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
          {communique.contenu}
        </p>

        {/* Filière ciblée */}
        {communique.filiere_nom && (
          <div style={{ marginTop:'12px' }}>
            <span style={{ fontSize:'12px', color:'#78716c',
              background:'#f5f5f4', padding:'3px 10px', borderRadius:'99px',
              border:'1px solid #e7e5e4' }}>
              🎯 Destiné à : {communique.filiere_nom}
            </span>
          </div>
        )}
      </div>

      {/* ── Barre d'actions ── */}
      <div style={{
        padding:'12px 24px', borderTop:'1px solid #f5f5f4',
        display:'flex', alignItems:'center', gap:'16px',
        background:'#fafaf9'
      }}>
        {/* Like */}
        <button onClick={handleLike} style={{
          display:'flex', alignItems:'center', gap:'6px',
          padding:'7px 14px', borderRadius:'99px',
          background: liked ? '#ecfdf5' : '#fff',
          border: liked ? '1.5px solid #a7f3d0' : '1.5px solid #e7e5e4',
          color: liked ? '#059669' : '#78716c',
          fontSize:'13px', fontWeight:'600', cursor:'pointer',
          transition:'all 0.2s',
        }}
          onMouseEnter={e => { if(!liked) { e.currentTarget.style.background='#f0fdf4'; e.currentTarget.style.borderColor='#a7f3d0'; }}}
          onMouseLeave={e => { if(!liked) { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#e7e5e4'; }}}
        >
          {liked ? '❤️' : '🤍'} {nbLikes}
        </button>

        {/* Commentaires */}
        <button onClick={() => setShowComments(!showComments)} style={{
          display:'flex', alignItems:'center', gap:'6px',
          padding:'7px 14px', borderRadius:'99px',
          background: showComments ? '#eff6ff' : '#fff',
          border: showComments ? '1.5px solid #bfdbfe' : '1.5px solid #e7e5e4',
          color: showComments ? '#1d4ed8' : '#78716c',
          fontSize:'13px', fontWeight:'600', cursor:'pointer',
          transition:'all 0.2s',
        }}>
          💬 {communique.nb_commentaires} commentaire{communique.nb_commentaires !== 1 ? 's' : ''}
        </button>
      </div>

      {/* ── Section commentaires ── */}
      {showComments && (
        <div style={{ padding:'16px 24px', borderTop:'1px solid #f5f5f4' }}>
          {/* Liste commentaires */}
          {communique.commentaires?.length > 0 ? (
            <div style={{ marginBottom:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
              {communique.commentaires.map(comm => (
                <div key={comm.id} style={{
                  display:'flex', gap:'10px', padding:'12px',
                  background:'#f5f5f4', borderRadius:'10px',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width:'32px', height:'32px', borderRadius:'50%', flexShrink:0,
                    background: comm.auteur_role === 'admin'
                      ? 'linear-gradient(135deg,#059669,#047857)'
                      : comm.auteur_role === 'enseignant'
                      ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                      : 'linear-gradient(135deg,#f59e0b,#d97706)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'12px', fontWeight:'700', color:'#fff',
                  }}>
                    {comm.auteur_role === 'admin' ? '👑' : comm.auteur_email?.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                      <span style={{ fontWeight:'600', fontSize:'13px', color:'#1c1917' }}>
                        {comm.auteur_email}
                      </span>
                      <span style={{
                        fontSize:'10px', fontWeight:'600', padding:'1px 6px',
                        borderRadius:'99px', textTransform:'capitalize',
                        background: comm.auteur_role === 'admin' ? '#ecfdf5'
                          : comm.auteur_role === 'enseignant' ? '#ede9fe' : '#fffbeb',
                        color: comm.auteur_role === 'admin' ? '#065f46'
                          : comm.auteur_role === 'enseignant' ? '#5b21b6' : '#92400e',
                      }}>{comm.auteur_role}</span>
                      <span style={{ fontSize:'11px', color:'#a8a29e', marginLeft:'auto' }}>
                        {new Date(comm.date_creation).toLocaleDateString('fr-FR', {
                          day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'
                        })}
                      </span>
                    </div>
                    <p style={{ fontSize:'13px', color:'#44403c', lineHeight:1.5 }}>
                      {comm.contenu}
                    </p>
                  </div>
                  {/* Supprimer son propre commentaire */}
                  {(comm.auteur_email === utilisateur?.email || estAdmin) && (
                    <button onClick={async () => {
                      await communiquesAPI.supprimerCommentaire(communique.id, comm.id);
                      window.location.reload();
                    }} style={{
                      background:'none', border:'none', cursor:'pointer',
                      color:'#a8a29e', fontSize:'14px', padding:'4px',
                      alignSelf:'flex-start'
                    }}>×</button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color:'#a8a29e', fontSize:'13px', marginBottom:'12px', textAlign:'center' }}>
              Aucun commentaire. Soyez le premier à réagir !
            </p>
          )}

          {/* Formulaire commentaire */}
          <form onSubmit={handleCommenter} style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
            <div style={{ flex:1 }}>
              <textarea
                value={nouveauComm}
                onChange={e => setNouveauComm(e.target.value)}
                placeholder="Écrire un commentaire..."
                rows={2}
                style={{
                  width:'100%', padding:'10px 14px',
                  border:'1.5px solid #e7e5e4', borderRadius:'10px',
                  fontSize:'14px', color:'#1c1917', resize:'vertical',
                  fontFamily:'inherit', outline:'none', transition:'border-color 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor='#10b981'; e.target.style.boxShadow='0 0 0 3px rgba(16,185,129,0.12)'; }}
                onBlur={e => { e.target.style.borderColor='#e7e5e4'; e.target.style.boxShadow='none'; }}
              />
            </div>
            <Bouton type="submit" variante="primary" petit disabled={loadingComm || !nouveauComm.trim()}>
              {loadingComm ? '⏳' : '📤 Envoyer'}
            </Bouton>
          </form>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════
const Communiques = () => {
  const { estAdmin, utilisateur } = useAuth();
  const [communiques,    setCommuniques]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modalPublier,   setModalPublier]   = useState(false);
  const [filtreCategorie,setFiltreCategorie]= useState('');
  const [formulaire,     setFormulaire]     = useState({
    titre:'', contenu:'', categorie:'general',
    filiere:'', est_epingle: false,
  });
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur,     setErreur]     = useState('');

  const champ = (key, val) => setFormulaire(f => ({...f, [key]:val}));

  useEffect(() => { charger(); }, [filtreCategorie]); // eslint-disable-line

  const charger = async () => {
    setLoading(true);
    try {
      const res = await communiquesAPI.getListe(
        filtreCategorie ? { categorie:filtreCategorie } : {}
      );
      setCommuniques(res.data.results || res.data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const handlePublier = async (e) => {
    e.preventDefault();
    if (!formulaire.titre.trim())   return setErreur('Le titre est requis');
    if (!formulaire.contenu.trim()) return setErreur('Le contenu est requis');
    setSauvegarde(true); setErreur('');
    try {
      const data = { ...formulaire };
      if (!data.filiere) delete data.filiere;
      await communiquesAPI.publier(data);
      setModalPublier(false);
      charger();
      setFormulaire({ titre:'', contenu:'', categorie:'general', filiere:'', est_epingle:false });
    } catch(err) {
      setErreur(err.response?.data?.erreur || 'Erreur lors de la publication');
    } finally { setSauvegarde(false); }
  };

  const handleLike = async (id) => {
    const res = await communiquesAPI.liker(id);
    return res.data;
  };

  const handleCommenter = async (id, contenu) => {
    await communiquesAPI.commenter(id, contenu);
  };

  const handleSupprimer = async (id) => {
    if (!window.confirm('Supprimer ce communiqué ?')) return;
    await communiquesAPI.supprimer(id);
    charger();
  };

  const CATEGORIES = [
    { val:'', label:'Toutes les catégories' },
    { val:'general',    label:'Général' },
    { val:'academique', label:'Académique' },
    { val:'financier',  label:'Financier' },
    { val:'evenement',  label:'Événement' },
    { val:'urgent',     label:'🚨 Urgent' },
  ];

  return (
    <Layout
      titre="📢 Communiqués"
      sousTitre="Informations officielles de l'université"
      actions={
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          {/* Filtre catégorie */}
          <select value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)}
            style={{ ...selectStyle, width:'180px', padding:'8px 12px', fontSize:'13px' }}>
            {CATEGORIES.map(c => (
              <option key={c.val} value={c.val}>{c.label}</option>
            ))}
          </select>
          {/* Bouton publier (admin seulement) */}
          {estAdmin && (
            <Bouton variante="primary" onClick={() => setModalPublier(true)}>
              📢 Publier un communiqué
            </Bouton>
          )}
        </div>
      }
    >
      {/* ── Info pour non-admin ── */}
      {!estAdmin && (
        <div style={{
          background:'#f0fdf4', border:'1px solid #a7f3d0', borderRadius:'12px',
          padding:'12px 20px', marginBottom:'20px', fontSize:'13px', color:'#065f46',
          display:'flex', alignItems:'center', gap:'10px'
        }}>
          <span style={{ fontSize:'20px' }}>ℹ️</span>
          <span>
            Vous pouvez <strong>liker</strong> et <strong>commenter</strong> les communiqués.
            Seule l'administration peut publier.
          </span>
        </div>
      )}

      {/* ── Liste des communiqués ── */}
      {loading ? (
        <Spinner texte="Chargement des communiqués..." />
      ) : communiques.length === 0 ? (
        <Card>
          <div style={{ textAlign:'center', padding:'60px', color:'#a8a29e' }}>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>📭</div>
            <div style={{ fontWeight:'700', fontSize:'18px', color:'#78716c', marginBottom:'8px' }}>
              Aucun communiqué
            </div>
            <p style={{ fontSize:'14px' }}>
              {estAdmin
                ? 'Publiez votre premier communiqué pour informer les étudiants et enseignants.'
                : 'Aucun communiqué publié pour le moment.'}
            </p>
          </div>
        </Card>
      ) : (
        <div>
          {/* Épinglés en premier */}
          {communiques.filter(c => c.est_epingle).length > 0 && (
            <div style={{ marginBottom:'8px' }}>
              <div style={{ fontSize:'12px', fontWeight:'700', color:'#a8a29e',
                textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>
                📌 Épinglés
              </div>
              {communiques.filter(c => c.est_epingle).map(c => (
                <CarteCommunique key={c.id} communique={c}
                  onLike={handleLike} onCommenter={handleCommenter}
                  onSupprimer={handleSupprimer} estAdmin={estAdmin}
                  utilisateur={utilisateur} />
              ))}
            </div>
          )}

          {/* Autres communiqués */}
          {communiques.filter(c => !c.est_epingle).length > 0 && (
            <div>
              {communiques.filter(c => !c.est_epingle).length > 0 && communiques.filter(c => c.est_epingle).length > 0 && (
                <div style={{ fontSize:'12px', fontWeight:'700', color:'#a8a29e',
                  textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>
                  📋 Récents
                </div>
              )}
              {communiques.filter(c => !c.est_epingle).map(c => (
                <CarteCommunique key={c.id} communique={c}
                  onLike={handleLike} onCommenter={handleCommenter}
                  onSupprimer={handleSupprimer} estAdmin={estAdmin}
                  utilisateur={utilisateur} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ Modal : Publier un communiqué (Admin) ══ */}
      <Modal titre="📢 Publier un communiqué"
        visible={modalPublier}
        onClose={() => { setModalPublier(false); setErreur(''); }}
        largeur="600px">
        <form onSubmit={handlePublier}>
          {/* Catégorie */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            <FormField label="Catégorie" required>
              <select value={formulaire.categorie}
                onChange={e => champ('categorie', e.target.value)}
                style={{ ...selectStyle, padding:'10px 14px' }}>
                <option value="general">Général</option>
                <option value="academique">Académique</option>
                <option value="financier">Financier</option>
                <option value="evenement">Événement</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </FormField>
            <FormField label="Filière (optionnel)" aide="Laisser vide pour tout le monde">
              <input value={formulaire.filiere}
                onChange={e => champ('filiere', e.target.value)}
                placeholder="ID de la filière (optionnel)"
                style={inputStyle} />
            </FormField>
          </div>

          <FormField label="Titre" required>
            <input value={formulaire.titre}
              onChange={e => champ('titre', e.target.value)}
              placeholder="Ex: Examen de fin d'année — Informatique L3"
              style={inputStyle} />
          </FormField>

          <FormField label="Contenu" required>
            <textarea value={formulaire.contenu}
              onChange={e => champ('contenu', e.target.value)}
              placeholder="Rédigez votre communiqué ici..."
              rows={6}
              style={{
                ...inputStyle, resize:'vertical',
                fontFamily:'inherit', lineHeight:1.6
              }} />
          </FormField>

          {/* Options */}
          <div style={{
            background:'#f5f5f4', borderRadius:'10px', padding:'14px',
            marginBottom:'16px', display:'flex', alignItems:'center', gap:'12px'
          }}>
            <input type="checkbox" id="epingle"
              checked={formulaire.est_epingle}
              onChange={e => champ('est_epingle', e.target.checked)}
              style={{ width:'16px', height:'16px', cursor:'pointer' }} />
            <label htmlFor="epingle" style={{
              fontSize:'14px', fontWeight:'500', color:'#44403c', cursor:'pointer'
            }}>
              📌 Épingler ce communiqué (affiché en priorité)
            </label>
          </div>

          {/* Aperçu catégorie */}
          {formulaire.categorie && (
            <div style={{
              padding:'10px 14px', borderRadius:'10px', marginBottom:'16px',
              background:CAT_STYLE[formulaire.categorie]?.bg,
              border:`1px solid ${CAT_STYLE[formulaire.categorie]?.border}`,
              color:CAT_STYLE[formulaire.categorie]?.color,
              fontSize:'13px', fontWeight:'600'
            }}>
              Catégorie : {CAT_STYLE[formulaire.categorie]?.label}
              {formulaire.categorie === 'urgent' && ' — Ce communiqué sera affiché avec une bordure rouge'}
            </div>
          )}

          {erreur && (
            <div style={{
              background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px',
              padding:'11px 14px', color:'#dc2626', fontSize:'13px', marginBottom:'12px'
            }}>
              ⚠️ {erreur}
            </div>
          )}

          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <Bouton variante="light" onClick={() => { setModalPublier(false); setErreur(''); }}>
              Annuler
            </Bouton>
            <Bouton type="submit" variante="primary" disabled={sauvegarde}>
              {sauvegarde ? '⏳ Publication...' : '📢 Publier maintenant'}
            </Bouton>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Communiques;