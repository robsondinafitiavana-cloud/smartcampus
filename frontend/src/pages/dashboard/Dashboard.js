import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Bouton from '../../components/common/Bouton';
import { useAuth } from '../../context/AuthContext';
import { etudiantsAPI, notesAPI, paiementsAPI } from '../../api/services';
import { formatAriary } from '../../utils/helpers';
import api from '../../api/axios';

const Dashboard = () => {
  const { utilisateur, estAdmin, estEtudiant } = useAuth();
  const navigate = useNavigate();
  const [totalEtu,    setTotalEtu]    = useState('—');
  const [aRisque,     setARisque]     = useState([]);
  const [finance,     setFinance]     = useState(null);
  const [nbDemandes,  setNbDemandes]  = useState(0);
  const heure = new Date().getHours();
  const salut = heure<12?'Bonjour':heure<18?'Bon après-midi':'Bonsoir';

  useEffect(() => { charger(); }, []); // eslint-disable-line

  const charger = async () => {
    try {
      if (estAdmin) {
        const [e,r,f,d] = await Promise.allSettled([
          etudiantsAPI.getListe(),
          notesAPI.getEtudiantsARisque(),
          paiementsAPI.getDashboard(),
          api.get('/demandes/?statut=en_attente'),
        ]);
        if(e.status==='fulfilled'){const d2=e.value.data; setTotalEtu(d2.count??(d2.results??d2).length);}
        if(r.status==='fulfilled') setARisque(r.value.data.slice(0,5));
        if(f.status==='fulfilled') setFinance(f.value.data);
        if(d.status==='fulfilled'){
          const data = d.value.data;
          setNbDemandes((data.results??data).length);
        }
      } else {
        const r = await notesAPI.getEtudiantsARisque();
        setARisque(r.data.slice(0,5));
      }
    } catch(e){console.error(e);}
  };

  return (
    <Layout
      titre={`${salut} 👋`}
      sousTitre={new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
      actions={estAdmin && (
        <div style={{display:'flex',gap:'10px'}}>
          <Bouton variante="light" petit onClick={()=>navigate('/etudiants')}>+ Étudiant</Bouton>
          <Bouton variante="primary" petit onClick={()=>navigate('/notes')}>Saisir notes</Bouton>
        </div>
      )}
    >
      {/* Bannière */}
      <div style={{
        background:'linear-gradient(135deg,#064e3b,#065f46,#047857)',
        borderRadius:'16px', padding:'28px 32px', marginBottom:'24px',
        position:'relative', overflow:'hidden', boxShadow:'0 8px 32px rgba(6,78,59,0.25)',
      }}>
        <div style={{position:'absolute',top:'-60px',right:'40px',width:'220px',height:'220px',
          borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none'}}/>
        <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'16px'}}>
          <div>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:'13px',marginBottom:'6px'}}>{utilisateur?.email}</div>
            <div style={{color:'#fff',fontSize:'22px',fontWeight:'800',letterSpacing:'-0.5px',marginBottom:'8px'}}>
              Bienvenue sur SmartCampus
            </div>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
              {['7 Modules','Année 2025-2026','Inside University'].map((t,i)=>(
                <span key={i} style={{padding:'4px 12px',borderRadius:'99px',
                  background:i===2?'rgba(245,158,11,0.3)':'rgba(255,255,255,0.15)',
                  color:'#fff',fontSize:'12px',fontWeight:'600',border:'1px solid rgba(255,255,255,0.2)'}}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={()=>navigate('/presences')} style={{
              padding:'10px 18px',background:'rgba(255,255,255,0.12)',
              border:'1px solid rgba(255,255,255,0.2)',borderRadius:'10px',
              color:'#fff',fontSize:'13px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s',
            }}>Présences</button>
            <button onClick={()=>navigate('/planning')} style={{
              padding:'10px 18px',background:'rgba(245,158,11,0.3)',
              border:'1px solid rgba(245,158,11,0.4)',borderRadius:'10px',
              color:'#fde68a',fontSize:'13px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s',
            }}>Planning →</button>
          </div>
        </div>
      </div>

      {/* Stats Admin */}
      {estAdmin && (
        <div style={{display:'flex',gap:'16px',flexWrap:'wrap',marginBottom:'24px'}}>
          <StatCard icone="🎓" couleur="#059669" valeur={totalEtu} label="Étudiants inscrits" sousTitre="Année 2025-2026"/>
          <StatCard icone="💰" couleur="#10b981" valeur={finance?formatAriary(finance.total_encaisse):'—'} label="Total encaissé"/>
          <StatCard icone="⚠️" couleur="#f59e0b" valeur={finance?.nb_retards??'—'} label="Paiements en retard"/>
          <StatCard icone="📊" couleur="#ef4444" valeur={aRisque.length} label="Étudiants à risque"/>
          {nbDemandes > 0 && (
            <div onClick={()=>navigate('/demandes')} style={{cursor:'pointer'}}>
              <StatCard icone="🔔" couleur="#6366f1" valeur={nbDemandes}
                label="Demandes en attente" sousTitre="Cliquer pour voir"/>
            </div>
          )}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
        {/* Étudiants à risque */}
        <Card titre="Étudiants en difficulté" accent="#ef4444"
          badge={<Badge type={aRisque.length>0?'danger':'success'} dot>{aRisque.length}</Badge>}
          actions={<Bouton variante="ghost" petit onClick={()=>navigate('/notes')}>Voir tout</Bouton>}
          noPadding>
          {aRisque.length===0 ? (
            <div style={{textAlign:'center',padding:'40px',color:'#a8a29e'}}>
              <div style={{fontSize:'36px',marginBottom:'10px'}}>✅</div>
              <div style={{fontWeight:'600',color:'#78716c'}}>Aucun étudiant en difficulté</div>
            </div>
          ) : aRisque.map((e,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'14px 20px',borderBottom:i<aRisque.length-1?'1px solid #f5f5f4':'none',
              transition:'background 0.1s'}}
              onMouseEnter={ev=>ev.currentTarget.style.background='#fafaf9'}
              onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
              <div>
                <div style={{fontWeight:'600',fontSize:'14px',color:'#1c1917'}}>{e.etudiant}</div>
                <div style={{fontSize:'12px',color:'#a8a29e',marginTop:'2px'}}>{e.cours}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:'900',fontSize:'20px',color:'#ef4444',lineHeight:1}}>
                  {e.note_finale}<span style={{fontSize:'12px',fontWeight:'400',color:'#a8a29e'}}>/20</span>
                </div>
                {e.en_rattrapage && <Badge type="warning">Rattrapage</Badge>}
              </div>
            </div>
          ))}
        </Card>

        {/* Finance Admin ou Accès rapide */}
        {estAdmin && finance ? (
          <Card titre="Tableau financier" accent="#10b981"
            actions={<Bouton variante="ghost" petit onClick={()=>navigate('/paiements')}>Détails</Bouton>}>
            {[
              {label:'Total encaissé',     val:formatAriary(finance.total_encaisse),     color:'#059669',bg:'#ecfdf5',border:'#a7f3d0'},
              {label:'Montant restant dû', val:formatAriary(finance.montant_restant_du), color:'#dc2626',bg:'#fef2f2',border:'#fecaca'},
              {label:'Paiements en retard',val:finance.nb_retards,                       color:'#d97706',bg:'#fffbeb',border:'#fde68a'},
              {label:'Étudiants en dette', val:finance.nb_etudiants_en_dette,            color:'#dc2626',bg:'#fef2f2',border:'#fecaca'},
            ].map((item,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'12px 16px',borderRadius:'10px',marginBottom:'8px',
                background:item.bg,border:`1px solid ${item.border}`}}>
                <span style={{color:'#57534e',fontSize:'13px',fontWeight:'500'}}>{item.label}</span>
                <span style={{fontWeight:'800',color:item.color,fontSize:'16px'}}>{item.val}</span>
              </div>
            ))}
          </Card>
        ) : (
          <Card titre="Accès rapide" accent="#059669">
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {(estEtudiant?[
                {path:'/notes',     label:'Mon bulletin de notes',icone:'📝',color:'#059669'},
                {path:'/presences', label:'Mes présences',        icone:'✅',color:'#10b981'},
                {path:'/paiements', label:'Situation financière', icone:'💳',color:'#f59e0b'},
                {path:'/planning',  label:"Mon emploi du temps",  icone:'📅',color:'#8b5cf6'},
              ]:[
                {path:'/notes',     label:'Saisir des notes',     icone:'📝',color:'#059669'},
                {path:'/presences', label:'Gérer les présences',  icone:'✅',color:'#10b981'},
                {path:'/planning',  label:'Voir le planning',     icone:'📅',color:'#8b5cf6'},
              ]).map((item,i)=>(
                <button key={i} onClick={()=>navigate(item.path)} style={{
                  display:'flex',alignItems:'center',gap:'12px',
                  padding:'12px 14px',background:'#fafaf9',
                  border:'1.5px solid #e7e5e4',borderRadius:'10px',
                  cursor:'pointer',transition:'all 0.15s',textAlign:'left',width:'100%',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=item.color;e.currentTarget.style.background=item.color+'12';e.currentTarget.style.transform='translateX(4px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#e7e5e4';e.currentTarget.style.background='#fafaf9';e.currentTarget.style.transform='translateX(0)';}}
                >
                  <div style={{width:'34px',height:'34px',borderRadius:'9px',
                    background:item.color+'15',border:`1px solid ${item.color}25`,
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',flexShrink:0}}>
                    {item.icone}
                  </div>
                  <span style={{fontWeight:'600',color:'#1c1917',fontSize:'14px',flex:1}}>{item.label}</span>
                  <span style={{color:'#a8a29e',fontSize:'18px'}}>›</span>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};
export default Dashboard;