import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Bouton from '../../components/Bouton';
import Modal from '../../components/Modal';

const Presences = () => {
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalQR, setModalQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [message, setMessage] = useState(null);
  const [selectedCours, setSelectedCours] = useState(null);

  // Données de démo (à remplacer plus tard par API)
  const coursDuJour = [
    { id: 1, code: 'INF301', nom: 'Base de Données', heure: '08:00 - 10:00', salle: 'A101', effectif: 28 },
    { id: 2, code: 'INF302', nom: 'Programmation Web', heure: '10:30 - 12:30', salle: 'Labo 2', effectif: 25 },
  ];

  const colonnes = [
    { entete: 'Matricule', cle: 'matricule' },
    { entete: 'Nom & Prénom', cle: 'nom' },
    { entete: 'Heure Entrée', cle: 'heure_entree' },
    { entete: 'Statut', cle: 'statut' },
    { entete: 'Méthode', cle: 'methode' },
  ];

  // Simulation de présence
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setPresences([
        { id: 1, matricule: 'ETU2025001', nom: 'RAKOTO Jean', heure_entree: '07:58', statut: 'present', methode: 'QR Code' },
        { id: 2, matricule: 'ETU2025002', nom: 'RAHARISOA Fiti', heure_entree: '08:05', statut: 'present', methode: 'Facial' },
        { id: 3, matricule: 'ETU2025003', nom: 'ANDRIANARIVO Sarah', heure_entree: '08:12', statut: 'retard', methode: 'Manuel' },
        { id: 4, matricule: 'ETU2025004', nom: 'RAKOTOMALALA Thierry', heure_entree: '', statut: 'absent', methode: '' },
      ]);
      setLoading(false);
    }, 800);
  }, [selectedCours]);

  const handlePointage = (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setMessage({ type: 'success', texte: `✅ Étudiant ${qrCode} pointé avec succès !` });

    // Simulation d'ajout
    setTimeout(() => {
      setPresences(prev => [{
        id: Date.now(),
        matricule: qrCode,
        nom: 'Étudiant Scanné',
        heure_entree: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        statut: 'present',
        methode: 'QR Code'
      }, ...prev]);
      setQrCode('');
      setMessage(null);
    }, 600);
  };

  const tauxPresence = Math.round((presences.filter(p => p.statut === 'present').length / (presences.length || 1)) * 100);

  return (
    <Layout titre="Gestion des Présences">
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {coursDuJour.map(cours => (
          <Card 
            key={cours.id}
            onClick={() => setSelectedCours(cours)}
            style={{ 
              cursor: 'pointer',
              border: selectedCours?.id === cours.id ? '2px solid #10b981' : '1px solid #e5e7eb',
              background: selectedCours?.id === cours.id ? '#f0fdf4' : 'white'
            }}
          >
            <strong>{cours.code}</strong> — {cours.nom}<br/>
            <small>{cours.heure} | {cours.salle}</small>
          </Card>
        ))}
      </div>

      {/* Statistiques rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>{tauxPresence}%</div>
          <div>Taux de présence</div>
        </Card>
        <Card>
          <div style={{ fontSize: '32px', fontWeight: '700' }}>{presences.filter(p => p.statut === 'present').length}</div>
          <div>Présents</div>
        </Card>
        <Card>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
            {presences.filter(p => p.statut === 'retard').length}
          </div>
          <div>Retards</div>
        </Card>
        <Card>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444' }}>
            {presences.filter(p => p.statut === 'absent').length}
          </div>
          <div>Absents</div>
        </Card>
      </div>

      {/* Actions rapides */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <Bouton 
          variante="primary" 
          onClick={() => setModalQR(true)}
          icon="📱"
        >
          Scanner QR Code
        </Bouton>
        <Bouton 
          variante="light"
          onClick={() => alert("🔄 Reconnaissance faciale simulée (OpenCV en cours d'intégration)")}
        >
          👤 Reconnaissance Faciale
        </Bouton>
        <Bouton variante="light">📊 Exporter Rapport</Bouton>
      </div>

      {/* Tableau des présences */}
      <Card style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', fontWeight: '600', color: '#1e3a5f' }}>
          Registre des présences — {selectedCours ? selectedCours.nom : 'Sélectionnez un cours'}
        </div>
        <Table 
          colonnes={colonnes} 
          donnees={presences} 
          loading={loading} 
          vide="Aucune présence enregistrée pour ce cours" 
        />
      </Card>

      {/* Modal QR Code */}
      <Modal 
        titre="📲 Pointage par QR Code" 
        visible={modalQR} 
        onClose={() => { setModalQR(false); setQrCode(''); setMessage(null); }}
      >
        <form onSubmit={handlePointage}>
          <div style={{ textAlign: 'center', marginBottom: '20px', color: '#6b7280' }}>
            Scanner le QR Code étudiant ou saisir manuellement
          </div>
          
          <input
            value={qrCode}
            onChange={e => setQrCode(e.target.value)}
            placeholder="Ex: ETU2025001"
            autoFocus
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              textAlign: 'center',
              border: '2px solid #10b981',
              borderRadius: '12px',
              marginBottom: '16px'
            }}
          />

          {message && (
            <div style={{
              padding: '14px',
              borderRadius: '10px',
              marginBottom: '16px',
              background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              {message.texte}
            </div>
          )}

          <Bouton type="submit" disabled={!qrCode.trim()} style={{ width: '100%' }}>
            ✅ Valider la présence
          </Bouton>
        </form>
      </Modal>
    </Layout>
  );
};

export default Presences;
