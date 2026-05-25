import React from 'react';
export const inputStyle = {
  width:'100%', padding:'10px 14px',
  border:'1.5px solid #e7e5e4', borderRadius:'10px',
  fontSize:'14px', color:'#1c1917', background:'#fafaf9',
  transition:'all 0.2s',
};
export const selectStyle = {
  width:'100%', padding:'10px 14px',
  border:'1.5px solid #e7e5e4', borderRadius:'10px',
  fontSize:'14px', color:'#1c1917', background:'#fafaf9',
  cursor:'pointer', transition:'all 0.2s',
};
const FormField = ({ label, error, children, required, aide }) => (
  <div style={{ marginBottom:'16px' }}>
    {label && (
      <label style={{ display:'block', marginBottom:'7px',
        fontWeight:'600', color:'#44403c', fontSize:'13px' }}>
        {label}{required && <span style={{ color:'#ef4444', marginLeft:'3px' }}>*</span>}
      </label>
    )}
    {React.cloneElement(children, {
      style:{ ...children.props.style, borderColor: error?'#ef4444':undefined },
      onFocus: e => { e.target.style.borderColor='#10b981'; e.target.style.boxShadow='0 0 0 3px rgba(16,185,129,0.12)'; e.target.style.background='#fff'; },
      onBlur:  e => { e.target.style.borderColor=error?'#ef4444':'#e7e5e4'; e.target.style.boxShadow='none'; e.target.style.background='#fafaf9'; },
    })}
    {aide  && !error && <p style={{ color:'#a8a29e', fontSize:'11px', marginTop:'4px' }}>{aide}</p>}
    {error && <p style={{ color:'#ef4444', fontSize:'12px', marginTop:'4px' }}>⚠️ {error}</p>}
  </div>
);
export default FormField;
