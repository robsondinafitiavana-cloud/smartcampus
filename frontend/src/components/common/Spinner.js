import React from 'react';
const Spinner = ({ texte='Chargement...' }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', padding:'60px', gap:'14px' }}>
    <div style={{ width:'32px', height:'32px',
      border:'3px solid #e7e5e4', borderTop:'3px solid #10b981',
      borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
    <span style={{ color:'#a8a29e', fontSize:'14px', fontWeight:'500' }}>{texte}</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);
export default Spinner;
