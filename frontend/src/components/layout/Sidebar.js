import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MENUS = {
  admin: [
    { section:'PRINCIPAL', items:[
      { path:'/dashboard',   label:"Vue d'ensemble",       icone:'📊' },
      { path:'/demandes',    label:'Demandes inscription',  icone:'📋' },
    ]},
    { section:'ACADÉMIQUE', items:[
      { path:'/etudiants',   label:'Étudiants',             icone:'🎓' },
      { path:'/enseignants', label:'Enseignants',           icone:'👤' },
      { path:'/cours',       label:'Cours',                 icone:'📖' },
      { path:'/notes',       label:'Notes & Bulletins',     icone:'📝' },
      { path:'/presences',   label:'Présences',             icone:'✅' },
      { path:'/planning',    label:'Planning',              icone:'📅' },
      { path:'/devoirs',     label:'Devoirs & Groupes',     icone:'📚' },
    ]},
    { section:'FINANCE', items:[
      { path:'/paiements',   label:'Paiements',             icone:'💳' },
    ]},
    { section:'COMMUNICATION', items:[
      { path:'/communiques', label:'Communiqués',           icone:'📢' },
    ]},
  ],
  enseignant: [
    { section:'MON ESPACE', items:[
      { path:'/dashboard',   label:"Vue d'ensemble",        icone:'📊' },
    ]},
    { section:'ACADÉMIQUE', items:[
      { path:'/cours',       label:'Mes cours',             icone:'📖' },
      { path:'/notes',       label:'Saisie des notes',      icone:'📝' },
      { path:'/presences',   label:'Présences',             icone:'✅' },
      { path:'/planning',    label:'Planning',              icone:'📅' },
      { path:'/devoirs',     label:'Devoirs & Groupes',     icone:'📚' },
    ]},
    { section:'COMMUNICATION', items:[
      { path:'/communiques', label:'Communiqués',           icone:'📢' },
    ]},
  ],
  etudiant: [
    { section:'MON ESPACE', items:[
      { path:'/dashboard',   label:'Mon tableau de bord',   icone:'📊' },
      { path:'/notes',       label:'Mes notes',             icone:'📝' },
      { path:'/presences',   label:'Mes présences',         icone:'✅' },
      { path:'/planning',    label:'Mon planning',          icone:'📅' },
      { path:'/paiements',   label:'Mes paiements',         icone:'💳' },
      { path:'/devoirs',     label:'Mes devoirs',           icone:'📚' },
    ]},
    { section:'COMMUNICATION', items:[
      { path:'/communiques', label:'Communiqués',           icone:'📢' },
    ]},
  ],
};

const Sidebar = () => {
  const { utilisateur, role, deconnecter } = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const [decoLoading, setDecoLoading] = useState(false);
  const menus        = MENUS[role] || MENUS.etudiant;
  const initiales    = utilisateur?.email?.slice(0, 2).toUpperCase() || 'SC';

  const handleDeco = async () => {
    setDecoLoading(true);
    await deconnecter();
    navigate('/login');
  };

  return (
    <aside style={{
      width:'280px', height:'100vh', position:'fixed', left:0, top:0,
      background:'#fff', borderRight:'1px solid #e7e5e4',
      display:'flex', flexDirection:'column',
      boxShadow:'2px 0 12px rgba(0,0,0,0.04)', zIndex:100,
    }}>
      {/* Logo */}
      <div style={{ padding:'20px' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:'12px',
          padding:'12px 16px', borderRadius:'14px',
          background:'linear-gradient(135deg, #064e3b, #047857)',
          boxShadow:'0 4px 16px rgba(6,78,59,0.3)',
        }}>
          <div style={{
            width:'36px', height:'36px', borderRadius:'10px', flexShrink:0,
            background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.3)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'18px', fontWeight:'900', color:'#fff',
          }}>S</div>
          <div>
            <div style={{ color:'#fff', fontWeight:'800', fontSize:'15px', letterSpacing:'-0.3px' }}>
              SmartCampus
            </div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:'11px' }}>
              Inside University
            </div>
          </div>
        </div>
      </div>

      {/* Profil */}
      <div style={{ padding:'0 20px 16px' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:'12px',
          padding:'12px 14px', borderRadius:'12px',
          background:'#f5f5f4', border:'1px solid #e7e5e4',
        }}>
          <div style={{
            width:'36px', height:'36px', borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg, #10b981, #059669)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'13px', fontWeight:'700', color:'#fff',
            boxShadow:'0 2px 8px rgba(16,185,129,0.35)',
          }}>{initiales}</div>
          <div style={{ overflow:'hidden', flex:1 }}>
            <div style={{ fontSize:'12px', fontWeight:'600', color:'#1c1917',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {utilisateur?.email}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'3px' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%',
                background:'#10b981', display:'inline-block', flexShrink:0 }}/>
              <span style={{ fontSize:'11px', color:'#78716c', fontWeight:'500',
                textTransform:'capitalize' }}>{role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, padding:'0 12px', overflowY:'auto' }}>
        {menus.map(({ section, items }) => (
          <div key={section} style={{ marginBottom:'4px' }}>
            <div style={{ fontSize:'10px', fontWeight:'700', color:'#a8a29e',
              textTransform:'uppercase', letterSpacing:'1px',
              padding:'10px 8px 6px' }}>{section}</div>
            {items.map(item => {
              const actif = location.pathname === item.path;
              return (
                <button key={item.path} onClick={() => navigate(item.path)} style={{
                  display:'flex', alignItems:'center', gap:'10px',
                  width:'100%', padding:'10px 12px', marginBottom:'2px',
                  borderRadius:'10px', textAlign:'left', cursor:'pointer',
                  background: actif
                    ? 'linear-gradient(135deg, #064e3b, #047857)'
                    : 'transparent',
                  border:'none', color: actif ? '#fff' : '#57534e',
                  fontWeight: actif ? '600' : '500',
                  fontSize:'14px', transition:'all 0.15s',
                  boxShadow: actif ? '0 4px 12px rgba(6,78,59,0.25)' : 'none',
                }}
                  onMouseEnter={e => { if (!actif) { e.currentTarget.style.background = '#f5f5f4'; e.currentTarget.style.color = '#1c1917'; }}}
                  onMouseLeave={e => { if (!actif) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#57534e'; }}}
                >
                  <span style={{
                    fontSize:'15px', width:'20px', textAlign:'center',
                    filter: actif ? 'brightness(10)' : 'none', flexShrink:0
                  }}>{item.icone}</span>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {actif && (
                    <span style={{ width:'6px', height:'6px', borderRadius:'50%',
                      background:'rgba(255,255,255,0.6)', flexShrink:0 }}/>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Déconnexion */}
      <div style={{ padding:'12px 20px 20px', borderTop:'1px solid #f5f5f4' }}>
        <button onClick={handleDeco} disabled={decoLoading} style={{
          display:'flex', alignItems:'center', gap:'10px', width:'100%',
          padding:'10px 14px', borderRadius:'10px',
          background:'transparent', border:'1.5px solid #e7e5e4',
          color:'#78716c', fontSize:'14px', fontWeight:'500',
          cursor:'pointer', transition:'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#e7e5e4'; e.currentTarget.style.color = '#78716c'; }}
        >
          <span>🚪</span>
          <span>{decoLoading ? 'Déconnexion...' : 'Se déconnecter'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;