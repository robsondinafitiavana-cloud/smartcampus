/**
 * pages/notes/Notes.js — Module 3 : Gestion des Notes
 * =====================================================
 * Admin/Enseignant : saisir notes, voir statistiques, étudiants à risque
 * Étudiant : voir son bulletin complet avec moyenne générale
 */
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import Bouton from '../../components/common/Bouton';
import FormField, { inputStyle } from '../../components/common/FormField';
import { notesAPI, coursAPI, etudiantsAPI, authAPI } from '../../api/services';
import { getMention } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const Notes = () => {
  const { estEtudiant, utilisateur } = useAuth();
  const [bulletin,    setBulletin]    = useState(null);
  const [etudiants,   setEtudiants]   = useState([]);
  const [cours,       setCours]       = useState([]);
  const [modalSaisie, setModalSaisie] = useState(false);
  const [aRisque,     setARisque]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [formulaire,  setFormulaire]  = useState({
    etudiant:'', cours:'', note_controle:'', note_examen:'',
    note_tp:'', semestre:1, annee_scolaire:'2025-2026'
  });
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur,     setErreur]     = useState('');
  const annee = '2025-2026';

  useEffect(() => {
    if (estEtudiant) chargerBulletin();
    else chargerDonneesAdmin();
  }, []); // eslint-disable-line

  // FIX BUG 3 : Utiliser /auth/profil/ pour récupérer l'ID étudiant de l'utilisateur connecté
  const chargerBulletin = async () => {
    setLoading(true);
    try {
      // profil_id est stocké dans l'utilisateur connecté (retourné au login)
      // Sinon on le charge via /auth/profil/
      let etudiantId = utilisateur?.profil_id;

      if (!etudiantId) {
        // Fallback : charger le profil complet
        const profilRes = await authAPI.monProfil();
        etudiantId = profilRes.data.profil_id;
      }

      if (etudiantId) {
        const bRes = await notesAPI.getBulletin(etudiantId, annee);
        setBulletin(bRes.data);
      }
    } catch (err) {
      console.error('Erreur chargement bulletin:', err);
    }
    setLoading(false);
  };

  const chargerDonneesAdmin = async () => {
    try {
      const [coursRes, risqueRes, etuRes] = await Promise.all([
        coursAPI.getListe(),
        notesAPI.getEtudiantsARisque(),
        etudiantsAPI.getListe(),
      ]);
      setCours(coursRes.data.results     || coursRes.data);
      setARisque(risqueRes.data);
      setEtudiants(etuRes.data.results   || etuRes.data);
    } catch (err) {
      console.error('Erreur chargement données:', err);
    }
    setLoading(false);
  };

  const handleSaisir = async (e) => {
    e.preventDefault();
    setSauvegarde(true); setErreur('');
    try {
      await notesAPI.saisir(formulaire);
      setModalSaisie(false);
      chargerDonneesAdmin();
      setFormulaire({ etudiant:'', cours:'', note_controle:'', note_examen:'',
        note_tp:'', semestre:1, annee_scolaire:'2025-2026' });
    } catch (err) {
      setErreur(JSON.stringify(err.response?.data || 'Erreur serveur'));
    } finally { setSauvegarde(false); }
  };

  // ── VUE ÉTUDIANT : Bulletin ────────────────────────────────────
  if (estEtudiant) {
    if (loading) return (
      <Layout titre="📝 Mes Notes">
        <div style={{ textAlign:'center', padding:'60px', color:'#6b7280' }}>Chargement du bulletin...</div>
      </Layout>
    );
    const mention = bulletin?.moyenne_generale != null ? getMention(parseFloat(bulletin.moyenne_generale)) : null;

    return (
      <Layout titre="📝 Mon Bulletin de Notes">
        {bulletin ? (
          <>
            {/* Bandeau moyenne générale */}
            <div style={{
              background: `linear-gradient(135deg, ${mention?.color || '#1e3a5f'}, ${mention?.color || '#1e3a5f'}bb)`,
              borderRadius:'12px', padding:'24px 32px', marginBottom:'24px',
              color:'#fff', display:'flex', alignItems:'center', gap:'40px', flexWrap:'wrap'
            }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'48px', fontWeight:'800', lineHeight:1 }}>
                  {parseFloat(bulletin.moyenne_generale).toFixed(2)}
                </div>
                <div style={{ opacity:0.8, fontSize:'14px', marginTop:'4px' }}>/20</div>
              </div>
              <div>
                <div style={{ fontSize:'22px', fontWeight:'700', marginBottom:'6px' }}>
                  Mention : {mention?.label}
                </div>
                <div style={{ opacity:0.8, marginBottom:'8px' }}>Année scolaire {annee}</div>
                {bulletin.matieres_non_validees?.length > 0 && (
                  <div style={{
                    background:'rgba(255,255,255,0.2)', borderRadius:'6px',
                    padding:'6px 12px', fontSize:'13px'
                  }}>
                    ⚠️ {bulletin.matieres_non_validees.length} matière(s) non validée(s) :{' '}
                    {bulletin.matieres_non_validees.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Tableau des notes */}
            <Card style={{ padding:0 }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6',
                fontWeight:'600', color:'#1e3a5f', fontSize:'15px' }}>
                Détail par matière
              </div>
              <Table
                colonnes={[
                  { key:'cours_nom',     label:'Matière' },
                  { key:'coefficient',   label:'Coeff',  render: v => v || '—' },
                  { key:'note_controle', label:'Contrôle /20', render: v => v ?? '—' },
                  { key:'note_examen',   label:'Examen /20',   render: v => v ?? '—' },
                  { key:'note_tp',       label:'TP /20',       render: v => v ?? '—' },
                  { key:'note_finale',   label:'Moyenne',
                    render: v => (
                      <strong style={{ fontSize:'16px', color: parseFloat(v) >= 10 ? '#10b981' : '#ef4444' }}>
                        {v != null ? parseFloat(v).toFixed(2) : '—'}
                      </strong>
                    )
                  },
                  { key:'est_valide', label:'Résultat',
                    render: (v, r) => (
                      <Badge type={v ? 'success' : r.est_rattrapage ? 'warning' : 'danger'}>
                        {v ? '✅ Validé' : r.est_rattrapage ? '⚠️ Rattrapage' : '❌ Ajourné'}
                      </Badge>
                    )
                  },
                ]}
                donnees={bulletin.notes}
                loading={false}
                vide="Aucune note enregistrée pour cette année"
              />
            </Card>
          </>
        ) : (
          <Card>
            <p style={{ textAlign:'center', color:'#6b7280', padding:'40px', fontSize:'15px' }}>
              📭 Aucune note disponible pour l'année {annee}.<br/>
              <span style={{ fontSize:'13px', marginTop:'8px', display:'block' }}>
                Vos notes apparaîtront ici après la saisie par vos enseignants.
              </span>
            </p>
          </Card>
        )}
      </Layout>
    );
  }

  // ── VUE ADMIN / ENSEIGNANT ────────────────────────────────────
  return (
    <Layout titre="📝 Gestion des Notes">
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'20px' }}>
        <Bouton onClick={() => setModalSaisie(true)}>✏️ Saisir des notes</Bouton>
      </div>

      <Card>
        <h3 style={{ fontWeight:'700', color:'#1e3a5f', marginBottom:'16px', fontSize:'15px' }}>
          ⚠️ Étudiants en difficulté ({aRisque.length})
        </h3>
        <Table
          colonnes={[
            { key:'etudiant',    label:'Étudiant' },
            { key:'cours',       label:'Cours' },
            { key:'note_finale', label:'Note',
              render: v => <strong style={{ color:'#ef4444', fontSize:'16px' }}>{v}/20</strong> },
            { key:'en_rattrapage', label:'Statut',
              render: v => <Badge type={v ? 'warning' : 'danger'}>{v ? '⚠️ Rattrapage' : '❌ Ajourné'}</Badge> },
          ]}
          donnees={aRisque}
          loading={loading}
          vide="✅ Aucun étudiant en difficulté"
        />
      </Card>

      {/* Modal saisie */}
      <Modal titre="✏️ Saisir les notes d'un étudiant" visible={modalSaisie} onClose={() => setModalSaisie(false)}>
        <form onSubmit={handleSaisir}>
          <FormField label="Étudiant" required>
            <select value={formulaire.etudiant}
              onChange={e => setFormulaire({...formulaire, etudiant:e.target.value})}
              style={{...inputStyle, padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:'8px'}}>
              <option value="">Choisir un étudiant...</option>
              {etudiants.map(e => (
                <option key={e.id} value={e.id}>{e.matricule} — {e.nom} {e.prenom}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Cours / Matière" required>
            <select value={formulaire.cours}
              onChange={e => setFormulaire({...formulaire, cours:e.target.value})}
              style={{...inputStyle, padding:'10px 14px', border:'1.5px solid #d1d5db', borderRadius:'8px'}}>
              <option value="">Choisir un cours...</option>
              {cours.map(c => (
                <option key={c.id} value={c.id}>{c.code_cours} — {c.intitule}</option>
              ))}
            </select>
          </FormField>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0 12px' }}>
            <FormField label="Contrôle /20">
              <input type="number" step="0.25" min="0" max="20"
                value={formulaire.note_controle}
                onChange={e => setFormulaire({...formulaire, note_controle:e.target.value})}
                style={inputStyle} placeholder="0-20" />
            </FormField>
            <FormField label="Examen /20">
              <input type="number" step="0.25" min="0" max="20"
                value={formulaire.note_examen}
                onChange={e => setFormulaire({...formulaire, note_examen:e.target.value})}
                style={inputStyle} placeholder="0-20" />
            </FormField>
            <FormField label="TP /20">
              <input type="number" step="0.25" min="0" max="20"
                value={formulaire.note_tp}
                onChange={e => setFormulaire({...formulaire, note_tp:e.target.value})}
                style={inputStyle} placeholder="0-20" />
            </FormField>
          </div>
          <div style={{ background:'#f0f9ff', borderRadius:'8px', padding:'12px',
            marginBottom:'16px', fontSize:'13px', color:'#0369a1', border:'1px solid #bae6fd' }}>
            💡 <strong>Calcul automatique :</strong> Moyenne = 40% Contrôle + 50% Examen + 10% TP<br/>
            ✅ Validé si moyenne ≥ 10 | ⚠️ Rattrapage si moyenne entre 7 et 9.99
          </div>
          {erreur && (
            <div style={{ background:'#fee2e2', borderRadius:'8px', padding:'10px',
              color:'#991b1b', fontSize:'13px', marginBottom:'12px' }}>
              ❌ {erreur}
            </div>
          )}
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <Bouton variante="light" onClick={() => setModalSaisie(false)}>Annuler</Bouton>
            <Bouton type="submit" disabled={sauvegarde || !formulaire.etudiant || !formulaire.cours}>
              {sauvegarde ? '⏳ Enregistrement...' : '✅ Enregistrer les notes'}
            </Bouton>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Notes;
