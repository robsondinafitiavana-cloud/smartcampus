import React from 'react';
const S = {
  success:{ bg:'#d1fae5', color:'#065f46', border:'#a7f3d0' },
  danger: { bg:'#fee2e2', color:'#991b1b', border:'#fecaca' },
  warning:{ bg:'#fef3c7', color:'#92400e', border:'#fde68a' },
  info:   { bg:'#dbeafe', color:'#1e40af', border:'#bfdbfe' },
  purple: { bg:'#ede9fe', color:'#5b21b6', border:'#ddd6fe' },
  muted:  { bg:'#f5f5f4', color:'#57534e', border:'#e7e5e4' },
  dark:   { bg:'#1c1917', color:'#fff',    border:'#292524' },
};
const Badge = ({ type='muted', children, dot }) => {
  const s = S[type] || S.muted;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'5px',
      padding:'3px 10px', borderRadius:'99px', fontSize:'12px', fontWeight:'600',
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
    }}>
      {dot && <span style={{ width:'5px', height:'5px', borderRadius:'50%',
        background:'currentColor', flexShrink:0 }}/>}
      {children}
    </span>
  );
};
export default Badge;
