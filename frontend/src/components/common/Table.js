import React from 'react';
import Spinner from './Spinner';
const Table = ({ colonnes, donnees, actions, loading, vide='Aucune donnée' }) => {
  if (loading) return <Spinner />;
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
        <thead>
          <tr style={{ background:'#fafaf9', borderBottom:'2px solid #e7e5e4' }}>
            {colonnes.map(c => (
              <th key={c.key} style={{ padding:'11px 16px', textAlign:'left',
                fontWeight:'700', color:'#78716c', fontSize:'11px',
                textTransform:'uppercase', letterSpacing:'0.6px', whiteSpace:'nowrap' }}>
                {c.label}
              </th>
            ))}
            {actions && <th style={{ padding:'11px 16px', textAlign:'center',
              fontWeight:'700', color:'#78716c', fontSize:'11px',
              textTransform:'uppercase', letterSpacing:'0.6px' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {!donnees?.length ? (
            <tr><td colSpan={colonnes.length+(actions?1:0)} style={{ textAlign:'center', padding:'56px', color:'#a8a29e' }}>
              <div style={{ fontSize:'36px', marginBottom:'10px' }}>📭</div>
              <div style={{ fontWeight:'600', fontSize:'15px', color:'#78716c', marginBottom:'4px' }}>{vide}</div>
            </td></tr>
          ) : donnees.map((row,i) => (
            <tr key={i} style={{ borderBottom:'1px solid #f5f5f4', transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background='#fafaf9'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {colonnes.map(c => (
                <td key={c.key} style={{ padding:'13px 16px', color:'#292524', lineHeight:1.4 }}>
                  {c.render ? c.render(row[c.key],row) : (row[c.key] ?? '—')}
                </td>
              ))}
              {actions && <td style={{ padding:'13px 16px', textAlign:'center' }}>{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default Table;
