import React from 'react';
const V = {
  primary:{ bg:'linear-gradient(135deg,#059669,#047857)', color:'#fff', shadow:'0 4px 14px rgba(5,150,105,0.4)' },
  success:{ bg:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', shadow:'0 4px 14px rgba(16,185,129,0.4)' },
  danger: { bg:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', shadow:'0 4px 14px rgba(239,68,68,0.4)' },
  warning:{ bg:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', shadow:'0 4px 14px rgba(245,158,11,0.4)' },
  dark:   { bg:'linear-gradient(135deg,#1c1917,#292524)', color:'#fff', shadow:'0 4px 14px rgba(28,25,23,0.35)' },
  ghost:  { bg:'transparent', color:'#059669', border:'1.5px solid #059669', shadow:'none' },
  light:  { bg:'#f5f5f4', color:'#57534e', border:'1px solid #e7e5e4', shadow:'none' },
};
const Bouton = ({ variante='primary', children, onClick, disabled, style={}, type='button', petit=false }) => {
  const v = V[variante] || V.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      background:v.bg, color:v.color, border:v.border||'none',
      padding: petit ? '6px 14px' : '10px 20px',
      borderRadius:'10px', fontWeight:'600',
      fontSize: petit ? '13px' : '14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      boxShadow: disabled ? 'none' : v.shadow,
      transition:'all 0.2s', letterSpacing:'0.1px',
      display:'inline-flex', alignItems:'center', gap:'7px',
      ...style
    }}
      onMouseEnter={e => { if(!disabled){ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=v.shadow?.replace('14px','20px')||'none'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=disabled?'none':v.shadow; }}
    >{children}</button>
  );
};
export default Bouton;
