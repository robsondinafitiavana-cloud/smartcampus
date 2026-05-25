/**
 * pages/public/Accueil.js — Page d'accueil publique
 * ===================================================
 * Visible AVANT la connexion.
 * Présente Inside University, les 3 filières, et invite
 * au test d'admission ou à la connexion.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Données des filières ─────────────────────────────────────
const FILIERES = [
  {
    code:  'INF',
    nom:   'Informatique',
    icone: '💻',
    couleur: '#059669',
    couleur2: '#047857',
    description: 'Formation en développement logiciel, réseaux, intelligence artificielle et systèmes d\'information.',
    debouches: ['Développeur Web/Mobile', 'Ingénieur Réseau', 'Data Scientist', 'Chef de Projet IT'],
    duree: 'Licence 3 ans · Master 2 ans',
    places: 60,
    matieres: ['Programmation', 'Base de données', 'Algorithmes', 'Réseaux', 'IA & Machine Learning'],
  },
  {
    code:  'GST',
    nom:   'Gestion',
    icone: '📊',
    couleur: '#6366f1',
    couleur2: '#4f46e5',
    description: 'Formation en management, comptabilité, finance d\'entreprise et administration des affaires.',
    debouches: ['Manager', 'Comptable', 'Analyste Financier', 'Entrepreneur'],
    duree: 'Licence 3 ans · Master 2 ans',
    places: 80,
    matieres: ['Comptabilité', 'Finance', 'Marketing', 'Management', 'Droit des affaires'],
  },
  {
    code:  'DRT',
    nom:   'Droit',
    icone: '⚖️',
    couleur: '#dc2626',
    couleur2: '#b91c1c',
    description: 'Formation en droit civil, pénal, commercial et administratif avec focus sur le contexte malgache.',
    debouches: ['Avocat', 'Magistrat', 'Notaire', 'Juriste d\'entreprise'],
    duree: 'Licence 3 ans · Master 2 ans',
    places: 50,
    matieres: ['Droit civil', 'Droit pénal', 'Droit commercial', 'Droit administratif', 'Procédure'],
  },
];

// ── Statistiques de l'université ─────────────────────────────
const STATS = [
  { val:'3', label:'Filières', icone:'🎓' },
  { val:'500+', label:'Étudiants', icone:'👥' },
  { val:'30+', label:'Enseignants', icone:'👨‍🏫' },
  { val:'15 ans', label:'D\'expérience', icone:'🏆' },
];

const Accueil = () => {
  const navigate = useNavigate();
  const [filiereSelectionnee, setFiliereSelectionnee] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',sans-serif", color:'#1c1917', background:'#fff' }}>

      {/* ══ NAVBAR ════════════════════════════════════════════ */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:1000,
        background: scrollY > 50 ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(12px)' : 'none',
        borderBottom: scrollY > 50 ? '1px solid #e7e5e4' : 'none',
        padding:'16px 40px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        transition:'all 0.3s',
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{
            width:'40px', height:'40px', borderRadius:'12px',
            background:'linear-gradient(135deg,#064e3b,#047857)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'18px', fontWeight:'900', color:'#fff',
            boxShadow:'0 4px 12px rgba(6,78,59,0.3)',
          }}>S</div>
          <div>
            <div style={{ fontWeight:'800', fontSize:'15px',
              color: scrollY > 50 ? '#1c1917' : '#fff' }}>SmartCampus</div>
            <div style={{ fontSize:'11px',
              color: scrollY > 50 ? '#78716c' : 'rgba(255,255,255,0.7)' }}>Inside University</div>
          </div>
        </div>

        {/* Liens */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          {['Présentation', 'Filières', 'Admission'].map(lien => (
            <button key={lien} onClick={() => {
              const id = lien.toLowerCase().replace('é','e').replace('è','e');
              document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
            }} style={{
              padding:'8px 16px', background:'transparent', border:'none',
              color: scrollY > 50 ? '#57534e' : 'rgba(255,255,255,0.85)',
              fontSize:'14px', fontWeight:'500', cursor:'pointer',
              borderRadius:'8px', transition:'all 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = scrollY>50?'#f5f5f4':'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{lien}</button>
          ))}
          <button onClick={() => navigate('/test-admission')} style={{
            padding:'9px 20px',
            background:'linear-gradient(135deg,#064e3b,#047857)',
            color:'#fff', border:'none', borderRadius:'10px',
            fontSize:'14px', fontWeight:'700', cursor:'pointer',
            boxShadow:'0 4px 12px rgba(6,78,59,0.35)',
            transition:'all 0.2s', marginLeft:'8px',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(6,78,59,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(6,78,59,0.35)'; }}
          >📝 Test d'admission</button>
          <button onClick={() => navigate('/login')} style={{
            padding:'9px 20px',
            background: scrollY>50 ? '#f5f5f4' : 'rgba(255,255,255,0.15)',
            color: scrollY>50 ? '#1c1917' : '#fff',
            border: scrollY>50 ? '1px solid #e7e5e4' : '1px solid rgba(255,255,255,0.3)',
            borderRadius:'10px', fontSize:'14px', fontWeight:'600', cursor:'pointer',
            transition:'all 0.2s',
          }}>Connexion</button>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section style={{
        minHeight:'100vh',
        background:'linear-gradient(160deg, #022c22 0%, #064e3b 40%, #065f46 70%, #047857 100%)',
        display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', overflow:'hidden', paddingTop:'80px',
      }}>
        {/* Grille de points */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize:'32px 32px',
        }}/>
        {/* Orbes */}
        <div style={{ position:'absolute', top:'-100px', right:'10%', width:'500px', height:'500px',
          borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,0.2) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'-80px', left:'5%', width:'400px', height:'400px',
          borderRadius:'50%', background:'radial-gradient(circle,rgba(245,158,11,0.12) 0%,transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', textAlign:'center', padding:'0 24px', maxWidth:'900px' }}>
          {/* Badge */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)',
            borderRadius:'99px', padding:'8px 20px', marginBottom:'28px',
            color:'#6ee7b7', fontSize:'13px', fontWeight:'600',
          }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'50%',
              background:'#10b981', display:'inline-block',
              boxShadow:'0 0 8px #10b981' }}/>
            Admissions ouvertes — Année 2025-2026
          </div>

          <h1 style={{
            fontSize:'clamp(36px, 6vw, 68px)', fontWeight:'900',
            lineHeight:1.05, letterSpacing:'-3px', color:'#fff',
            marginBottom:'24px',
          }}>
            Construisez votre<br/>
            <span style={{
              background:'linear-gradient(90deg, #34d399, #10b981, #6ee7b7)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>avenir académique</span><br/>
            à Inside University
          </h1>

          <p style={{
            fontSize:'18px', color:'rgba(255,255,255,0.6)',
            lineHeight:1.7, marginBottom:'40px', maxWidth:'600px', margin:'0 auto 40px',
          }}>
            3 filières d'excellence — Informatique, Gestion, Droit.<br/>
            Passez le test d'admission en ligne et rejoignez notre communauté.
          </p>

          {/* CTA Buttons */}
          <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap', marginBottom:'60px' }}>
            <button onClick={() => navigate('/test-admission')} style={{
              padding:'16px 36px',
              background:'linear-gradient(135deg,#10b981,#059669)',
              color:'#fff', border:'none', borderRadius:'14px',
              fontSize:'16px', fontWeight:'800', cursor:'pointer',
              boxShadow:'0 8px 32px rgba(16,185,129,0.45)',
              transition:'all 0.25s', letterSpacing:'0.3px',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(16,185,129,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(16,185,129,0.45)'; }}
            >
              📝 Passer le test d'admission
            </button>
            <button onClick={() => document.getElementById('filieres')?.scrollIntoView({behavior:'smooth'})} style={{
              padding:'16px 36px',
              background:'rgba(255,255,255,0.1)',
              color:'#fff', border:'1.5px solid rgba(255,255,255,0.25)',
              borderRadius:'14px', fontSize:'16px', fontWeight:'600',
              cursor:'pointer', backdropFilter:'blur(8px)', transition:'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
            >
              Découvrir nos filières →
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display:'flex', gap:'0', justifyContent:'center',
            background:'rgba(255,255,255,0.08)', backdropFilter:'blur(12px)',
            border:'1px solid rgba(255,255,255,0.12)', borderRadius:'16px',
            overflow:'hidden', maxWidth:'600px', margin:'0 auto',
          }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                flex:1, padding:'20px 16px', textAlign:'center',
                borderRight: i < STATS.length-1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              }}>
                <div style={{ fontSize:'24px', marginBottom:'4px' }}>{s.icone}</div>
                <div style={{ fontSize:'22px', fontWeight:'900', color:'#34d399', lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', marginTop:'4px', fontWeight:'500' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRÉSENTATION ══════════════════════════════════════ */}
      <section id="presentation" style={{ padding:'100px 40px', background:'#fff', maxWidth:'1100px', margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'64px' }}>
          <div style={{ display:'inline-block', background:'#ecfdf5', color:'#065f46',
            padding:'6px 16px', borderRadius:'99px', fontSize:'12px', fontWeight:'700',
            textTransform:'uppercase', letterSpacing:'1px', marginBottom:'16px',
            border:'1px solid #a7f3d0' }}>
            À propos
          </div>
          <h2 style={{ fontSize:'42px', fontWeight:'900', letterSpacing:'-1.5px',
            color:'#1c1917', marginBottom:'16px' }}>
            Inside University
          </h2>
          <p style={{ fontSize:'16px', color:'#78716c', lineHeight:1.8, maxWidth:'680px', margin:'0 auto' }}>
            Fondée avec la vision de former les leaders de demain à Madagascar,
            Inside University propose des formations d'excellence dans trois domaines clés.
            Notre approche pédagogique combine théorie rigoureuse et pratique professionnelle.
          </p>
        </div>

        {/* Valeurs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px' }}>
          {[
            { icone:'🎯', titre:'Excellence académique', desc:'Des programmes conçus avec les meilleurs professionnels du secteur pour une formation de qualité internationale.' },
            { icone:'🤝', titre:'Accompagnement personnalisé', desc:'Un suivi individuel de chaque étudiant pour garantir leur réussite et leur épanouissement.' },
            { icone:'🌍', titre:'Ouverture sur le monde', desc:'Des partenariats avec des universités internationales et des entreprises de renom à Madagascar et à l\'étranger.' },
          ].map((v, i) => (
            <div key={i} style={{
              padding:'32px 28px', borderRadius:'16px',
              border:'1px solid #e7e5e4',
              background:'#fafaf9',
              transition:'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor='#a7f3d0'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; e.currentTarget.style.borderColor='#e7e5e4'; }}
            >
              <div style={{ fontSize:'36px', marginBottom:'16px' }}>{v.icone}</div>
              <h3 style={{ fontSize:'17px', fontWeight:'800', color:'#1c1917', marginBottom:'10px' }}>{v.titre}</h3>
              <p style={{ fontSize:'14px', color:'#78716c', lineHeight:1.7 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FILIÈRES ══════════════════════════════════════════ */}
      <section id="filieres" style={{ padding:'100px 40px', background:'#f5f5f4' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'64px' }}>
            <div style={{ display:'inline-block', background:'#ecfdf5', color:'#065f46',
              padding:'6px 16px', borderRadius:'99px', fontSize:'12px', fontWeight:'700',
              textTransform:'uppercase', letterSpacing:'1px', marginBottom:'16px',
              border:'1px solid #a7f3d0' }}>
              Nos filières
            </div>
            <h2 style={{ fontSize:'42px', fontWeight:'900', letterSpacing:'-1.5px',
              color:'#1c1917', marginBottom:'16px' }}>
              3 filières d'excellence
            </h2>
            <p style={{ fontSize:'16px', color:'#78716c', lineHeight:1.7 }}>
              Choisissez la filière qui correspond à vos ambitions et passez le test d'admission en ligne.
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px' }}>
            {FILIERES.map(f => (
              <div key={f.code}
                onClick={() => setFiliereSelectionnee(filiereSelectionnee?.code===f.code ? null : f)}
                style={{
                  borderRadius:'20px', overflow:'hidden',
                  background:'#fff', border:'2px solid',
                  borderColor: filiereSelectionnee?.code===f.code ? f.couleur : '#e7e5e4',
                  cursor:'pointer', transition:'all 0.25s',
                  boxShadow: filiereSelectionnee?.code===f.code
                    ? `0 12px 40px ${f.couleur}30`
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  transform: filiereSelectionnee?.code===f.code ? 'translateY(-6px)' : 'translateY(0)',
                }}
              >
                {/* Header coloré */}
                <div style={{
                  background:`linear-gradient(135deg, ${f.couleur}, ${f.couleur2})`,
                  padding:'32px 28px',
                }}>
                  <div style={{ fontSize:'48px', marginBottom:'12px' }}>{f.icone}</div>
                  <h3 style={{ fontSize:'24px', fontWeight:'900', color:'#fff',
                    letterSpacing:'-0.5px', marginBottom:'6px' }}>{f.nom}</h3>
                  <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)', fontWeight:'500' }}>
                    {f.duree}
                  </div>
                </div>

                {/* Corps */}
                <div style={{ padding:'24px 28px' }}>
                  <p style={{ fontSize:'14px', color:'#57534e', lineHeight:1.7, marginBottom:'20px' }}>
                    {f.description}
                  </p>

                  {/* Matières */}
                  <div style={{ marginBottom:'16px' }}>
                    <div style={{ fontSize:'11px', fontWeight:'700', color:'#a8a29e',
                      textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>
                      Matières principales
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                      {f.matieres.map(m => (
                        <span key={m} style={{
                          fontSize:'12px', padding:'4px 10px', borderRadius:'99px',
                          background:`${f.couleur}12`, color:f.couleur,
                          border:`1px solid ${f.couleur}30`, fontWeight:'600',
                        }}>{m}</span>
                      ))}
                    </div>
                  </div>

                  {/* Débouchés */}
                  {filiereSelectionnee?.code === f.code && (
                    <div style={{ marginBottom:'16px' }}>
                      <div style={{ fontSize:'11px', fontWeight:'700', color:'#a8a29e',
                        textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>
                        Débouchés
                      </div>
                      {f.debouches.map(d => (
                        <div key={d} style={{
                          display:'flex', alignItems:'center', gap:'8px',
                          fontSize:'13px', color:'#44403c', marginBottom:'5px', fontWeight:'500'
                        }}>
                          <span style={{ color:f.couleur, fontWeight:'800' }}>→</span> {d}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Places */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'10px 14px', background:'#f5f5f4', borderRadius:'10px',
                    border:'1px solid #e7e5e4', marginBottom:'16px' }}>
                    <span style={{ fontSize:'12px', color:'#78716c', fontWeight:'500' }}>Places disponibles</span>
                    <span style={{ fontSize:'15px', fontWeight:'800', color:f.couleur }}>{f.places}</span>
                  </div>

                  {/* Bouton test */}
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/test-admission?filiere=${f.code}`); }} style={{
                    width:'100%', padding:'12px',
                    background:`linear-gradient(135deg, ${f.couleur}, ${f.couleur2})`,
                    color:'#fff', border:'none', borderRadius:'12px',
                    fontSize:'14px', fontWeight:'700', cursor:'pointer',
                    boxShadow:`0 4px 16px ${f.couleur}35`,
                    transition:'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}
                  >
                    📝 Passer le test {f.nom}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ADMISSION ═════════════════════════════════════════ */}
      <section id="admission" style={{
        padding:'100px 40px',
        background:'linear-gradient(135deg, #022c22, #064e3b)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize:'28px 28px' }}/>

        <div style={{ maxWidth:'800px', margin:'0 auto', textAlign:'center', position:'relative' }}>
          <h2 style={{ fontSize:'42px', fontWeight:'900', color:'#fff',
            letterSpacing:'-1.5px', marginBottom:'20px' }}>
            Prêt à rejoindre<br/>Inside University ?
          </h2>
          <p style={{ fontSize:'16px', color:'rgba(255,255,255,0.6)',
            lineHeight:1.7, marginBottom:'40px' }}>
            Passez notre test d'admission en ligne. Il dure environ 15 minutes et
            couvre les matières fondamentales de la filière choisie.
            La note minimale d'admission est de <strong style={{color:'#34d399'}}>60%</strong>.
          </p>

          {/* Étapes */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'48px' }}>
            {[
              { n:'1', label:'Choisir votre filière', icone:'🎯' },
              { n:'2', label:'Passer le test QCM', icone:'📝' },
              { n:'3', label:'Résultat immédiat', icone:'⚡' },
              { n:'4', label:'Inscription validée', icone:'✅' },
            ].map(e => (
              <div key={e.n} style={{
                background:'rgba(255,255,255,0.08)', borderRadius:'14px', padding:'20px 16px',
                border:'1px solid rgba(255,255,255,0.12)',
              }}>
                <div style={{ fontSize:'28px', marginBottom:'8px' }}>{e.icone}</div>
                <div style={{ fontSize:'22px', fontWeight:'900', color:'#34d399', lineHeight:1 }}>{e.n}</div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', marginTop:'6px', lineHeight:1.4 }}>{e.label}</div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/test-admission')} style={{
            padding:'18px 48px',
            background:'linear-gradient(135deg,#10b981,#059669)',
            color:'#fff', border:'none', borderRadius:'14px',
            fontSize:'17px', fontWeight:'800', cursor:'pointer',
            boxShadow:'0 8px 32px rgba(16,185,129,0.5)',
            transition:'all 0.25s', letterSpacing:'0.3px',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(16,185,129,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(16,185,129,0.5)'; }}
          >
            Commencer le test d'admission →
          </button>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer style={{ background:'#1c1917', padding:'40px', textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', marginBottom:'16px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'8px',
            background:'linear-gradient(135deg,#064e3b,#047857)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'14px', fontWeight:'900', color:'#fff' }}>S</div>
          <span style={{ color:'#fff', fontWeight:'700' }}>SmartCampus · Inside University</span>
        </div>
        <p style={{ color:'#78716c', fontSize:'13px' }}>
          © 2026 Inside University Madagascar · Tous droits réservés
        </p>
        <div style={{ marginTop:'12px' }}>
          <button onClick={() => navigate('/login')} style={{
            background:'none', border:'none', color:'#10b981',
            fontSize:'13px', cursor:'pointer', fontWeight:'600'
          }}>Connexion espace SmartCampus →</button>
        </div>
      </footer>
    </div>
  );
};

export default Accueil;