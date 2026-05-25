/**
 * pages/presences/Presences.js — Module 4 : Présences
 * ======================================================
 * - Pointage manuel QR Code (scanner)
 * - Liste des présences avec filtres
 * - Taux de présence par étudiant
 */
import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Bouton from '../../components/common/Bouton';
import Modal from '../../components/common/Modal';
import FormField, { inputStyle } from '../../components/common/FormField';
import { presencesAPI } from '../../api/services';
import { formatDate, couleurStatut } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const Presences = () => {
  const { estEtudiant } = useAuth();
  const [presences,  setPresences]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalQR,    setModalQR]    = useState(false);
  const [qrCode,     setQrCode]     = useState('');
  const [message,    setMessage]    = useState(null);
  const [pointage,   setPointage]   = useState(false);

  useEffect(() => { charger(); }, []); // eslint-disable-line

  const charger = async () => {
    setLoading(true);
    try {
      const res = await presencesAPI.getListe();
      setPresences(res.data.results || res.data);
    } catch { }
    setLoading(false);
  };

  // Pointage QR Code
  const handlePointage = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;
    setPointage(true); setMessage(null);
    try {
      const res = await presencesAPI.pointerQR(qrCode, null);
      setMessage({ type:'success', texte: res.data.message });
      setQrCode('');
      charger();
    } catch (err) {
      setMessage({ type:'danger', texte: err.response?.data?.erreur || 'Erreur de pointage' });
    } finally { setPointage(false); }
  };

  const colonnes = [
    { key:'etudiant_nom',  label:'Étudiant' },
    { key:'date_seance',   label:'Date',   render: v => formatDate(v) },
    { key:'heure_entree',  label:'Entrée', render: v => v || '—' },
    { key:'heure_sortie',  label:'Sortie', render: v => v || '—' },
    { key:'methode_entree',label:'Méthode' },
    { key:'statut',        label:'Statut',
      render: v => <Badge type={couleurStatut(v)}>{v}</Badge> },
  ];

  return (
    <Layout titre="✅ Gestion des Présences">
      {/* Bouton pointage (admin/enseignant) */}
      {!estEtudiant && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'20px' }}>
          <Bouton onClick={() => setModalQR(true)}>📲 Pointage QR Code</Bouton>
        </div>
      )}

      {/* Schéma du système hybride */}
      <Card style={{ marginBottom:'20px', background:'linear-gradient(135deg,#1e3a5f,#2d5a8e)', color:'#fff' }}>
        <h3 style={{ fontWeight:'700', marginBottom:'12px', color:'#fde68a' }}>
          🤖 Système hybride de pointage
        </h3>
        <div style={{ display:'flex', gap:'20px', flexWrap:'wrap' }}>
          <div style={{ flex:1, background:'rgba(255,255,255,0.1)', borderRadius:'8px', padding:'14px' }}>
            <div style={{ fontWeight:'600', marginBottom:'6px' }}>📱 ENTRÉE</div>
            <div style={{ fontSize:'13px', opacity:0.9 }}>Scan QR Code étudiant → Présence validée</div>
          </div>
          <div style={{ flex:1, background:'rgba(255,255,255,0.1)', borderRadius:'8px', padding:'14px' }}>
            <div style={{ fontWeight:'600', marginBottom:'6px' }}>👁️ SORTIE</div>
            <div style={{ fontSize:'13px', opacity:0.9 }}>Reconnaissance faciale (Flask IA) → Sortie validée</div>
          </div>
        </div>
        <div style={{ marginTop:'10px', fontSize:'12px', opacity:0.7 }}>
          ⚠️ Alerte automatique si taux de présence &lt; 70%
        </div>
      </Card>

      {/* Tableau des présences */}
      <Card style={{ padding:0 }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6', fontWeight:'600', color:'#1e3a5f' }}>
          Registre des présences
        </div>
        <Table colonnes={colonnes} donnees={presences} loading={loading} vide="Aucune présence enregistrée" />
      </Card>

      {/* Modal : Pointage QR */}
      <Modal titre="📲 Pointage par QR Code" visible={modalQR} onClose={() => setModalQR(false)}>
        <form onSubmit={handlePointage}>
          <div style={{ textAlign:'center', marginBottom:'20px', color:'#6b7280' }}>
            Scanner le QR Code de l'étudiant ou saisir le code manuellement
          </div>
          <FormField label="Code QR / Matricule" required>
            <input
              value={qrCode} onChange={e => setQrCode(e.target.value)}
              placeholder="Saisir ou scanner le QR code..."
              autoFocus
              style={{ ...inputStyle, fontSize:'16px', textAlign:'center', padding:'14px', border:'1.5px solid #d1d5db', borderRadius:'8px' }}
            />
          </FormField>
          {message && (
            <div style={{
              padding:'12px', borderRadius:'8px', marginBottom:'12px',
              background: message.type==='success' ? '#d1fae5' : '#fee2e2',
              color: message.type==='success' ? '#065f46' : '#991b1b',
              fontWeight:'600', textAlign:'center'
            }}>
              {message.texte}
            </div>
          )}
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <Bouton variante="light" onClick={() => setModalQR(false)}>Fermer</Bouton>
            <Bouton type="submit" disabled={pointage || !qrCode.trim()}>
              {pointage ? '⏳...' : '✅ Pointer'}
            </Bouton>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Presences;
