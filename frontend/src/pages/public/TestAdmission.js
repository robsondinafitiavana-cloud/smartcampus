import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const QUESTIONS = {
  INF: [
    { q:'Quel appareil utilise-t-on pour naviguer sur Internet ?', rep:['Réfrigérateur','Ordinateur','Téléviseur','Voiture'], bonne:1 },
    { q:'Que signifie "www" dans une adresse web ?', rep:['World Wide Web','Work With Windows','Web World Wide','World Work Web'], bonne:0 },
    { q:'Quel est le rôle d\'un mot de passe ?', rep:['Décorer le compte','Protéger l\'accès à un compte','Changer la couleur de l\'écran','Accélérer Internet'], bonne:1 },
    { q:'Qu\'est-ce qu\'un email ?', rep:['Un type d\'ordinateur','Un courrier électronique','Un jeu vidéo','Un câble réseau'], bonne:1 },
    { q:'Quel est le symbole utilisé dans une adresse email ?', rep:['#','$','@','%'], bonne:2 },
    { q:'Que fait la touche "Supprimer" sur un clavier ?', rep:['Enregistre un fichier','Efface du texte','Ouvre Internet','Éteint l\'ordinateur'], bonne:1 },
    { q:'Qu\'est-ce qu\'une application mobile ?', rep:['Un type de voiture','Un logiciel sur smartphone','Un meuble de bureau','Un type de réseau'], bonne:1 },
    { q:'Quel langage utilise-t-on pour créer des pages web ?', rep:['Français','HTML','Anglais','Excel'], bonne:1 },
    { q:'Que signifie "sauvegarder" un fichier ?', rep:['Supprimer le fichier','L\'enregistrer pour ne pas le perdre','Le partager avec tout le monde','L\'imprimer'], bonne:1 },
    { q:'Qu\'est-ce qu\'une base de données ?', rep:['Un meuble de rangement','Un endroit pour stocker des informations numériques','Un type de réseau','Un logiciel de dessin'], bonne:1 },
    { q:'Quel est le rôle d\'un antivirus ?', rep:['Accélérer l\'ordinateur','Protéger l\'ordinateur contre les virus informatiques','Créer des virus','Sauvegarder les fichiers'], bonne:1 },
    { q:'Qu\'est-ce que le Wi-Fi ?', rep:['Un type d\'ordinateur','Une connexion Internet sans fil','Un logiciel','Un câble'], bonne:1 },
    { q:'Que signifie "copier-coller" ?', rep:['Supprimer du texte','Dupliquer un contenu et le placer ailleurs','Changer la police','Imprimer un document'], bonne:1 },
    { q:'Qu\'est-ce qu\'un fichier PDF ?', rep:['Un format de musique','Un format de document portable','Un type de virus','Un logiciel de jeu'], bonne:1 },
    { q:'Quel bouton permet d\'éteindre un ordinateur ?', rep:['Entrée (Enter)','Espace','Bouton Power (alimentation)','Echap (Escape)'], bonne:2 },
  ],
  GST: [
    { q:'Qu\'est-ce qu\'un budget ?', rep:['Une liste de courses','Un plan de dépenses et de revenus','Un type de contrat','Un document juridique'], bonne:1 },
    { q:'Que signifie "bénéfice" pour une entreprise ?', rep:['Une perte d\'argent','L\'argent gagné après avoir payé les dépenses','Un type de contrat','Une facture'], bonne:1 },
    { q:'Qu\'est-ce qu\'une facture ?', rep:['Un document qui demande un paiement','Un type de compte bancaire','Un contrat de travail','Un rapport annuel'], bonne:0 },
    { q:'Que veut dire "gérer une entreprise" ?', rep:['Jouer dans une entreprise','Organiser et diriger les activités d\'une entreprise','Visiter une entreprise','Fermer une entreprise'], bonne:1 },
    { q:'Qu\'est-ce qu\'un salaire ?', rep:['Une prime exceptionnelle','La rémunération mensuelle d\'un employé','Un bonus annuel','Un remboursement'], bonne:1 },
    { q:'Que signifie "client" dans une entreprise ?', rep:['Un employé','Une personne qui achète un produit ou service','Un concurrent','Un fournisseur'], bonne:1 },
    { q:'Qu\'est-ce qu\'une dépense ?', rep:['De l\'argent reçu','De l\'argent dépensé ou payé','Un bénéfice','Un investissement'], bonne:1 },
    { q:'Que signifie "vendre" ?', rep:['Acheter un produit','Échanger un produit contre de l\'argent','Fabriquer un produit','Stocker un produit'], bonne:1 },
    { q:'Qu\'est-ce qu\'un compte bancaire ?', rep:['Un carnet de notes','Un endroit à la banque où on dépose et retire de l\'argent','Un type de prêt','Un document comptable'], bonne:1 },
    { q:'Que veut dire "profit" ?', rep:['Une perte','Un gain financier après déduction des coûts','Une taxe','Un salaire'], bonne:1 },
    { q:'Qu\'est-ce qu\'un employé ?', rep:['Le propriétaire d\'une entreprise','Une personne qui travaille pour une entreprise','Un client','Un concurrent'], bonne:1 },
    { q:'Que signifie "investir" ?', rep:['Dépenser de l\'argent inutilement','Placer de l\'argent pour en gagner plus tard','Prêter de l\'argent','Économiser de l\'argent'], bonne:1 },
    { q:'Qu\'est-ce qu\'un contrat de travail ?', rep:['Un accord entre un employeur et un employé','Un document de vente','Un rapport financier','Un bilan comptable'], bonne:0 },
    { q:'Que signifie "recette" dans un contexte financier ?', rep:['Une recette de cuisine','L\'argent reçu par une entreprise','Une dépense','Un remboursement'], bonne:1 },
    { q:'Qu\'est-ce qu\'une taxe ?', rep:['Un cadeau de l\'État','Un impôt payé à l\'État','Un salaire','Un bénéfice'], bonne:1 },
  ],
  DRT: [
    { q:'Qu\'est-ce que la loi ?', rep:['Une opinion personnelle','Une règle établie par l\'État que tout le monde doit respecter','Un conseil d\'ami','Une habitude'], bonne:1 },
    { q:'Que signifie "innocent" en droit ?', rep:['Coupable d\'un crime','Non reconnu coupable d\'une infraction','Condamné par un tribunal','Arrêté par la police'], bonne:1 },
    { q:'Qu\'est-ce qu\'un tribunal ?', rep:['Un bureau administratif','Un lieu où la justice est rendue','Une école de droit','Un commissariat de police'], bonne:1 },
    { q:'Que fait un avocat ?', rep:['Juge les criminels','Défend et représente des personnes en justice','Arrête les criminels','Fait les lois'], bonne:1 },
    { q:'Qu\'est-ce qu\'un contrat ?', rep:['Une lettre amicale','Un accord entre deux personnes ou plus','Un type de loi','Un jugement'], bonne:1 },
    { q:'Que signifie "droit" dans le contexte juridique ?', rep:['Une direction (opposé de gauche)','L\'ensemble des règles qui régissent la société','Une opinion','Un conseil'], bonne:1 },
    { q:'Qu\'est-ce qu\'une arrestation ?', rep:['Une amende','Être retenu par la police suite à une infraction','Une condamnation','Un jugement'], bonne:1 },
    { q:'Que signifie "porter plainte" ?', rep:['Faire une réclamation à la police ou justice','Payer une amende','Aller au tribunal en tant que juge','Défendre quelqu\'un'], bonne:0 },
    { q:'Qu\'est-ce qu\'une amende ?', rep:['Une peine de prison','Une somme d\'argent à payer comme sanction','Un avertissement oral','Une loi'], bonne:1 },
    { q:'Que signifie "mineur" en droit ?', rep:['Une personne qui travaille dans une mine','Une personne de moins de 18 ans','Un type de crime','Un petit délit'], bonne:1 },
    { q:'Qu\'est-ce qu\'un juge ?', rep:['Un policier','Une personne qui rend des décisions de justice','Un avocat','Un procureur'], bonne:1 },
    { q:'Que signifie "droits de l\'homme" ?', rep:['Des droits uniquement pour les hommes','Des droits fondamentaux pour tous les êtres humains','Des lois militaires','Des règles sportives'], bonne:1 },
    { q:'Qu\'est-ce qu\'une constitution ?', rep:['Un type de contrat','La loi fondamentale d\'un pays','Un règlement intérieur','Un traité commercial'], bonne:1 },
    { q:'Que fait la police ?', rep:['Fait les lois','Maintient l\'ordre public et protège les citoyens','Juge les criminels','Défend les accusés'], bonne:1 },
    { q:'Qu\'est-ce que la justice ?', rep:['Une opinion personnelle','Le système qui applique les lois et protège les droits','Un parti politique','Une force militaire'], bonne:1 },
  ],
};

const FILIERES_INFO = {
  INF: { nom:'Informatique', icone:'💻', couleur:'#059669', couleur2:'#047857' },
  GST: { nom:'Gestion',      icone:'📊', couleur:'#6366f1', couleur2:'#4f46e5' },
  DRT: { nom:'Droit',        icone:'⚖️', couleur:'#dc2626', couleur2:'#b91c1c' },
};

const SEUIL = 60;

const TestAdmission = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const filiereParam   = searchParams.get('filiere');

  const [etape,        setEtape]        = useState(filiereParam ? 'infos' : 'choix');
  const [filiere,      setFiliere]      = useState(filiereParam || '');
  const [candidat,     setCandidat]     = useState({ nom:'', prenom:'', email:'', contact:'' });
  const [reponses,     setReponses]     = useState({});
  const [resultat,     setResultat]     = useState(null);
  const [tempsRestant, setTempsRestant] = useState(20 * 60);
  const [timerActif,   setTimerActif]   = useState(false);
  const [questionIdx,  setQuestionIdx]  = useState(0);
  const [envoi,        setEnvoi]        = useState({ loading:false, fait:false, erreur:'' });

  useEffect(() => {
    if (!timerActif) return;
    if (tempsRestant <= 0) { soumettreTest(); return; }
    const t = setInterval(() => setTempsRestant(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timerActif, tempsRestant]); // eslint-disable-line

  const fmt = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  const demarrerTest = () => {
    setReponses({}); setQuestionIdx(0);
    setTempsRestant(20*60); setTimerActif(true); setEtape('test');
  };

  const soumettreTest = () => {
    setTimerActif(false);
    const qs = QUESTIONS[filiere];
    let bonnes = 0;
    qs.forEach((q,i) => { if (reponses[i] === q.bonne) bonnes++; });
    const score = Math.round((bonnes / qs.length) * 100);
    setResultat({ score, bonnes, total:qs.length, admis: score >= SEUIL });
    setEtape('resultat');
  };

  const envoyerDemande = async () => {
    setEnvoi({ loading:true, fait:false, erreur:'' });
    try {
      await axios.post(`${API}/demandes/soumettre/`, {
        nom: candidat.nom, prenom: candidat.prenom,
        email: candidat.email, contact: candidat.contact,
        filiere, score_test: resultat.score,
        nb_bonnes: resultat.bonnes, nb_questions: resultat.total,
      });
      setEnvoi({ loading:false, fait:true, erreur:'' });
    } catch (err) {
      const msg = err.response?.data?.email?.[0]
        || err.response?.data?.score_test?.[0]
        || 'Erreur lors de l\'envoi. Réessayez.';
      setEnvoi({ loading:false, fait:false, erreur: msg });
    }
  };

  const recommencer = () => {
    setResultat(null); setReponses({});
    setEnvoi({ loading:false, fait:false, erreur:'' });
    setEtape('infos');
  };

  const f  = FILIERES_INFO[filiere];
  const qs = QUESTIONS[filiere] || [];
  const progression = Object.keys(reponses).length;
  const timerCouleur = tempsRestant < 300 ? '#ef4444' : tempsRestant < 600 ? '#f59e0b' : '#059669';

  // ── CHOIX FILIÈRE ────────────────────────────────────────
  if (etape === 'choix') return (
    <div style={{ minHeight:'100vh', background:'#f5f5f4' }}>
      <nav style={{ background:'#fff', borderBottom:'1px solid #e7e5e4', padding:'16px 32px',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:'10px',
          background:'none', border:'none', cursor:'pointer' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'10px',
            background:'linear-gradient(135deg,#064e3b,#047857)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'15px', fontWeight:'900', color:'#fff' }}>S</div>
          <span style={{ fontWeight:'700', color:'#1c1917', fontSize:'15px' }}>SmartCampus</span>
        </button>
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none',
          color:'#78716c', cursor:'pointer', fontSize:'14px' }}>← Retour à l'accueil</button>
      </nav>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'60px 24px' }}>
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <div style={{ fontSize:'56px', marginBottom:'16px' }}>📝</div>
          <h1 style={{ fontSize:'34px', fontWeight:'900', color:'#1c1917',
            letterSpacing:'-1px', marginBottom:'12px' }}>Test d'admission</h1>
          <p style={{ fontSize:'15px', color:'#78716c', lineHeight:1.7, maxWidth:'500px' }}>
            Choisissez votre filière. Le test comporte <strong>15 questions simples</strong>
            et dure <strong>20 minutes</strong>.<br/>
            Note minimale requise : <strong style={{color:'#059669'}}>60%</strong>
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px', maxWidth:'780px', width:'100%' }}>
          {Object.entries(FILIERES_INFO).map(([code, info]) => (
            <button key={code} onClick={() => { setFiliere(code); setEtape('infos'); }} style={{
              padding:'32px 20px', borderRadius:'16px', border:'2px solid #e7e5e4',
              background:'#fff', cursor:'pointer', transition:'all 0.2s', textAlign:'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=info.couleur; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 32px ${info.couleur}25`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#e7e5e4'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
            >
              <div style={{ fontSize:'48px', marginBottom:'12px' }}>{info.icone}</div>
              <div style={{ fontSize:'20px', fontWeight:'800', color:'#1c1917', marginBottom:'8px' }}>{info.nom}</div>
              <div style={{ fontSize:'12px', color:'#a8a29e', marginBottom:'16px' }}>15 questions faciles · 20 min</div>
              <div style={{ padding:'10px', background:`linear-gradient(135deg,${info.couleur},${info.couleur2})`,
                borderRadius:'10px', color:'#fff', fontWeight:'700', fontSize:'13px' }}>
                Choisir →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── INFOS CANDIDAT ───────────────────────────────────────
  if (etape === 'infos') return (
    <div style={{ minHeight:'100vh', background:'#f5f5f4', display:'flex', flexDirection:'column' }}>
      <nav style={{ background:'#fff', borderBottom:'1px solid #e7e5e4', padding:'16px 32px',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontWeight:'700', color:'#1c1917' }}>Test d'admission — {f?.nom}</span>
        <button onClick={() => setEtape('choix')} style={{ background:'none', border:'none',
          color:'#78716c', cursor:'pointer' }}>← Changer de filière</button>
      </nav>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ background:'#fff', borderRadius:'20px', padding:'40px',
          maxWidth:'500px', width:'100%', boxShadow:'0 8px 32px rgba(0,0,0,0.08)', border:'1px solid #e7e5e4' }}>
          <div style={{ background:`linear-gradient(135deg,${f?.couleur},${f?.couleur2})`,
            borderRadius:'14px', padding:'18px 22px', marginBottom:'28px',
            display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{ fontSize:'34px' }}>{f?.icone}</div>
            <div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', fontWeight:'600' }}>Filière choisie</div>
              <div style={{ color:'#fff', fontSize:'20px', fontWeight:'900' }}>{f?.nom}</div>
            </div>
          </div>
          <h2 style={{ fontSize:'18px', fontWeight:'800', color:'#1c1917', marginBottom:'6px' }}>Vos informations</h2>
          <p style={{ color:'#78716c', fontSize:'13px', marginBottom:'22px' }}>
            Ces informations seront transmises à l'administration si vous réussissez.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            {[
              { key:'nom',     label:'Nom *',     placeholder:'Votre nom' },
              { key:'prenom',  label:'Prénom *',  placeholder:'Votre prénom' },
              { key:'email',   label:'Email *',   placeholder:'votre@email.com', full:true },
              { key:'contact', label:'Téléphone', placeholder:'034 XX XXX XX' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom:'14px', gridColumn:field.full?'1/-1':undefined }}>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'600',
                  color:'#44403c', marginBottom:'6px' }}>{field.label}</label>
                <input type={field.key==='email'?'email':'text'}
                  value={candidat[field.key]}
                  onChange={e => setCandidat(c => ({...c,[field.key]:e.target.value}))}
                  placeholder={field.placeholder}
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e7e5e4',
                    borderRadius:'10px', fontSize:'14px', color:'#1c1917',
                    background:'#fafaf9', outline:'none', transition:'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor=f?.couleur; e.target.style.boxShadow=`0 0 0 3px ${f?.couleur}20`; }}
                  onBlur={e => { e.target.style.borderColor='#e7e5e4'; e.target.style.boxShadow='none'; }}
                />
              </div>
            ))}
          </div>
          <div style={{ background:'#ecfdf5', borderRadius:'10px', padding:'12px',
            fontSize:'13px', color:'#065f46', marginBottom:'20px', lineHeight:1.6,
            border:'1px solid #a7f3d0' }}>
            💡 Les questions sont <strong>simples et accessibles</strong> — pas besoin de connaissances avancées !
            <br/>⏱️ <strong>15 questions · 20 minutes</strong> · Score minimum : <strong>{SEUIL}%</strong>
          </div>
          <button disabled={!candidat.nom||!candidat.prenom||!candidat.email} onClick={demarrerTest}
            style={{ width:'100%', padding:'14px',
              background:(!candidat.nom||!candidat.prenom||!candidat.email)?'#e7e5e4':`linear-gradient(135deg,${f?.couleur},${f?.couleur2})`,
              color:(!candidat.nom||!candidat.prenom||!candidat.email)?'#a8a29e':'#fff',
              border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'700',
              cursor:(!candidat.nom||!candidat.prenom||!candidat.email)?'not-allowed':'pointer',
              transition:'all 0.2s' }}>
            🚀 Commencer le test
          </button>
        </div>
      </div>
    </div>
  );

  // ── TEST QCM ────────────────────────────────────────────
  if (etape === 'test') {
    const q = qs[questionIdx];
    return (
      <div style={{ minHeight:'100vh', background:'#f5f5f4' }}>
        <div style={{ background:'#fff', borderBottom:'1px solid #e7e5e4', padding:'13px 28px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontWeight:'700', color:'#1c1917' }}>
            {f?.icone} Test {f?.nom} — {candidat.prenom} {candidat.nom}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 16px',
            background:tempsRestant<300?'#fef2f2':'#f0fdf4',
            border:`1px solid ${timerCouleur}40`, borderRadius:'10px' }}>
            <span>{tempsRestant<300?'⚠️':'⏱️'}</span>
            <span style={{ fontWeight:'800', fontSize:'17px', color:timerCouleur }}>{fmt(tempsRestant)}</span>
          </div>
          <div style={{ fontSize:'13px', color:'#78716c', fontWeight:'600' }}>
            {progression}/{qs.length} répondues
          </div>
        </div>
        <div style={{ height:'4px', background:'#e7e5e4' }}>
          <div style={{ height:'100%', background:`linear-gradient(90deg,${f?.couleur},${f?.couleur2})`,
            width:`${(questionIdx/qs.length)*100}%`, transition:'width 0.3s' }}/>
        </div>
        <div style={{ maxWidth:'780px', margin:'0 auto', padding:'36px 24px' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'28px', justifyContent:'center' }}>
            {qs.map((_,i) => (
              <button key={i} onClick={() => setQuestionIdx(i)} style={{
                width:'34px', height:'34px', borderRadius:'8px', border:'none', fontWeight:'700', fontSize:'12px',
                cursor:'pointer', transition:'all 0.15s',
                background: reponses[i]!==undefined ? `linear-gradient(135deg,${f?.couleur},${f?.couleur2})` : i===questionIdx?'#1c1917':'#e7e5e4',
                color: reponses[i]!==undefined||i===questionIdx ? '#fff' : '#78716c',
              }}>{i+1}</button>
            ))}
          </div>
          <div style={{ background:'#fff', borderRadius:'18px', padding:'32px',
            border:'1px solid #e7e5e4', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:'11px', fontWeight:'700', color:'#a8a29e',
              textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px' }}>
              Question {questionIdx+1} sur {qs.length}
            </div>
            <h2 style={{ fontSize:'19px', fontWeight:'800', color:'#1c1917',
              lineHeight:1.4, marginBottom:'26px', letterSpacing:'-0.3px' }}>{q.q}</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {q.rep.map((rep,i) => {
                const sel = reponses[questionIdx]===i;
                return (
                  <button key={i} onClick={() => setReponses(r => ({...r,[questionIdx]:i}))} style={{
                    padding:'14px 18px', borderRadius:'11px', textAlign:'left',
                    border:`2px solid ${sel?f?.couleur:'#e7e5e4'}`,
                    background:sel?`${f?.couleur}12`:'#fafaf9',
                    color:'#1c1917', fontSize:'14px', fontWeight:sel?'700':'500',
                    cursor:'pointer', transition:'all 0.15s',
                    display:'flex', alignItems:'center', gap:'12px',
                  }}
                    onMouseEnter={e => { if(!sel){ e.currentTarget.style.borderColor=f?.couleur; e.currentTarget.style.background=`${f?.couleur}08`; }}}
                    onMouseLeave={e => { if(!sel){ e.currentTarget.style.borderColor='#e7e5e4'; e.currentTarget.style.background='#fafaf9'; }}}
                  >
                    <div style={{ width:'26px', height:'26px', borderRadius:'50%', flexShrink:0,
                      border:`2px solid ${sel?f?.couleur:'#d6d3d1'}`,
                      background:sel?f?.couleur:'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'11px', color:'#fff', fontWeight:'700' }}>
                      {sel?'✓':String.fromCharCode(65+i)}
                    </div>
                    {rep}
                  </button>
                );
              })}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'24px', alignItems:'center' }}>
              <button onClick={() => setQuestionIdx(p=>Math.max(0,p-1))} disabled={questionIdx===0} style={{
                padding:'9px 18px', background:'#f5f5f4', border:'1px solid #e7e5e4',
                borderRadius:'10px', color:questionIdx===0?'#a8a29e':'#44403c',
                fontWeight:'600', fontSize:'13px', cursor:questionIdx===0?'not-allowed':'pointer' }}>
                ← Précédente
              </button>
              {questionIdx < qs.length-1 ? (
                <button onClick={() => setQuestionIdx(p=>p+1)} style={{
                  padding:'9px 22px', background:`linear-gradient(135deg,${f?.couleur},${f?.couleur2})`,
                  border:'none', borderRadius:'10px', color:'#fff', fontWeight:'700',
                  fontSize:'13px', cursor:'pointer' }}>
                  Suivante →
                </button>
              ) : (
                <button onClick={() => { if(window.confirm(`Soumettre le test ? (${progression}/${qs.length} répondues)`)) soumettreTest(); }} style={{
                  padding:'9px 22px', background:'linear-gradient(135deg,#059669,#047857)',
                  border:'none', borderRadius:'10px', color:'#fff', fontWeight:'800',
                  fontSize:'13px', cursor:'pointer' }}>
                  ✅ Terminer le test
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RÉSULTAT ─────────────────────────────────────────────
  if (etape === 'resultat' && resultat) {
    return (
      <div style={{ minHeight:'100vh',
        background:resultat.admis?'linear-gradient(160deg,#022c22,#064e3b)':'linear-gradient(160deg,#1c0a0a,#7f1d1d)',
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ maxWidth:'580px', width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:'72px', marginBottom:'20px' }}>{resultat.admis?'🎉':'😔'}</div>
          <div style={{ fontSize:'70px', fontWeight:'900', color:'#fff', letterSpacing:'-3px', lineHeight:1, marginBottom:'8px' }}>
            {resultat.score}<span style={{ fontSize:'30px', opacity:0.6 }}>%</span>
          </div>
          <div style={{ fontSize:'15px', color:'rgba(255,255,255,0.55)', marginBottom:'28px' }}>
            {resultat.bonnes} bonne{resultat.bonnes>1?'s':''} réponse{resultat.bonnes>1?'s':''} sur {resultat.total}
          </div>
          <div style={{
            background:resultat.admis?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)',
            border:`1px solid ${resultat.admis?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'}`,
            borderRadius:'16px', padding:'22px 28px', marginBottom:'28px' }}>
            <div style={{ fontSize:'22px', fontWeight:'900', color:'#fff', marginBottom:'8px' }}>
              {resultat.admis?'✅ Félicitations ! Vous êtes admis(e).':'❌ Score insuffisant'}
            </div>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>
              {resultat.admis
                ? `Vous avez réussi le test en ${f?.nom} avec ${resultat.score}%. Envoyez votre demande à l'administration.`
                : `La note minimale est de ${SEUIL}%. Révisez et recommencez !`}
            </p>
          </div>

          {resultat.admis && (
            <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'16px',
              padding:'24px', marginBottom:'24px', border:'1px solid rgba(255,255,255,0.12)' }}>
              <h3 style={{ color:'#fff', fontWeight:'800', fontSize:'16px', marginBottom:'12px' }}>
                📨 Envoyer votre demande à l'administration
              </h3>
              <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'10px',
                padding:'14px', marginBottom:'16px', textAlign:'left' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', fontSize:'13px' }}>
                  {[['Nom complet',`${candidat.prenom} ${candidat.nom}`],['Email',candidat.email],['Filière',f?.nom],['Score',`${resultat.score}% ✅`]].map(([l,v])=>(
                    <div key={l}>
                      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'11px', marginBottom:'2px' }}>{l}</div>
                      <div style={{ color:'#fff', fontWeight:'600' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              {envoi.fait ? (
                <div style={{ background:'rgba(16,185,129,0.2)', border:'1px solid rgba(16,185,129,0.4)',
                  borderRadius:'10px', padding:'16px', color:'#6ee7b7', fontWeight:'600' }}>
                  ✅ Demande envoyée avec succès !<br/>
                  <span style={{ fontSize:'13px', opacity:0.8, fontWeight:'400' }}>
                    L'administration va examiner votre dossier et vous contactera à {candidat.email}.
                  </span>
                </div>
              ) : (
                <>
                  {envoi.erreur && (
                    <div style={{ background:'rgba(239,68,68,0.2)', borderRadius:'10px',
                      padding:'12px', color:'#fca5a5', fontSize:'13px', marginBottom:'12px' }}>
                      ⚠️ {envoi.erreur}
                    </div>
                  )}
                  <button onClick={envoyerDemande} disabled={envoi.loading} style={{
                    width:'100%', padding:'13px',
                    background:envoi.loading?'rgba(255,255,255,0.2)':'linear-gradient(135deg,#10b981,#059669)',
                    color:'#fff', border:'none', borderRadius:'12px',
                    fontSize:'15px', fontWeight:'800', cursor:envoi.loading?'not-allowed':'pointer',
                    transition:'all 0.2s' }}>
                    {envoi.loading?'⏳ Envoi en cours...':'📨 Envoyer ma demande à l\'administration'}
                  </button>
                </>
              )}
            </div>
          )}

          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            {!resultat.admis && (
              <button onClick={recommencer} style={{
                padding:'13px 28px', background:'linear-gradient(135deg,#f59e0b,#d97706)',
                color:'#fff', border:'none', borderRadius:'12px',
                fontSize:'14px', fontWeight:'800', cursor:'pointer' }}>
                🔄 Recommencer
              </button>
            )}
            {envoi.fait && (
              <button onClick={() => navigate('/login')} style={{
                padding:'13px 28px', background:'linear-gradient(135deg,#10b981,#059669)',
                color:'#fff', border:'none', borderRadius:'12px',
                fontSize:'14px', fontWeight:'800', cursor:'pointer' }}>
                🔐 Aller à la connexion
              </button>
            )}
            <button onClick={() => navigate('/')} style={{
              padding:'13px 24px', background:'rgba(255,255,255,0.1)',
              color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.2)',
              borderRadius:'12px', fontSize:'14px', cursor:'pointer' }}>
              Retour à l'accueil
            </button>
          </div>

          <div style={{ marginTop:'36px' }}>
            <div style={{ fontSize:'11px', fontWeight:'700', color:'rgba(255,255,255,0.3)',
              textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px' }}>
              Récapitulatif
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px' }}>
              {qs.map((q_,i) => {
                const correct = reponses[i]===q_.bonne;
                const repondu = reponses[i]!==undefined;
                return (
                  <div key={i} style={{ padding:'8px', borderRadius:'8px', textAlign:'center',
                    background:!repondu?'rgba(255,255,255,0.05)':correct?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)',
                    border:`1px solid ${!repondu?'rgba(255,255,255,0.08)':correct?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'}` }}>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)', marginBottom:'2px' }}>Q{i+1}</div>
                    <div style={{ fontSize:'14px' }}>{!repondu?'—':correct?'✅':'❌'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
export default TestAdmission;
