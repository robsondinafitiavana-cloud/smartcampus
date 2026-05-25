import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, titre, sousTitre, actions }) => (
  <div style={{ display:'flex', minHeight:'100vh', background:'#f5f5f4' }}>
    <Sidebar />
    <main style={{ marginLeft:'280px', flex:1, display:'flex', flexDirection:'column' }}>
      {titre && (
        <header style={{
          padding:'18px 32px', background:'#fff',
          borderBottom:'1px solid #e7e5e4',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div>
            <h1 style={{ fontSize:'19px', fontWeight:'800', color:'#1c1917',
              letterSpacing:'-0.4px' }}>{titre}</h1>
            {sousTitre && <p style={{ color:'#78716c', fontSize:'13px', marginTop:'2px' }}>{sousTitre}</p>}
          </div>
          {actions && <div style={{ display:'flex', gap:'10px' }}>{actions}</div>}
        </header>
      )}
      <div style={{ padding:'28px 32px', flex:1 }} className="fade-up">
        {children}
      </div>
    </main>
  </div>
);
export default Layout;
