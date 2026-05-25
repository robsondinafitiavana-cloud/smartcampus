/**
 * Paiements.js — Module Paiements complet
 * =========================================
 * ÉTUDIANT : Voir calendrier, cliquer pour demander paiement, télécharger reçu
 * ADMIN    : Confirmer paiements, générer calendrier, dashboard, factures PDF
 */
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Bouton from '../../components/common/Bouton';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import FormField, { selectStyle, inputStyle } from '../../components/common/FormField';
import { echeancierAPI, etudiantsAPI, authAPI } from '../../api/services';
import { formatAriary, formatDate } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

// ── Constantes ──────────────────────────────────────────────
const ORDRE  = ['inscription','M1','M2','M3','M4','M5','M6','M7','M8','M9','M10'];
const LABELS = {
  inscription:'Droits d\'inscription',
  M1:'Octobre', M2:'Novembre', M3:'Décembre', M4:'Janvier',  M5:'Février',
  M6:'Mars',    M7:'Avril',    M8:'Mai',       M9:'Juin',     M10:'Juillet',
};
const COURT = {
  inscription:'Insc.', M1:'Oct', M2:'Nov', M3:'Déc', M4:'Jan', M5:'Fév',
  M6:'Mar', M7:'Avr', M8:'Mai', M9:'Jun', M10:'Jul',
};
const STYLE_STATUT = {
  paye:       { bg:'#ecfdf5', border:'#a7f3d0', color:'#065f46', badge:'success' },
  en_attente: { bg:'#fffbeb', border:'#fde68a', color:'#92400e', badge:'warning' },
  en_retard:  { bg:'#fef2f2', border:'#fecaca', color:'#991b1b', badge:'danger'  },
};

// ── Générateur de reçu PDF dans le navigateur ────────────────
const genererFacturePDF = (echeance, etudiantInfo) => {
  const w = window.open('', '_blank');
  const date = new Date().toLocaleDateString('fr-FR', {
    day:'numeric', month:'long', year:'numeric'
  });
  w.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Reçu ${echeance.reference}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: Arial, sans-serif; color: #1c1917; background:#fff; }
        .page { max-width: 700px; margin: 0 auto; padding: 40px; }

        /* En-tête */
        .header { display:flex; justify-content:space-between; align-items:flex-start;
          padding-bottom:24px; border-bottom:3px solid #064e3b; margin-bottom:32px; }
        .logo-box { display:flex; align-items:center; gap:14px; }
        .logo-circle { width:52px; height:52px; border-radius:14px;
          background:linear-gradient(135deg,#064e3b,#047857);
          display:flex; align-items:center; justify-content:center;
          color:#fff; font-size:22px; font-weight:900; }
        .logo-text h1 { font-size:20px; color:#064e3b; font-weight:800; }
        .logo-text p  { font-size:12px; color:#78716c; margin-top:2px; }
        .recu-info { text-align:right; }
        .recu-info .num { font-size:22px; font-weight:800; color:#064e3b; }
        .recu-info .date { font-size:13px; color:#78716c; margin-top:4px; }

        /* Titre */
        .titre-section { text-align:center; margin-bottom:32px; }
        .titre-section h2 { font-size:18px; font-weight:700; color:#1c1917;
          background:#ecfdf5; padding:10px 24px; border-radius:8px;
          display:inline-block; border:1px solid #a7f3d0; }

        /* Info étudiant */
        .section { margin-bottom:28px; }
        .section-titre { font-size:11px; font-weight:700; color:#a8a29e;
          text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; }
        .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .info-item { background:#f5f5f4; padding:12px; border-radius:8px;
          border:1px solid #e7e5e4; }
        .info-item .label { font-size:11px; color:#78716c; font-weight:600;
          text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
        .info-item .value { font-size:14px; color:#1c1917; font-weight:600; }

        /* Montant */
        .montant-box { background:linear-gradient(135deg,#064e3b,#047857);
          color:#fff; border-radius:14px; padding:28px; text-align:center;
          margin-bottom:28px; }
        .montant-box .label { font-size:13px; opacity:0.8; margin-bottom:8px; }
        .montant-box .valeur { font-size:42px; font-weight:900; letter-spacing:-2px; }
        .montant-box .devise { font-size:18px; font-weight:400; opacity:0.8; }

        /* Détails paiement */
        .details-table { width:100%; border-collapse:collapse; }
        .details-table th { background:#f5f5f4; padding:10px 14px; text-align:left;
          font-size:12px; color:#78716c; font-weight:700; text-transform:uppercase;
          letter-spacing:0.5px; border-bottom:2px solid #e7e5e4; }
        .details-table td { padding:12px 14px; border-bottom:1px solid #f5f5f4;
          font-size:14px; color:#1c1917; }
        .details-table tr:last-child td { border-bottom:none; }

        /* Statut */
        .statut-paye { display:inline-flex; align-items:center; gap:6px;
          background:#ecfdf5; color:#065f46; padding:6px 16px; border-radius:99px;
          font-weight:700; font-size:14px; border:1px solid #a7f3d0; }

        /* Footer */
        .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e7e5e4;
          display:flex; justify-content:space-between; align-items:center; }
        .footer .note { font-size:11px; color:#a8a29e; max-width:300px; line-height:1.6; }
        .footer .signature { text-align:right; }
        .footer .signature .ligne { width:160px; border-top:1px solid #1c1917;
          margin-left:auto; padding-top:6px; font-size:12px; color:#78716c; }

        .stamp { position:relative; display:inline-block; margin-top:16px; }
        .stamp-circle { width:80px; height:80px; border-radius:50%;
          border:3px solid #064e3b; display:flex; flex-direction:column;
          align-items:center; justify-content:center; color:#064e3b;
          font-weight:800; font-size:10px; text-align:center; line-height:1.3; }

        @media print {
          body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          .no-print { display:none; }
        }
      </style>
    </head>
    <body>
      <div class="page">

        <!-- Bouton imprimer -->
        <div class="no-print" style="text-align:right;margin-bottom:20px;">
          <button onclick="window.print()" style="padding:10px 24px;
            background:linear-gradient(135deg,#064e3b,#047857);color:#fff;
            border:none;border-radius:10px;font-size:14px;font-weight:700;
            cursor:pointer;">🖨️ Imprimer / Télécharger PDF</button>
        </div>

        <!-- En-tête -->
        <div class="header">
          <div class="logo-box">
            <div class="logo-circle">S</div>
            <div class="logo-text">
              <h1>SmartCampus</h1>
              <p>Inside University — Madagascar</p>
            </div>
          </div>
          <div class="recu-info">
            <div class="num">REÇU N° ${echeance.reference || 'SC-XXXXXXXX'}</div>
            <div class="date">Émis le ${date}</div>
          </div>
        </div>

        <!-- Titre -->
        <div class="titre-section">
          <h2>✅ Reçu de Paiement — ${LABELS[echeance.type_echeance] || echeance.type_echeance}</h2>
        </div>

        <!-- Infos étudiant -->
        <div class="section">
          <div class="section-titre">Informations de l'étudiant</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Nom complet</div>
              <div class="value">${etudiantInfo?.nom || ''} ${etudiantInfo?.prenom || ''}</div>
            </div>
            <div class="info-item">
              <div class="label">Matricule</div>
              <div class="value">${etudiantInfo?.matricule || '—'}</div>
            </div>
            <div class="info-item">
              <div class="label">Filière</div>
              <div class="value">${etudiantInfo?.filiere_nom || '—'}</div>
            </div>
            <div class="info-item">
              <div class="label">Niveau</div>
              <div class="value">${etudiantInfo?.niveau || '—'}</div>
            </div>
          </div>
        </div>

        <!-- Montant -->
        <div class="montant-box">
          <div class="label">Montant payé</div>
          <div class="valeur">
            ${Number(echeance.montant).toLocaleString('fr-FR')}
            <span class="devise"> Ar</span>
          </div>
        </div>

        <!-- Détails -->
        <div class="section">
          <div class="section-titre">Détails du paiement</div>
          <table class="details-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th>Période</th>
                <th>Date de paiement</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${LABELS[echeance.type_echeance] || echeance.type_echeance}</strong></td>
                <td>Année scolaire ${echeance.annee_scolaire}</td>
                <td>${echeance.date_paiement ? formatDate(echeance.date_paiement) : date}</td>
                <td><span class="statut-paye">✅ Payé</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="note">
            Ce reçu constitue une preuve officielle de paiement.<br/>
            Conservez ce document pour vos archives.<br/>
            Pour toute réclamation : administration@smartcampus.mg
          </div>
          <div class="signature">
            <div class="stamp">
              <div class="stamp-circle">
                <span>INSIDE</span>
                <span>UNIVERSITY</span>
                <span>✓ PAYÉ</span>
              </div>
            </div>
            <div class="ligne">Service Financier</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
  w.document.close();
};

// ════════════════════════════════════════════════════════════
// COMPOSANT CARTE ECHÉANCE (étudiant)
// ════════════════════════════════════════════════════════════
const CarteEcheance = ({ echeance, onClick }) => {
  const s = STYLE_STATUT[echeance.statut] || STYLE_STATUT.en_attente;
  const cliquable = echeance.statut !== 'paye';

  return (
    <div
      onClick={() => cliquable && onClick(echeance)}
      style={{
        border:`2px solid ${s.border}`, borderRadius:'12px',
        background:s.bg, padding:'12px 10px', textAlign:'center',
        cursor: cliquable ? 'pointer' : 'default',
        transition:'all 0.2s', userSelect:'none',
      }}
      onMouseEnter={e => { if(cliquable){ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,0.12)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
      <div style={{ fontSize:'22px', marginBottom:'4px' }}>
        {echeance.statut==='paye' ? '✅' : echeance.statut==='en_retard' ? '🔴' : '⏳'}
      </div>
      <div style={{ fontWeight:'800', fontSize:'13px', color:s.color }}>
        {COURT[echeance.type_echeance]}
      </div>
      <div style={{ fontSize:'11px', color:s.color, marginTop:'3px', fontWeight:'600' }}>
        {Number(echeance.montant).toLocaleString('fr-FR')} Ar
      </div>
      {echeance.statut === 'paye' && (
        <div style={{ fontSize:'10px', color:'#059669', marginTop:'3px', fontWeight:'600' }}>
          {formatDate(echeance.date_paiement)}
        </div>
      )}
      {echeance.statut !== 'paye' && echeance.date_echeance && (
        <div style={{ fontSize:'10px', color:s.color, marginTop:'3px', opacity:0.8 }}>
          Limite: {formatDate(echeance.date_echeance)}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════
const Paiements = () => {
  const { estAdmin, estEtudiant, utilisateur } = useAuth();
  const [annee, setAnnee] = useState('2025-2026');

  // État étudiant
  const [echeancier,    setEcheancier]    = useState([]);
  const [etudiantProfil, setEtudiantProfil] = useState(null);
  const [etudiantId,    setEtudiantId]    = useState(null);
  const [modalDemande,  setModalDemande]  = useState(false);
  const [echeanceSel,   setEcheanceSel]   = useState(null);
  const [modePaiement,  setModePaiement]  = useState('especes');

  // État admin
  const [dashboard,       setDashboard]       = useState(null);
  const [etudiants,       setEtudiants]        = useState([]);
  const [retards,         setRetards]          = useState([]);
  const [etudiantSelId,   setEtudiantSelId]    = useState('');
  const [echeancierAdmin, setEcheancierAdmin]  = useState([]);
  const [etudiantSelProfil, setEtudiantSelProfil] = useState(null);
  const [modalGenerer,    setModalGenerer]     = useState(false);
  const [modalConfirmer,  setModalConfirmer]   = useState(false);
  const [echeanceAConfirmer, setEcheanceAConfirmer] = useState(null);
  const [modeConfirm,     setModeConfirm]      = useState('especes');
  const [genererData,     setGenererData]      = useState({
    etudiant_id:'', annee_scolaire:'2025-2026',
    montant_inscription:150000, montant_mensuel:80000
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (estEtudiant) chargerEtudiant();
    else chargerAdmin();
  }, [annee]); // eslint-disable-line

  // ── Chargement étudiant ──────────────────────────────────
  const chargerEtudiant = async () => {
    setLoading(true);
    try {
      let id = utilisateur?.profil_id;
      if (!id) {
        const p = await authAPI.monProfil();
        id = p.data.profil_id;
        setEtudiantProfil(p.data.profil);
      }
      setEtudiantId(id);
      if (id) {
        const [echRes, etuRes] = await Promise.allSettled([
          echeancierAPI.getCalendrier(id, annee),
          authAPI.monProfil(),
        ]);
        if (echRes.status === 'fulfilled') setEcheancier(echRes.value.data.results || echRes.value.data);
        if (etuRes.status === 'fulfilled') setEtudiantProfil(etuRes.value.data.profil);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  // ── Chargement admin ─────────────────────────────────────
  const chargerAdmin = async () => {
    setLoading(true);
    try {
      const [dashRes, etuRes, retardsRes] = await Promise.allSettled([
        echeancierAPI.getDashboard(annee),
        etudiantsAPI.getListe(),
        echeancierAPI.getRetards(annee),
      ]);
      if (dashRes.status === 'fulfilled')    setDashboard(dashRes.value.data);
      if (etuRes.status === 'fulfilled')     setEtudiants(etuRes.value.data.results || etuRes.value.data);
      if (retardsRes.status === 'fulfilled') setRetards(retardsRes.value.data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const chargerCalendrierAdmin = async (id) => {
    if (!id) return;
    try {
      const [echRes, etuRes] = await Promise.allSettled([
        echeancierAPI.getCalendrier(id, annee),
        etudiantsAPI.getUn(id),
      ]);
      if (echRes.status === 'fulfilled') setEcheancierAdmin(echRes.value.data.results || echRes.value.data);
      if (etuRes.status === 'fulfilled') setEtudiantSelProfil(etuRes.value.data);
    } catch(e) { console.error(e); }
  };

  // ── Admin confirme un paiement ───────────────────────────
  const confirmerPaiement = async () => {
    if (!echeanceAConfirmer) return;
    try {
      const res = await echeancierAPI.payer(echeanceAConfirmer.id, modeConfirm);
      setModalConfirmer(false);
      chargerAdmin();
      if (etudiantSelId) chargerCalendrierAdmin(etudiantSelId);
      // Proposer de télécharger la facture
      const ech = res.data.echeance;
      const etu = etudiants.find(e => e.id === parseInt(etudiantSelId));
      if (window.confirm('✅ Paiement confirmé ! Voulez-vous générer la facture PDF ?')) {
        genererFacturePDF(ech, etu);
      }
    } catch(e) {
      alert('Erreur : ' + (e.response?.data?.erreur || 'Erreur serveur'));
    }
  };

  // ── Générer calendrier ───────────────────────────────────
  const handleGenerer = async (e) => {
    e.preventDefault();
    try {
      await echeancierAPI.generer(genererData);
      setModalGenerer(false);
      chargerAdmin();
      if (genererData.etudiant_id) {
        setEtudiantSelId(genererData.etudiant_id);
        chargerCalendrierAdmin(genererData.etudiant_id);
      }
    } catch(err) {
      alert('Erreur : ' + JSON.stringify(err.response?.data || 'Erreur'));
    }
  };

  // Trier les échéances dans l'ordre logique
  const echeancierOrdonne = (liste) =>
    ORDRE.map(code => liste.find(e => e.type_echeance === code)).filter(Boolean);

  const getTotaux = (liste) => ({
    paye:    liste.filter(e => e.statut === 'paye').length,
    attente: liste.filter(e => e.statut === 'en_attente').length,
    retard:  liste.filter(e => e.statut === 'en_retard').length,
    montantPaye: liste.filter(e => e.statut === 'paye').reduce((s,e) => s + Number(e.montant), 0),
    montantDu:   liste.filter(e => e.statut !== 'paye').reduce((s,e) => s + Number(e.montant), 0),
  });

  // ════════════════════════════════════════════════════════
  // VUE ÉTUDIANT
  // ════════════════════════════════════════════════════════
  if (estEtudiant) {
    const liste  = echeancierOrdonne(echeancier);
    const totaux = getTotaux(liste);
    const inscri = liste.find(e => e.type_echeance === 'inscription');
    const mois   = liste.filter(e => e.type_echeance !== 'inscription');

    return (
      <Layout titre="💳 Mes Paiements" sousTitre={`Année scolaire ${annee}`}>
        {loading ? (
          <div style={{textAlign:'center',padding:'60px',color:'#a8a29e'}}>⏳ Chargement...</div>
        ) : liste.length === 0 ? (
          <Card>
            <div style={{textAlign:'center',padding:'48px',color:'#a8a29e'}}>
              <div style={{fontSize:'40px',marginBottom:'12px'}}>📭</div>
              <div style={{fontWeight:'700',fontSize:'16px',color:'#78716c',marginBottom:'8px'}}>
                Aucun calendrier de paiement
              </div>
              <p style={{fontSize:'14px'}}>Contactez l'administration pour générer votre calendrier.</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div style={{display:'flex',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
              <StatCard icone="✅" couleur="#059669" valeur={totaux.paye}
                label="Payés" sousTitre={formatAriary(totaux.montantPaye)}/>
              <StatCard icone="⏳" couleur="#f59e0b" valeur={totaux.attente} label="En attente"/>
              <StatCard icone="🔴" couleur="#ef4444" valeur={totaux.retard}
                label="En retard" sousTitre={totaux.retard>0?'Urgent !':''}/>
              <StatCard icone="💰" couleur="#1c1917"
                valeur={formatAriary(totaux.montantDu)} label="Reste à payer"/>
            </div>

            {/* Droits d'inscription */}
            {inscri && (
              <Card titre="Droits d'inscription" accent="#6366f1" style={{marginBottom:'20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'16px'}}>
                  <div>
                    <div style={{fontSize:'28px',fontWeight:'900',color:'#1c1917'}}>
                      {formatAriary(inscri.montant)}
                    </div>
                    <div style={{fontSize:'13px',color:'#78716c',marginTop:'4px'}}>
                      Limite : {formatDate(inscri.date_echeance)}
                    </div>
                    {inscri.statut==='paye' && inscri.reference && (
                      <div style={{fontSize:'12px',color:'#a8a29e',marginTop:'4px'}}>
                        Réf: {inscri.reference}
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
                    {inscri.statut === 'paye' ? (
                      <>
                        <Badge type="success">✅ Payé le {formatDate(inscri.date_paiement)}</Badge>
                        <Bouton variante="ghost" petit
                          onClick={() => genererFacturePDF(inscri, etudiantProfil)}>
                          🖨️ Télécharger reçu
                        </Bouton>
                      </>
                    ) : (
                      <Bouton variante={inscri.statut==='en_retard'?'danger':'primary'}
                        onClick={() => { setEcheanceSel(inscri); setModalDemande(true); }}>
                        {inscri.statut==='en_retard' ? '🔴 Payer maintenant' : '💳 Payer les droits'}
                      </Bouton>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Mensualités */}
            <Card titre="📅 Mensualités de l'année" accent="#10b981">
              <div style={{
                display:'grid', gridTemplateColumns:'repeat(5,1fr)',
                gap:'12px', marginBottom:'16px'
              }}>
                {mois.map(ech => (
                  <CarteEcheance key={ech.id} echeance={ech}
                    onClick={e => { setEcheanceSel(e); setModalDemande(true); }} />
                ))}
              </div>

              {/* Légende */}
              <div style={{
                display:'flex',gap:'20px',padding:'12px 16px',
                background:'#f5f5f4',borderRadius:'10px',
                flexWrap:'wrap',fontSize:'12px',color:'#78716c'
              }}>
                <span style={{fontWeight:'600'}}>
                  💡 Cliquez sur un mois non payé pour notifier l'administration
                </span>
                {[
                  {i:'✅',l:'Payé',c:'#059669'},
                  {i:'⏳',l:'En attente',c:'#d97706'},
                  {i:'🔴',l:'En retard',c:'#dc2626'},
                ].map(x=>(
                  <span key={x.l} style={{display:'flex',alignItems:'center',gap:'4px',
                    color:x.c,fontWeight:'600'}}>{x.i} {x.l}</span>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* Modal : Demande paiement étudiant */}
        <Modal titre="💳 Notifier un paiement"
          visible={modalDemande} onClose={() => setModalDemande(false)}>
          {echeanceSel && (
            <div>
              {/* Récap de l'échéance */}
              <div style={{
                background:'linear-gradient(135deg,#064e3b,#047857)',
                borderRadius:'14px', padding:'24px', marginBottom:'20px',
                textAlign:'center', color:'#fff'
              }}>
                <div style={{fontSize:'14px',opacity:0.8,marginBottom:'6px'}}>
                  {LABELS[echeanceSel.type_echeance]}
                </div>
                <div style={{fontSize:'36px',fontWeight:'900',letterSpacing:'-1px'}}>
                  {formatAriary(echeanceSel.montant)}
                </div>
                <div style={{fontSize:'12px',opacity:0.7,marginTop:'6px'}}>
                  Année {echeanceSel.annee_scolaire} · Limite : {formatDate(echeanceSel.date_echeance)}
                </div>
              </div>

              <div style={{
                background:'#fffbeb',border:'1px solid #fde68a',
                borderRadius:'10px',padding:'14px',marginBottom:'20px',
                fontSize:'13px',color:'#92400e',lineHeight:1.6
              }}>
                ℹ️ En cliquant sur <strong>"Notifier l'administration"</strong>, vous informez
                le service financier que vous avez effectué ce paiement.
                La confirmation officielle sera faite par l'administration,
                qui générera votre reçu.
              </div>

              <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
                <Bouton variante="light" onClick={() => setModalDemande(false)}>Annuler</Bouton>
                <Bouton variante="primary" onClick={() => {
                  setModalDemande(false);
                  alert('✅ L\'administration a été notifiée de votre paiement de ' +
                    formatAriary(echeanceSel.montant) + '. Votre reçu sera disponible après confirmation.');
                }}>
                  📢 Notifier l'administration
                </Bouton>
              </div>
            </div>
          )}
        </Modal>
      </Layout>
    );
  }

  // ════════════════════════════════════════════════════════
  // VUE ADMIN
  // ════════════════════════════════════════════════════════
  const totauxAdmin = getTotaux(echeancierAdmin);

  return (
    <Layout
      titre="💳 Gestion des Paiements"
      sousTitre={`Année scolaire ${annee}`}
      actions={
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <select value={annee} onChange={e => setAnnee(e.target.value)}
            style={{...selectStyle,width:'140px',padding:'8px 12px',fontSize:'13px'}}>
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
          <Bouton variante="primary" onClick={() => setModalGenerer(true)}>
            + Générer calendrier
          </Bouton>
        </div>
      }
    >
      {/* Dashboard financier */}
      {dashboard && (
        <div style={{display:'flex',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
          <StatCard icone="💰" couleur="#059669"
            valeur={formatAriary(dashboard.total_encaisse)}
            label="Total encaissé"
            sousTitre={`Taux : ${dashboard.taux_recouvrement}%`}/>
          <StatCard icone="📋" couleur="#6366f1"
            valeur={formatAriary(dashboard.total_attendu)}
            label="Total attendu"/>
          <StatCard icone="⏳" couleur="#f59e0b"
            valeur={formatAriary(dashboard.montant_restant_du)}
            label="Restant dû"/>
          <StatCard icone="🔴" couleur="#ef4444"
            valeur={dashboard.nb_etudiants_en_dette}
            label="Étudiants en dette"
            sousTitre={`${dashboard.nb_retards} échéances`}/>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'20px'}}>

        {/* Calendrier par étudiant */}
        <Card titre="Calendrier d'un étudiant" accent="#059669">
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'13px',fontWeight:'600',
              color:'#44403c',marginBottom:'8px'}}>Sélectionner un étudiant</label>
            <select
              value={etudiantSelId}
              onChange={e => {
                setEtudiantSelId(e.target.value);
                chargerCalendrierAdmin(e.target.value);
              }}
              style={{...selectStyle,width:'100%',padding:'10px 14px'}}
            >
              <option value="">— Choisir un étudiant —</option>
              {etudiants.map(e => (
                <option key={e.id} value={e.id}>
                  {e.matricule} — {e.nom} {e.prenom}
                </option>
              ))}
            </select>
          </div>

          {etudiantSelId && echeancierAdmin.length > 0 ? (
            <>
              {/* Résumé */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'16px'}}>
                {[
                  {l:'Payé',   v:totauxAdmin.paye,   c:'#059669', bg:'#ecfdf5'},
                  {l:'Attente',v:totauxAdmin.attente, c:'#d97706', bg:'#fffbeb'},
                  {l:'Retard', v:totauxAdmin.retard,  c:'#dc2626', bg:'#fef2f2'},
                ].map(i=>(
                  <div key={i.l} style={{textAlign:'center',padding:'10px',borderRadius:'10px',
                    background:i.bg,border:`1px solid ${i.c}30`}}>
                    <div style={{fontWeight:'900',fontSize:'22px',color:i.c}}>{i.v}</div>
                    <div style={{fontSize:'11px',color:'#78716c',marginTop:'2px'}}>{i.l}</div>
                  </div>
                ))}
              </div>

              {/* Grille des échéances */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px'}}>
                {echeancierOrdonne(echeancierAdmin).map(ech => {
                  const s = STYLE_STATUT[ech.statut] || STYLE_STATUT.en_attente;
                  return (
                    <div key={ech.id} style={{
                      border:`2px solid ${s.border}`,borderRadius:'10px',
                      background:s.bg,padding:'10px',textAlign:'center'
                    }}>
                      <div style={{fontWeight:'800',fontSize:'12px',color:s.color}}>
                        {COURT[ech.type_echeance]}
                      </div>
                      <div style={{fontSize:'11px',color:'#78716c',marginTop:'2px'}}>
                        {Number(ech.montant).toLocaleString('fr-FR')} Ar
                      </div>
                      {ech.statut === 'paye' ? (
                        <div style={{marginTop:'6px',display:'flex',flexDirection:'column',gap:'4px'}}>
                          <div style={{fontSize:'10px',color:'#059669',fontWeight:'700'}}>✅ Payé</div>
                          <button
                            onClick={() => genererFacturePDF(ech, etudiantSelProfil)}
                            style={{
                              padding:'3px 6px',background:'#ecfdf5',
                              border:'1px solid #a7f3d0',borderRadius:'6px',
                              color:'#065f46',fontSize:'10px',cursor:'pointer',fontWeight:'600'
                            }}>
                            🖨️ Reçu
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEcheanceAConfirmer(ech); setModeConfirm('especes'); setModalConfirmer(true); }}
                          style={{
                            display:'block',width:'100%',marginTop:'6px',
                            padding:'5px',
                            background:'linear-gradient(135deg,#059669,#047857)',
                            color:'#fff',border:'none',borderRadius:'6px',
                            fontSize:'11px',fontWeight:'700',cursor:'pointer',
                            boxShadow:'0 2px 8px rgba(5,150,105,0.35)'
                          }}
                        >✅ Payer</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : etudiantSelId ? (
            <div style={{textAlign:'center',padding:'24px',color:'#a8a29e'}}>
              <div style={{marginBottom:'10px'}}>Aucun calendrier pour cet étudiant.</div>
              <Bouton variante="primary" petit onClick={() => {
                setGenererData(d => ({...d, etudiant_id:etudiantSelId}));
                setModalGenerer(true);
              }}>
                + Générer le calendrier
              </Bouton>
            </div>
          ) : (
            <div style={{textAlign:'center',padding:'24px',color:'#a8a29e',fontSize:'14px'}}>
              Sélectionnez un étudiant pour voir son calendrier
            </div>
          )}
        </Card>

        {/* Paiements en retard */}
        <Card titre="⚠️ Paiements en retard" accent="#ef4444"
          badge={<Badge type="danger" dot>{retards.length}</Badge>}
          noPadding>
          {retards.length === 0 ? (
            <div style={{textAlign:'center',padding:'40px',color:'#a8a29e'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>✅</div>
              <div style={{fontWeight:'600',color:'#78716c'}}>Aucun retard de paiement</div>
            </div>
          ) : (
            <Table
              colonnes={[
                {key:'etudiant_nom', label:'Étudiant'},
                {key:'label',        label:'Échéance'},
                {key:'montant',      label:'Montant', render:v=>formatAriary(v)},
                {key:'statut',       label:'Statut',
                  render:v=><Badge type={STYLE_STATUT[v]?.badge||'muted'}>{v.replace('_',' ')}</Badge>},
              ]}
              donnees={retards}
              loading={false}
              actions={row => (
                <Bouton variante="success" petit onClick={() => {
                  setEcheanceAConfirmer(row);
                  setModeConfirm('especes');
                  setModalConfirmer(true);
                }}>✅ Confirmer</Bouton>
              )}
            />
          )}
        </Card>
      </div>

      {/* ── Modal : Confirmer paiement (Admin) ── */}
      <Modal titre="✅ Confirmer le paiement"
        visible={modalConfirmer} onClose={() => setModalConfirmer(false)}>
        {echeanceAConfirmer && (
          <div>
            {/* Récap */}
            <div style={{
              background:'linear-gradient(135deg,#064e3b,#047857)',
              borderRadius:'14px',padding:'24px',marginBottom:'20px',
              textAlign:'center',color:'#fff'
            }}>
              <div style={{fontSize:'13px',opacity:0.8,marginBottom:'6px'}}>
                {LABELS[echeanceAConfirmer.type_echeance] || echeanceAConfirmer.type_echeance}
              </div>
              <div style={{fontSize:'36px',fontWeight:'900',letterSpacing:'-1px'}}>
                {formatAriary(echeanceAConfirmer.montant)}
              </div>
              <div style={{fontSize:'12px',opacity:0.7,marginTop:'6px'}}>
                {echeanceAConfirmer.etudiant_nom || 'Étudiant'}
              </div>
            </div>

            {/* Mode de paiement */}
            <FormField label="Mode de paiement">
              <select value={modeConfirm} onChange={e => setModeConfirm(e.target.value)}
                style={{...selectStyle,padding:'10px 14px'}}>
                <option value="especes">💵 Espèces</option>
                <option value="mobile_money">📱 Mobile Money</option>
                <option value="virement">🏦 Virement bancaire</option>
              </select>
            </FormField>

            <div style={{
              background:'#f0fdf4',border:'1px solid #a7f3d0',borderRadius:'10px',
              padding:'12px',marginBottom:'20px',fontSize:'13px',color:'#065f46'
            }}>
              ✅ Après confirmation, un reçu PDF sera généré automatiquement.
            </div>

            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <Bouton variante="light" onClick={() => setModalConfirmer(false)}>Annuler</Bouton>
              <Bouton variante="primary" onClick={confirmerPaiement}>
                ✅ Confirmer et générer le reçu
              </Bouton>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal : Générer calendrier ── */}
      <Modal titre="📅 Générer un calendrier de paiement"
        visible={modalGenerer} onClose={() => setModalGenerer(false)}>
        <form onSubmit={handleGenerer}>
          <FormField label="Étudiant" required>
            <select value={genererData.etudiant_id}
              onChange={e => setGenererData(d => ({...d,etudiant_id:e.target.value}))}
              style={{...selectStyle,padding:'10px 14px'}}>
              <option value="">— Choisir un étudiant —</option>
              {etudiants.map(e => (
                <option key={e.id} value={e.id}>{e.matricule} — {e.nom} {e.prenom}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Année scolaire">
            <select value={genererData.annee_scolaire}
              onChange={e => setGenererData(d => ({...d,annee_scolaire:e.target.value}))}
              style={{...selectStyle,padding:'10px 14px'}}>
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <FormField label="Droits d'inscription (Ar)">
              <input type="number" value={genererData.montant_inscription}
                onChange={e => setGenererData(d => ({...d,montant_inscription:e.target.value}))}
                style={inputStyle}/>
            </FormField>
            <FormField label="Mensualité (Ar)">
              <input type="number" value={genererData.montant_mensuel}
                onChange={e => setGenererData(d => ({...d,montant_mensuel:e.target.value}))}
                style={inputStyle}/>
            </FormField>
          </div>
          <div style={{
            background:'#f0fdf4',borderRadius:'10px',padding:'12px',
            marginBottom:'16px',fontSize:'13px',color:'#065f46',border:'1px solid #a7f3d0'
          }}>
            📅 Génère : 1 droit d'inscription + 10 mensualités (Octobre → Juillet)
          </div>
          <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
            <Bouton variante="light" onClick={() => setModalGenerer(false)}>Annuler</Bouton>
            <Bouton type="submit" variante="primary">✅ Générer</Bouton>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Paiements;