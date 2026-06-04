/**
 * TestAdmission.js — Test d'Admission Intelligent (IA)
 * ======================================================
 * Remplace les questions statiques par un QCM dynamique
 * généré par Flask IA (banque de questions + mélange).
 * 
 * Flux :
 *  1. Étape "choix"    → choisir filière
 *  2. Étape "infos"    → saisir nom/prénom/email
 *  3. Étape "chargement" → appel Flask IA pour générer QCM
 *  4. Étape "test"     → répondre aux questions
 *  5. Étape "resultat" → score + envoi demande si admis
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { admissionIAAPI } from '../../api/services';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const FILIERES_INFO = {
  INF: { nom: 'Informatique', icone: '💻', couleur: '#059669', couleur2: '#047857' },
  GST: { nom: 'Gestion',      icone: '📊', couleur: '#6366f1', couleur2: '#4f46e5' },
  DRT: { nom: 'Droit',        icone: '⚖️', couleur: '#dc2626', couleur2: '#b91c1c' },
};

const SEUIL = 60;

const TestAdmission = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const filiereParam   = searchParams.get('filiere');

  const [etape,        setEtape]        = useState(filiereParam ? 'infos' : 'choix');
  const [filiere,      setFiliere]      = useState(filiereParam?.toUpperCase() || '');
  const [candidat,     setCandidat]     = useState({ nom: '', prenom: '', email: '', contact: '' });

  // QCM dynamique depuis Flask IA
  const [questions,     setQuestions]     = useState([]);
  const [sessionToken,  setSessionToken]  = useState('');
  const [pointsTotal,   setPointsTotal]   = useState(0);
  const [loadingQCM,    setLoadingQCM]    = useState(false);
  const [erreurQCM,     setErreurQCM]     = useState('');

  const [reponses,     setReponses]     = useState({});
  const [questionIdx,  setQuestionIdx]  = useState(0);
  const [resultat,     setResultat]     = useState(null);
  const [tempsRestant, setTempsRestant] = useState(20 * 60);
  const [timerActif,   setTimerActif]   = useState(false);
  const [envoi,        setEnvoi]        = useState({ loading: false, fait: false, erreur: '' });

  // Timer
  const soumettreTest = useCallback(() => {
    setTimerActif(false);
    setEtape('evaluation');
  }, []);

  useEffect(() => {
    if (!timerActif) return;
    if (tempsRestant <= 0) { soumettreTest(); return; }
    const t = setInterval(() => setTempsRestant(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timerActif, tempsRestant, soumettreTest]);

  // Évaluer quand on passe en étape "evaluation"
  useEffect(() => {
    if (etape === 'evaluation') evaluerReponses();
  }, [etape]); // eslint-disable-line

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Charger le QCM depuis Flask IA ─────────────────────────────────────
  const chargerQCM = async () => {
    setLoadingQCM(true); setErreurQCM('');
    try {
      const res = await admissionIAAPI.genererQuestions(filiere, 15, candidat.email || candidat.nom);
      setQuestions(res.data.questions);
      setSessionToken(res.data.session_token);
      setPointsTotal(res.data.points_total);
      setTempsRestant(res.data.duree_minutes * 60);
      setReponses({}); setQuestionIdx(0);
      setTimerActif(true);
      setEtape('test');
    } catch (err) {
      const msg = err.response?.data?.erreur || 'Erreur lors du chargement des questions.';
      setErreurQCM(msg);
    } finally {
      setLoadingQCM(false);
    }
  };

  // ── Évaluer les réponses via Flask IA ────────────────────────────────
  const evaluerReponses = async () => {
    try {
      const reponsesStr = {};
      Object.entries(reponses).forEach(([k, v]) => { reponsesStr[String(k)] = v; });

      const res = await admissionIAAPI.evaluer(
        candidat.email || candidat.nom,
        filiere, sessionToken, reponsesStr
      );
      setResultat(res.data);
      setEtape('resultat');
    } catch (err) {
      // Fallback calcul local si Flask IA indisponible
      let pts = 0;
      questions.forEach((q, i) => {
        if (reponses[i] !== undefined) pts += (reponses[i] === -1 ? 0 : q.points || 1);
      });
      const score = Math.round((Object.keys(reponses).length / questions.length) * 100);
      setResultat({ score, admis: score >= SEUIL, nb_bonnes: 0, nb_questions: questions.length, niveau: score >= 85 ? 'Excellent' : score >= 60 ? 'Passable' : 'Insuffisant', message: score >= SEUIL ? '✅ Admis(e)' : '❌ Score insuffisant' });
      setEtape('resultat');
    }
  };

  const envoyerDemande = async () => {
    setEnvoi({ loading: true, fait: false, erreur: '' });
    try {
      await axios.post(`${API}/demandes/soumettre/`, {
        nom: candidat.nom, prenom: candidat.prenom,
        email: candidat.email, contact: candidat.contact,
        filiere,
        score_test: resultat.score,
        nb_bonnes: resultat.nb_bonnes || 0,
        nb_questions: resultat.nb_questions || 15,
      });
      setEnvoi({ loading: false, fait: true, erreur: '' });
    } catch (err) {
      const msg = err.response?.data?.email?.[0] || 'Erreur lors de l\'envoi. Réessayez.';
      setEnvoi({ loading: false, fait: false, erreur: msg });
    }
  };

  const f  = FILIERES_INFO[filiere];
  const timerCouleur = tempsRestant < 300 ? '#ef4444' : tempsRestant < 600 ? '#f59e0b' : '#059669';

  // ── CHOIX FILIÈRE ──────────────────────────────────────────────────────
  if (etape === 'choix') return (
    <div style={{ minHeight: '100vh', background: '#f5f5f4' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#064e3b,#047857)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '900', color: '#fff' }}>S</div>
          <span style={{ fontWeight: '700', color: '#1c1917', fontSize: '15px' }}>SmartCampus</span>
        </button>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#78716c', cursor: 'pointer', fontSize: '14px' }}>← Retour</button>
      </nav>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🤖</div>
          <h1 style={{ fontSize: '34px', fontWeight: '900', color: '#1c1917', letterSpacing: '-1px', marginBottom: '12px' }}>Test d'admission — IA</h1>
          <p style={{ fontSize: '15px', color: '#78716c', lineHeight: 1.7, maxWidth: '500px' }}>
            Questions générées dynamiquement par intelligence artificielle.<br />
            <strong>15 questions</strong> · Score minimum : <strong style={{ color: '#059669' }}>60%</strong>
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '6px 14px', marginTop: '12px', fontSize: '13px', color: '#065f46' }}>
            🤖 Propulsé par Flask IA · Questions différentes à chaque test
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', maxWidth: '780px', width: '100%' }}>
          {Object.entries(FILIERES_INFO).map(([code, info]) => (
            <button key={code} onClick={() => { setFiliere(code); setEtape('infos'); }}
              style={{ padding: '32px 20px', borderRadius: '16px', border: '2px solid #e7e5e4', background: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = info.couleur; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${info.couleur}25`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e7e5e4'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>{info.icone}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1c1917', marginBottom: '16px' }}>{info.nom}</div>
              <div style={{ padding: '10px', background: `linear-gradient(135deg,${info.couleur},${info.couleur2})`, borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '13px' }}>
                Choisir →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── INFOS CANDIDAT ─────────────────────────────────────────────────────
  if (etape === 'infos') return (
    <div style={{ minHeight: '100vh', background: '#f5f5f4', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: '700', color: '#1c1917' }}>Test d'admission — {f?.nom}</span>
        <button onClick={() => setEtape('choix')} style={{ background: 'none', border: 'none', color: '#78716c', cursor: 'pointer' }}>← Changer filière</button>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', maxWidth: '500px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <div style={{ background: `linear-gradient(135deg,${f?.couleur},${f?.couleur2})`, borderRadius: '14px', padding: '18px 22px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '34px' }}>{f?.icone}</div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Filière choisie</div>
              <div style={{ color: '#fff', fontSize: '20px', fontWeight: '900' }}>{f?.nom}</div>
            </div>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1c1917', marginBottom: '22px' }}>Vos informations</h2>
          {erreurQCM && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px', marginBottom: '16px', color: '#991b1b', fontSize: '14px' }}>
              ⚠️ {erreurQCM}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {[
              { key: 'nom', label: 'Nom *', placeholder: 'Votre nom' },
              { key: 'prenom', label: 'Prénom *', placeholder: 'Votre prénom' },
              { key: 'email', label: 'Email *', placeholder: 'votre@email.com', full: true },
              { key: 'contact', label: 'Téléphone', placeholder: '034 XX XXX XX' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '14px', gridColumn: field.full ? '1/-1' : undefined }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#44403c', marginBottom: '6px' }}>{field.label}</label>
                <input
                  type={field.key === 'email' ? 'email' : 'text'}
                  value={candidat[field.key]}
                  onChange={e => setCandidat(c => ({ ...c, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e7e5e4', borderRadius: '10px', fontSize: '14px', color: '#1c1917', background: '#fafaf9', outline: 'none' }}
                />
              </div>
            ))}
          </div>
          <div style={{ background: '#ecfdf5', borderRadius: '10px', padding: '12px', fontSize: '13px', color: '#065f46', marginBottom: '20px', border: '1px solid #a7f3d0' }}>
            🤖 Questions générées par IA · différentes à chaque passage<br />
            ⏱️ <strong>15 questions</strong> · Score minimum : <strong>{SEUIL}%</strong>
          </div>
          <button
            disabled={!candidat.nom || !candidat.prenom || !candidat.email || loadingQCM}
            onClick={chargerQCM}
            style={{
              width: '100%', padding: '14px',
              background: (!candidat.nom || !candidat.prenom || !candidat.email || loadingQCM) ? '#e7e5e4' : `linear-gradient(135deg,${f?.couleur},${f?.couleur2})`,
              color: (!candidat.nom || !candidat.prenom || !candidat.email || loadingQCM) ? '#a8a29e' : '#fff',
              border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700',
              cursor: (!candidat.nom || !candidat.prenom || !candidat.email || loadingQCM) ? 'not-allowed' : 'pointer',
            }}>
            {loadingQCM ? '⏳ Génération des questions IA...' : '🚀 Commencer le test'}
          </button>
        </div>
      </div>
    </div>
  );

  // ── TEST QCM ──────────────────────────────────────────────────────────
  if (etape === 'test' && questions.length > 0) {
    const q          = questions[questionIdx];
    const progression = Object.keys(reponses).length;

    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f4' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', padding: '13px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight: '700', color: '#1c1917' }}>{f?.icone} {f?.nom} — {candidat.prenom} {candidat.nom}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: tempsRestant < 300 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${timerCouleur}40`, borderRadius: '10px' }}>
            <span>{tempsRestant < 300 ? '⚠️' : '⏱️'}</span>
            <span style={{ fontWeight: '800', fontSize: '17px', color: timerCouleur }}>{fmt(tempsRestant)}</span>
          </div>
          <div style={{ fontSize: '13px', color: '#78716c', fontWeight: '600' }}>{progression}/{questions.length} répondues</div>
        </div>
        <div style={{ height: '4px', background: '#e7e5e4' }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg,${f?.couleur},${f?.couleur2})`, width: `${(questionIdx / questions.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '36px 24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '28px', justifyContent: 'center' }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => setQuestionIdx(i)} style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '12px', cursor: 'pointer', background: reponses[i] !== undefined ? `linear-gradient(135deg,${f?.couleur},${f?.couleur2})` : i === questionIdx ? '#1c1917' : '#e7e5e4', color: reponses[i] !== undefined || i === questionIdx ? '#fff' : '#78716c' }}>{i + 1}</button>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: '18px', padding: '32px', border: '1px solid #e7e5e4', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
              Question {questionIdx + 1} / {questions.length} · {q.points} point{q.points > 1 ? 's' : ''}
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#1c1917', lineHeight: 1.4, marginBottom: '26px' }}>{q.question}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {q.choix.map((choix, i) => {
                const sel = reponses[questionIdx] === i;
                return (
                  <button key={i} onClick={() => setReponses(r => ({ ...r, [questionIdx]: i }))}
                    style={{ padding: '14px 18px', borderRadius: '11px', textAlign: 'left', border: `2px solid ${sel ? f?.couleur : '#e7e5e4'}`, background: sel ? `${f?.couleur}12` : '#fafaf9', color: '#1c1917', fontSize: '14px', fontWeight: sel ? '700' : '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                    onMouseEnter={e => { if (!sel) { e.currentTarget.style.borderColor = f?.couleur; } }}
                    onMouseLeave={e => { if (!sel) { e.currentTarget.style.borderColor = '#e7e5e4'; } }}
                  >
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${sel ? f?.couleur : '#d6d3d1'}`, background: sel ? f?.couleur : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: '700' }}>
                      {sel ? '✓' : String.fromCharCode(65 + i)}
                    </div>
                    {choix}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', alignItems: 'center' }}>
              <button onClick={() => setQuestionIdx(p => Math.max(0, p - 1))} disabled={questionIdx === 0}
                style={{ padding: '9px 18px', background: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '10px', color: questionIdx === 0 ? '#a8a29e' : '#44403c', fontWeight: '600', fontSize: '13px', cursor: questionIdx === 0 ? 'not-allowed' : 'pointer' }}>
                ← Précédente
              </button>
              {questionIdx < questions.length - 1 ? (
                <button onClick={() => setQuestionIdx(p => p + 1)}
                  style={{ padding: '9px 22px', background: `linear-gradient(135deg,${f?.couleur},${f?.couleur2})`, border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  Suivante →
                </button>
              ) : (
                <button onClick={() => { if (window.confirm(`Soumettre ? (${progression}/${questions.length} répondues)`)) soumettreTest(); }}
                  style={{ padding: '9px 22px', background: 'linear-gradient(135deg,#059669,#047857)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>
                  ✅ Terminer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ÉVALUATION EN COURS ────────────────────────────────────────────────
  if (etape === 'evaluation') return (
    <div style={{ minHeight: '100vh', background: '#f5f5f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1c1917', marginBottom: '8px' }}>Évaluation par IA en cours...</div>
        <div style={{ color: '#78716c' }}>Analyse de vos réponses par Flask IA</div>
      </div>
    </div>
  );

  // ── RÉSULTAT ──────────────────────────────────────────────────────────
  if (etape === 'resultat' && resultat) {
    const admis = resultat.admis;
    return (
      <div style={{ minHeight: '100vh', background: admis ? 'linear-gradient(160deg,#022c22,#064e3b)' : 'linear-gradient(160deg,#1c0a0a,#7f1d1d)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: '580px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>{admis ? '🎉' : '😔'}</div>
          <div style={{ fontSize: '70px', fontWeight: '900', color: '#fff', letterSpacing: '-3px', lineHeight: 1, marginBottom: '8px' }}>
            {resultat.score}<span style={{ fontSize: '30px', opacity: 0.6 }}>%</span>
          </div>
          <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', marginBottom: '8px' }}>
            {resultat.nb_bonnes || '—'} bonne(s) réponse(s) sur {resultat.nb_questions || questions.length}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' }}>
            Niveau : {resultat.niveau} · Évalué par Flask IA 🤖
          </div>
          <div style={{ background: admis ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${admis ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: '16px', padding: '22px 28px', marginBottom: '28px' }}>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff', marginBottom: '8px' }}>
              {admis ? '✅ Félicitations ! Vous êtes admis(e).' : '❌ Score insuffisant'}
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{resultat.message}</p>
          </div>

          {admis && (
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <h3 style={{ color: '#fff', fontWeight: '800', fontSize: '16px', marginBottom: '12px' }}>📨 Envoyer votre demande</h3>
              {envoi.fait ? (
                <div style={{ background: 'rgba(16,185,129,0.2)', borderRadius: '10px', padding: '16px', color: '#6ee7b7', fontWeight: '600' }}>
                  ✅ Demande envoyée !<br />
                  <span style={{ fontSize: '13px', opacity: 0.8, fontWeight: '400' }}>L'administration vous contactera à {candidat.email}.</span>
                </div>
              ) : (
                <>
                  {envoi.erreur && <div style={{ background: 'rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px', color: '#fca5a5', fontSize: '13px', marginBottom: '12px' }}>⚠️ {envoi.erreur}</div>}
                  <button onClick={envoyerDemande} disabled={envoi.loading}
                    style={{ width: '100%', padding: '13px', background: envoi.loading ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: envoi.loading ? 'not-allowed' : 'pointer' }}>
                    {envoi.loading ? '⏳ Envoi...' : "📨 Envoyer ma demande à l'administration"}
                  </button>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!admis && (
              <button onClick={() => { setResultat(null); setEtape('infos'); }}
                style={{ padding: '13px 28px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>
                🔄 Recommencer
              </button>
            )}
            {envoi.fait && (
              <button onClick={() => navigate('/login')}
                style={{ padding: '13px 28px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' }}>
                🔐 Se connecter
              </button>
            )}
            <button onClick={() => navigate('/')}
              style={{ padding: '13px 24px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '14px', cursor: 'pointer' }}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TestAdmission;
