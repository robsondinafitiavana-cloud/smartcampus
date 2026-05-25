import React from 'react';
const StatCard = ({ icone, valeur, label, couleur='#10b981', sousTitre, tendance }) => (
  <div style={{
    background:'#fff', borderRadius:'14px', padding:'20px 22px',
    border:'1px solid #e7e5e4', flex:'1', minWidth:'160px',
    boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
    borderLeft:`4px solid ${couleur}`,
    transition:'box-shadow 0.2s, transform 0.2s',
    cursor:'default',
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform='translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform='translateY(0)'; }}
  >
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <div style={{ fontSize:'11px', fontWeight:'700', color:'#a8a29e',
          textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'8px' }}>
          {label}
        </div>
        <div style={{ fontSize:'28px', fontWeight:'900', color:'#1c1917',
          letterSpacing:'-1px', lineHeight:1 }}>
          {valeur}
        </div>
        {sousTitre && <div style={{ fontSize:'11px', color:'#a8a29e', marginTop:'5px' }}>{sousTitre}</div>}
        {tendance != null && (
          <div style={{ fontSize:'12px', marginTop:'6px', fontWeight:'600',
            color: tendance >= 0 ? '#10b981' : '#ef4444' }}>
            {tendance >= 0 ? '↑' : '↓'} {Math.abs(tendance)}%
          </div>
        )}
      </div>
      <div style={{
        width:'42px', height:'42px', borderRadius:'12px', flexShrink:0,
        background: couleur + '15',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'19px',
      }}>{icone}</div>
    </div>
  </div>
);
export default StatCard;
