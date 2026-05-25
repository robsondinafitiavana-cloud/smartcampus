import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email,   setEmail]   = useState('');
  const [mdp,     setMdp]     = useState('');
  const [showMdp, setShowMdp] = useState(false);
  const [erreur,  setErreur]  = useState('');
  const [loading, setLoading] = useState(false);
  const { connecter } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !mdp) { setErreur('Veuillez remplir tous les champs'); return; }
    setLoading(true); setErreur('');
    try {
      await connecter(email, mdp);
      navigate('/dashboard');
    } catch {
      setErreur('Email ou mot de passe incorrect');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex',
      background:'linear-gradient(160deg, #022c22 0%, #064e3b 40%, #065f46 70%, #047857 100%)',
    }}>
      {/* ── Grille de points décorative ── */}
      <div style={{
        position:'fixed', inset:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize:'32px 32px',
      }}/>

      {/* ── Orbes lumineux ── */}
      <div style={{ position:'fixed', top:'-180px', left:'30%', width:'500px', height:'500px',
        borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
        pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-120px', right:'20%', width:'400px', height:'400px',
        borderRadius:'50%', background:'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)',
        pointerEvents:'none' }}/>

      {/* ── Côté gauche - Branding ── */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        justifyContent:'center', padding:'64px',
        position:'relative'
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'56px' }}>
          <div style={{
            width:'52px', height:'52px', borderRadius:'16px', flexShrink:0,
            background:'linear-gradient(135deg, #10b981, #059669)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 32px rgba(16,185,129,0.5)',
            fontSize:'24px', fontWeight:'900', color:'#fff',
          }}>S</div>
          <div>
            <div style={{ color:'#fff', fontWeight:'800', fontSize:'20px', letterSpacing:'-0.5px' }}>
              SmartCampus
            </div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px' }}>
              Inside University · Madagascar
            </div>
          </div>
        </div>

        {/* Titre */}
        <h1 style={{
          fontSize:'52px', fontWeight:'900', lineHeight:1.05,
          letterSpacing:'-2px', color:'#fff', marginBottom:'20px', maxWidth:'520px'
        }}>
          L'université<br/>
          <span style={{
            background:'linear-gradient(90deg, #34d399, #10b981, #6ee7b7)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>intelligente</span><br/>
          commence ici.
        </h1>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'16px', maxWidth:'420px',
          lineHeight:1.7, marginBottom:'48px' }}>
          Plateforme unifiée pour gérer étudiants, notes, présences, emplois du temps et finances.
        </p>

        {/* Stats */}
        <div style={{ display:'flex', gap:'32px' }}>
          {[
            { val:'7', label:'Modules intégrés' },
            { val:'IA', label:'Reconnaissance faciale' },
            { val:'100%', label:'Digital' },
          ].map((s,i) => (
            <div key={i}>
              <div style={{ color:'#34d399', fontSize:'28px', fontWeight:'800',
                letterSpacing:'-1px', lineHeight:1 }}>{s.val}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px', marginTop:'4px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Côté droit - Formulaire ── */}
      <div style={{
        width:'520px', display:'flex', alignItems:'center',
        justifyContent:'center', padding:'40px',
        background:'rgba(255,255,255,0.04)',
        backdropFilter:'blur(24px)',
        borderLeft:'1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ width:'100%', maxWidth:'400px' }} className="fade-up">
          {/* Card formulaire */}
          <div style={{
            background:'rgba(255,255,255,0.97)',
            borderRadius:'24px', padding:'40px',
            boxShadow:'0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)',
          }}>
            {/* En-tête */}
            <div style={{ marginBottom:'32px' }}>
              <h2 style={{ fontSize:'22px', fontWeight:'800', color:'#1c1917',
                letterSpacing:'-0.5px', marginBottom:'6px' }}>
                Connexion
              </h2>
              <p style={{ color:'#78716c', fontSize:'14px' }}>
                Accédez à votre espace SmartCampus
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'600',
                  color:'#44403c', marginBottom:'8px' }}>
                  Adresse email
                </label>
                <div style={{ position:'relative' }}>
                  <input type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.mg" autoComplete="email"
                    style={{
                      width:'100%', padding:'12px 16px 12px 44px',
                      border:'1.5px solid #e7e5e4', borderRadius:'12px',
                      fontSize:'14px', color:'#1c1917', background:'#fafaf9',
                      transition:'all 0.2s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#10b981';
                      e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)';
                      e.target.style.background = '#fff';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e7e5e4';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#fafaf9';
                    }}
                  />
                  <span style={{ position:'absolute', left:'14px', top:'50%',
                    transform:'translateY(-50%)', fontSize:'16px', pointerEvents:'none' }}>
                    ✉️
                  </span>
                </div>
              </div>

              {/* Mot de passe */}
              <div style={{ marginBottom:'24px' }}>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'600',
                  color:'#44403c', marginBottom:'8px' }}>
                  Mot de passe
                </label>
                <div style={{ position:'relative' }}>
                  <input type={showMdp ? 'text' : 'password'}
                    value={mdp} onChange={e => setMdp(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width:'100%', padding:'12px 44px 12px 44px',
                      border:'1.5px solid #e7e5e4', borderRadius:'12px',
                      fontSize:'14px', color:'#1c1917', background:'#fafaf9',
                      transition:'all 0.2s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#10b981';
                      e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)';
                      e.target.style.background = '#fff';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e7e5e4';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#fafaf9';
                    }}
                  />
                  <span style={{ position:'absolute', left:'14px', top:'50%',
                    transform:'translateY(-50%)', fontSize:'16px', pointerEvents:'none' }}>🔐</span>
                  <button type="button" onClick={() => setShowMdp(!showMdp)} style={{
                    position:'absolute', right:'14px', top:'50%',
                    transform:'translateY(-50%)', background:'none',
                    border:'none', cursor:'pointer', color:'#a8a29e', fontSize:'16px',
                    padding:'2px',
                  }}>{showMdp ? '🙈' : '👁️'}</button>
                </div>
              </div>

              {/* Erreur */}
              {erreur && (
                <div style={{
                  background:'#fef2f2', border:'1px solid #fecaca',
                  borderRadius:'10px', padding:'11px 14px',
                  color:'#dc2626', fontSize:'13px', marginBottom:'16px',
                  display:'flex', alignItems:'center', gap:'8px'
                }}>
                  <span>⚠️</span>{erreur}
                </div>
              )}

              {/* Bouton connexion */}
              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'14px',
                background: loading
                  ? '#d1d5db'
                  : 'linear-gradient(135deg, #059669, #047857)',
                color:'#fff', border:'none', borderRadius:'12px',
                fontSize:'15px', fontWeight:'700', cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(5,150,105,0.4)',
                transition:'all 0.25s', letterSpacing:'0.2px',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              }}
                onMouseEnter={e => { if(!loading){ e.target.style.transform='translateY(-1px)'; e.target.style.boxShadow='0 12px 32px rgba(5,150,105,0.5)'; } }}
                onMouseLeave={e => { e.target.style.transform='translateY(0)'; e.target.style.boxShadow=loading?'none':'0 8px 24px rgba(5,150,105,0.4)'; }}
              >
                {loading ? (
                  <>
                    <div style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.4)',
                      borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                    Connexion en cours...
                  </>
                ) : 'Se connecter →'}
              </button>
            </form>

            {/* Rôles */}
            <div style={{ marginTop:'28px', padding:'16px',
              background:'#f5f5f4', borderRadius:'12px', border:'1px solid #e7e5e4' }}>
              <div style={{ fontSize:'11px', fontWeight:'700', color:'#a8a29e',
                textTransform:'uppercase', letterSpacing:'1px', marginBottom:'10px' }}>
                Rôles disponibles
              </div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {[
                  { role:'Admin',      color:'#064e3b', bg:'#d1fae5' },
                  { role:'Enseignant', color:'#1e40af', bg:'#dbeafe' },
                  { role:'Étudiant',   color:'#7c3aed', bg:'#ede9fe' },
                ].map(r => (
                  <span key={r.role} style={{
                    padding:'4px 12px', borderRadius:'99px', fontSize:'12px',
                    fontWeight:'600', background:r.bg, color:r.color,
                  }}>{r.role}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ textAlign:'center', marginTop:'20px',
            color:'rgba(255,255,255,0.25)', fontSize:'12px' }}>
            SmartCampus © 2026 · Inside University
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
