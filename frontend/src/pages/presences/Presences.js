import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';   // ← Important pour garder le sidebar

const Presences = () => {
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalQR, setModalQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [message, setMessage] = useState(null);
  const [selectedCours, setSelectedCours] = useState(null);

  const coursDuJour = [
    { id: 1, code: 'INF301', nom: 'Base de Données', heure: '08:00 - 10:00', salle: 'A101' },
    { id: 2, code: 'INF302', nom: 'Programmation Web', heure: '10:30 - 12:30', salle: 'Labo 2' },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setPresences([
        { matricule: 'ETU2025001', nom: 'RAKOTO Jean', heure_entree: '07:58', statut: 'present', methode: 'QR Code' },
        { matricule: 'ETU2025002', nom: 'RAHARISOA Fiti', heure_entree: '08:05', statut: 'present', methode: 'Facial' },
        { matricule: 'ETU2025003', nom: 'ANDRIANARIVO Sarah', heure_entree: '08:12', statut: 'retard', methode: 'Manuel' },
        { matricule: 'ETU2025004', nom: 'RAKOTOMALALA Thierry', heure_entree: '', statut: 'absent', methode: '' },
      ]);
      setLoading(false);
    }, 600);
  }, [selectedCours]);

  const handlePointage = (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setMessage({ type: 'success', texte: `✅ ${qrCode} pointé avec succès !` });

    setTimeout(() => {
      setPresences(prev => [{
        matricule: qrCode,
        nom: 'Étudiant Scanné',
        heure_entree: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        statut: 'present',
        methode: 'QR Code'
      }, ...prev]);
      setQrCode('');
      setMessage(null);
      setModalQR(false);
    }, 700);
  };

  const presents = presences.filter(p => p.statut === 'present').length;
  const taux = presences.length ? Math.round((presents / presences.length) * 100) : 0;

  return (
    <Layout titre="Gestion des Présences">
      <div style={{ padding: '10px 0' }}>
        {/* Bouton Retour Dashboard */}
        <button 
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '8px',
            marginBottom: '20px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Retour au Dashboard
        </button>

        <h1 style={{ color: '#064e3b', marginBottom: '8px' }}>📍 Gestion des Présences</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>Module 4 — QR Code + Reconnaissance Faciale</p>

        {/* Cours du jour */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {coursDuJour.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedCours(c)}
              style={{
                padding: '16px 20px',
                border: selectedCours?.id === c.id ? '2px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: '12px',
                background: selectedCours?.id === c.id ? '#f0fdf4' : 'white',
                cursor: 'pointer',
                minWidth: '280px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <strong>{c.code}</strong> — {c.nom}<br />
              <small style={{ color: '#64748b' }}>{c.heure} | {c.salle}</small>
            </div>
          ))}
        </div>

        {/* Statistiques */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '12px', flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#10b981' }}>{taux}%</div>
            <div style={{ fontSize: '15px' }}>Taux de présence aujourd'hui</div>
          </div>
          <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#10b981' }}>{presents}</div>
            <div style={{ fontSize: '15px' }}>Étudiants présents</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setModalQR(true)}
            style={{
              padding: '12px 28px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📱 Scanner QR Code
          </button>
          <button
            onClick={() => alert("👤 Reconnaissance faciale OpenCV en cours d'intégration...")}
            style={{
              padding: '12px 28px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            👤 Reconnaissance Faciale
          </button>
        </div>

        {/* Tableau des présences */}
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.07)' }}>
          <div style={{ padding: '18px 20px', background: '#f8fafc', fontWeight: '600', borderBottom: '1px solid #e2e8f0' }}>
            {selectedCours ? `${selectedCours.code} — ${selectedCours.nom}` : 'Sélectionnez un cours ci-dessus'}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '14px', textAlign: 'left' }}>Matricule</th>
                <th style={{ padding: '14px', textAlign: 'left' }}>Nom & Prénom</th>
                <th style={{ padding: '14px', textAlign: 'left' }}>Heure Entrée</th>
                <th style={{ padding: '14px', textAlign: 'left' }}>Statut</th>
                <th style={{ padding: '14px', textAlign: 'left' }}>Méthode</th>
              </tr>
            </thead>
            <tbody>
              {presences.map((p, index) => (
                <tr key={index} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px' }}>{p.matricule}</td>
                  <td style={{ padding: '14px' }}>{p.nom}</td>
                  <td style={{ padding: '14px' }}>{p.heure_entree || '—'}</td>
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      background: p.statut === 'present' ? '#d1fae5' : p.statut === 'retard' ? '#fef3c7' : '#fee2e2',
                      color: p.statut === 'present' ? '#065f46' : p.statut === 'retard' ? '#92400e' : '#991b1b'
                    }}>
                      {p.statut === 'present' ? '✅ Présent' : p.statut === 'retard' ? '⏰ Retard' : '❌ Absent'}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>{p.methode || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal QR Code */}
      {modalQR && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '420px' }}>
            <h3 style={{ marginBottom: '8px' }}>📲 Pointage par QR Code</h3>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>Saisir le matricule de l'étudiant</p>

            <input
              autoFocus
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="ETU2025001"
              style={{
                width: '100%', padding: '16px', fontSize: '18px',
                border: '2px solid #10b981', borderRadius: '10px', marginBottom: '20px'
              }}
            />

            {message && <div style={{ padding: '12px', background: '#d1fae5', borderRadius: '8px', marginBottom: '16px' }}>{message.texte}</div>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setModalQR(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                Annuler
              </button>
              <button 
                onClick={handlePointage}
                disabled={!qrCode.trim()}
                style={{ 
                  flex: 1, padding: '12px', borderRadius: '10px', 
                  background: qrCode.trim() ? '#10b981' : '#94a3b8', 
                  color: 'white', border: 'none', fontWeight: '600' 
                }}
              >
                Valider Présence
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Presences;
