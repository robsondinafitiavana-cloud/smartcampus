import React from 'react';
const Card = ({ children, style={}, titre, badge, actions, noPadding=false, accent }) => (
  <div style={{
    background:'#fff', borderRadius:'14px',
    border:'1px solid #e7e5e4',
    boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
    overflow:'hidden',
    borderTop: accent ? `3px solid ${accent}` : undefined,
    ...style
  }}>
    {(titre || badge || actions) && (
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'15px 20px', borderBottom:'1px solid #f5f5f4'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontWeight:'700', color:'#1c1917', fontSize:'15px' }}>{titre}</span>
          {badge}
        </div>
        {actions}
      </div>
    )}
    <div style={noPadding ? {} : { padding:'20px' }}>{children}</div>
  </div>
);
export default Card;
