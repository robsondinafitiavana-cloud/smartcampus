import React, { useEffect } from 'react';
const Modal = ({ titre, visible, onClose, children, largeur='540px' }) => {
  useEffect(() => {
    const h = e => { if(e.key==='Escape') onClose(); };
    if(visible) document.addEventListener('keydown',h);
    return () => document.removeEventListener('keydown',h);
  }, [visible,onClose]);
  if(!visible) return null;
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(28,25,23,0.55)',
      backdropFilter:'blur(6px)', display:'flex', alignItems:'center',
      justifyContent:'center', zIndex:1000, padding:'16px',
    }}>
      <div onClick={e=>e.stopPropagation()} className="fade-up" style={{
        background:'#fff', borderRadius:'20px', width:'100%', maxWidth:largeur,
        maxHeight:'90vh', overflow:'auto',
        boxShadow:'0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'20px 24px', borderBottom:'1px solid #f5f5f4',
        }}>
          <h3 style={{ fontWeight:'800', color:'#1c1917', fontSize:'16px', letterSpacing:'-0.3px' }}>
            {titre}
          </h3>
          <button onClick={onClose} style={{
            width:'30px', height:'30px', borderRadius:'8px', background:'#f5f5f4',
            border:'1px solid #e7e5e4', color:'#78716c', fontSize:'18px',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', transition:'all 0.15s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.color='#dc2626';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f5f5f4';e.currentTarget.style.color='#78716c';}}
          >×</button>
        </div>
        <div style={{ padding:'24px' }}>{children}</div>
      </div>
    </div>
  );
};
export default Modal;
