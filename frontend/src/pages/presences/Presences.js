import React, { useState, useEffect } from 'react';

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

  const colonnes = ['Matricule', 'Nom & Prénom', 'Heure Entrée', 'Statut', 'Méthode'];

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
    }, 800);
  };

  const presents = presences.filter(p => p.statut === 'present').length;
  const taux = presences.length ? Math.round((presents / presences.length) * 100) : 0;

  return (
    <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ color: '#064e3b', marginBottom: '8px' }}>📍 Gestion des Présences</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Module 4 - Reconnaissance QR + Faciale</p>

      {/* Cours du jour */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {coursDuJour.map(c => (
          <div
            key={c.id}
            onClick={() => setSelectedCours(c)}
            style={{
              padding: '16px',
              border: selectedCours?.id === c.id ? '2px solid #10b981' : '1px solid #ddd',
              borderRadius: '12px',
              background: selectedCours?.id === c.id ? '#f0fdf4' : 'white',
              cursor: 'pointer',
              minWidth: '260px'
            }}
          >
            <strong>{c.code}</strong> - {c.nom}<br />
            <small>{c.heure} | {c.salle}</small>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ background: '#ecfdf5', padding: '16px 24px', borderRadius: '12px', flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{taux}%</div>
          <div>Taux de présence</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: '16px 24px', borderRadius: '12px', flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{presents}</div>
          <div>Présents</div>
        </div>
      </div>

      {/* Boutons actions */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setModalQR(true)}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          📱 Scanner QR Code
        </button>
        <button
          onClick={() => alert("🔄 Reconnaissance faciale OpenCV simulée (en cours d'intégration)")}
          style={{
            padding: '12px 24px',
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

      {/* Tableau */}
      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '16px 20px', background: '#f8fafc', fontWeight: '600', borderBottom: '1px solid #eee' }}>
          {selectedCours ? `${selectedCours.code} - ${selectedCours.nom}` : 'Sélectionnez un cours'}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {colonnes.map((col, i) => (
                <th key={i} style={{ padding: '14px 12px', textAlign: 'left', fontWeight: '600' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {presences.map((p, i) => (
              <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '14px 12px' }}>{p.matricule}</td>
                <td style={{ padding: '14px 12px' }}>{p.nom}</td>
                <td style={{ padding: '14px 12px' }}>{p.heure_entree || '—'}</td>
                <td style={{ padding: '14px 12px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    background: p.statut === 'present' ? '#d1fae5' : p.statut === 'retard' ? '#fef3c7' : '#fee2e2',
                    color: p.statut === 'present' ? '#065f46' : p.statut === 'retard' ? '#92400e' : '#991b1b'
                  }}>
                    {p.statut === 'present' ? '✅ Présent' : p.statut === 'retard' ? '⏰ Retard' : '❌ Absent'}
                  </span>
                </td>
                <td style={{ padding: '14px 12px' }}>{p.methode || '—'}</td>
              </tr>
            ))}
            {presences.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                  Aucune présence enregistrée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal QR */}
      {modalQR && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '30px', borderRadius: '16px',
            width: '90%', maxWidth: '420px'
          }}>
            <h3>📲 Pointage QR Code</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>Saisir ou scanner le matricule</p>

            <input
              value={qrCode}
              onChange={e => setQrCode(e.target.value)}
              placeholder="ETU2025001"
              autoFocus
              style={{
                width: '100%', padding: '16px', fontSize: '18px',
                border: '2px solid #10b981', borderRadius: '10px', marginBottom: '16px'
              }}
            />

            {message && (
              <div style={{
                padding: '12px', marginBottom: '16px', borderRadius: '8px',
                background: '#d1fae5', color: '#065f46'
              }}>
                {message.texte}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setModalQR(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }}
              >
                Annuler
              </button>
              <button
                onClick={handlePointage}
                disabled={!qrCode.trim()}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: qrCode.trim() ? '#10b981' : '#ccc',
                  color: 'white', border: 'none'
                }}
              >
                Valider Présence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presences;
