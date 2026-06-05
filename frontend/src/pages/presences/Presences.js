import React, { useState, useEffect } from 'react';

const Presences = () => {
  const [presences, setPresences] = useState([]);
  const [modalQR, setModalQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [message, setMessage] = useState(null);
  const [selectedCours, setSelectedCours] = useState(null);

  const coursDuJour = [
    { id: 1, code: 'INF301', nom: 'Base de Données', heure: '08:00 - 10:00', salle: 'A101' },
    { id: 2, code: 'INF302', nom: 'Programmation Web', heure: '10:30 - 12:30', salle: 'Labo 2' },
  ];

  useEffect(() => {
    setPresences([
      { matricule: 'ETU2025001', nom: 'RAKOTO Jean', heure_entree: '07:58', statut: 'present', methode: 'QR Code' },
      { matricule: 'ETU2025002', nom: 'RAHARISOA Fiti', heure_entree: '08:05', statut: 'present', methode: 'Facial' },
      { matricule: 'ETU2025003', nom: 'ANDRIANARIVO Sarah', heure_entree: '08:12', statut: 'retard', methode: 'Manuel' },
      { matricule: 'ETU2025004', nom: 'RAKOTOMALALA Thierry', heure_entree: '', statut: 'absent', methode: '' },
    ]);
  }, [selectedCours]);

  const handlePointage = (e) => {
    e.preventDefault();
    if (!qrCode) return;

    setMessage(`✅ Étudiant ${qrCode} pointé avec succès !`);

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
    }, 600);
  };

  const presents = presences.filter(p => p.statut === 'present').length;
  const taux = presences.length ? Math.round((presents / presences.length) * 100) : 0;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => window.history.back()}
          style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          ← Retour au Dashboard
        </button>
      </div>

      <h1 style={{ color: '#064e3b' }}>📍 Gestion des Présences</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Module 4 — QR Code + Reconnaissance Faciale</p>

      {/* Cours */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {coursDuJour.map(c => (
          <div
            key={c.id}
            onClick={() => setSelectedCours(c)}
            style={{
              padding: '16px',
              border: selectedCours?.id === c.id ? '2px solid #10b981' : '1px solid #ccc',
              borderRadius: '10px',
              background: selectedCours?.id === c.id ? '#f0fdf4' : 'white',
              cursor: 'pointer',
              minWidth: '260px'
            }}
          >
            <strong>{c.code}</strong> — {c.nom}<br />
            <small>{c.heure} | {c.salle}</small>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '12px', flex: 1 }}>
          <h2 style={{ margin: 0, color: '#10b981' }}>{taux}%</h2>
          <p>Taux de présence</p>
        </div>
        <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', flex: 1 }}>
          <h2 style={{ margin: 0 }}>{presents} / {presences.length}</h2>
          <p>Présents</p>
        </div>
      </div>

      {/* Boutons */}
      <div style={{ marginBottom: '25px' }}>
        <button
          onClick={() => setModalQR(true)}
          style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', marginRight: '10px', cursor: 'pointer' }}
        >
          📱 Scanner QR Code
        </button>
        <button
          onClick={() => alert("Reconnaissance faciale (OpenCV) simulée")}
          style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          👤 Reconnaissance Faciale
        </button>
      </div>

      {/* Tableau */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ padding: '14px', textAlign: 'left' }}>Matricule</th>
            <th style={{ padding: '14px', textAlign: 'left' }}>Nom</th>
            <th style={{ padding: '14px', textAlign: 'left' }}>Heure Entrée</th>
            <th style={{ padding: '14px', textAlign: 'left' }}>Statut</th>
            <th style={{ padding: '14px', textAlign: 'left' }}>Méthode</th>
          </tr>
        </thead>
        <tbody>
          {presences.map((p, i) => (
            <tr key={i} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: '14px' }}>{p.matricule}</td>
              <td style={{ padding: '14px' }}>{p.nom}</td>
              <td style={{ padding: '14px' }}>{p.heure_entree || '—'}</td>
              <td style={{ padding: '14px' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: p.statut === 'present' ? '#d1fae5' : '#fee2e2',
                  color: p.statut === 'present' ? '#065f46' : '#991b1b'
                }}>
                  {p.statut === 'present' ? '✅ Présent' : '❌ Absent'}
                </span>
              </td>
              <td style={{ padding: '14px' }}>{p.methode}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal QR */}
      {modalQR && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px' }}>
            <h3>Scanner QR Code</h3>
            <input
              value={qrCode}
              onChange={e => setQrCode(e.target.value)}
              placeholder="ETU2025001"
              style={{ width: '100%', padding: '14px', margin: '15px 0', fontSize: '17px' }}
              autoFocus
            />
            {message && <p style={{ color: 'green' }}>{message}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModalQR(false)} style={{ flex: 1, padding: '12px' }}>Annuler</button>
              <button onClick={handlePointage} style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none' }}>Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presences;
