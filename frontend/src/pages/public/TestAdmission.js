/**
 * pages/public/TestAdmission.js — Test d'admission en ligne
 * ===========================================================
 * 1. Choisir la filière (INF, GST, DRT)
 * 2. Remplir infos personnelles
 * 3. Passer le QCM (15 questions par filière)
 * 4. Résultat : ≥ 60% → Admis + formulaire inscription / < 60% → Échec + recommencer
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// ══════════════════════════════════════════════════════════════
// QUESTIONS PAR FILIÈRE
// ══════════════════════════════════════════════════════════════
const QUESTIONS = {
  INF: [
    { q:'Quel langage est principalement utilisé pour le développement web frontend ?', rep:['Python','JavaScript','Java','C++'], bonne:1 },
    { q:'Que signifie "HTML" ?', rep:['HyperText Markup Language','High Tech Machine Learning','HyperText Main Link','High Text Markup Language'], bonne:0 },
    { q:'Quelle est la complexité d\'une recherche binaire ?', rep:['O(n)','O(n²)','O(log n)','O(1)'], bonne:2 },
    { q:'Qu\'est-ce qu\'une base de données relationnelle ?', rep:['Un fichier Excel','Un système qui organise des données en tables liées','Un langage de programmation','Un navigateur web'], bonne:1 },
    { q:'Quel est le rôle d\'un serveur DNS ?', rep:['Stocker des fichiers','Traduire les noms de domaine en adresses IP','Sécuriser les connexions','Compresser les données'], bonne:1 },
    { q:'Qu\'est-ce que l\'algorithme de tri à bulles ?', rep:['Un tri qui divise le tableau en deux','Un tri qui compare des éléments adjacents et les échange','Un tri basé sur des arbres','Un tri aléatoire'], bonne:1 },
    { q:'Quelle structure de données fonctionne en LIFO (Last In First Out) ?', rep:['File (Queue)','Liste','Pile (Stack)','Tableau'], bonne:2 },
    { q:'Que fait la commande "git commit" ?', rep:['Télécharge le code','Enregistre les modifications localement','Envoie le code au serveur','Crée un nouveau fichier'], bonne:1 },
    { q:'Qu\'est-ce que le protocole HTTP ?', rep:['Un langage de programmation','Un protocole de transfert de données sur le web','Un système d\'exploitation','Une base de données'], bonne:1 },
    { q:'Quel est le résultat de 2 ** 8 en Python ?', rep:['16','256','64','128'], bonne:1 },
    { q:'Qu\'est-ce que la récursivité ?', rep:['Une boucle infinie','Une fonction qui s\'appelle elle-même','Un type de variable','Une méthode de tri'], bonne:1 },
    { q:'Quel composant stocke les données de manière permanente ?', rep:['RAM','CPU','Disque dur (HDD/SSD)','Cache'], bonne:2 },
    { q:'Que signifie "API" ?', rep:['Application Programming Interface','Advanced Programming Index','Automatic Processing Integration','Application Processing Interface'], bonne:0 },
    { q:'Quel système de numérotation utilise la base 2 ?', rep:['Décimal','Hexadécimal','Binaire','Octal'], bonne:2 },
    { q:'Qu\'est-ce que la virtualisation ?', rep:['Créer des copies visuelles','Simuler des ressources matérielles avec du logiciel','Accélérer le processeur','Compresser des images'], bonne:1 },
  ],
  GST: [
    { q:'Qu\'est-ce que le bilan comptable ?', rep:['Un document qui liste les revenus','Un document qui présente l\'actif et le passif d\'une entreprise','Un rapport de ventes','Un contrat de travail'], bonne:1 },
    { q:'Que signifie "ROI" en finance ?', rep:['Rate Of Income','Return On Investment','Revenue Of Institution','Rate Of Integration'], bonne:1 },
    { q:'Qu\'est-ce que le marketing mix ?', rep:['Un mélange de produits','L\'ensemble des variables contrôlables (4P)','Une stratégie de prix','Un type de publicité'], bonne:1 },
    { q:'Quelle est la formule du bénéfice ?', rep:['Charges - Produits','Produits + Charges','Produits - Charges','Actif - Passif'], bonne:2 },
    { q:'Qu\'est-ce qu\'un actif dans un bilan ?', rep:['Ce que l\'entreprise doit','Ce que l\'entreprise possède','Les salaires des employés','Les impôts payés'], bonne:1 },
    { q:'Que signifie "B2B" ?', rep:['Business to Buyer','Business to Business','Brand to Brand','Budget to Business'], bonne:1 },
    { q:'Qu\'est-ce que la marge brute ?', rep:['Chiffre d\'affaires - Coût des marchandises vendues','Bénéfice net - Impôts','Revenus totaux - Charges totales','Capital - Dettes'], bonne:0 },
    { q:'Quel document prévoit les entrées et sorties d\'argent ?', rep:['Bilan','Compte de résultat','Budget de trésorerie','Livre de paie'], bonne:2 },
    { q:'Qu\'est-ce que la segmentation de marché ?', rep:['Diviser le marché en groupes homogènes','Fixer les prix','Créer des produits','Recruter des vendeurs'], bonne:0 },
    { q:'Que représente le taux d\'intérêt ?', rep:['Le prix du risque','Le coût de l\'argent emprunté','La valeur des actions','Le montant des taxes'], bonne:1 },
    { q:'Qu\'est-ce que la valeur ajoutée ?', rep:['Le bénéfice net','La différence entre la production et les consommations intermédiaires','Le chiffre d\'affaires','Les charges sociales'], bonne:1 },
    { q:'Quel est le rôle d\'un manager ?', rep:['Uniquement contrôler','Planifier, organiser, diriger et contrôler','Seulement recruter','Gérer les stocks'], bonne:1 },
    { q:'Qu\'est-ce qu\'une SARL ?', rep:['Société Anonyme à Responsabilité Limitée','Société À Responsabilité Limitée','Société Associée à Règles Légales','Syndicat Associatif à Responsabilité Locale'], bonne:1 },
    { q:'Que mesure le ratio de liquidité ?', rep:['La rentabilité','La capacité à honorer les dettes à court terme','La croissance','Le niveau d\'endettement long terme'], bonne:1 },
    { q:'Qu\'est-ce que le seuil de rentabilité ?', rep:['Le bénéfice maximum','Le niveau d\'activité où les charges égalent les produits','Le prix minimum','Le budget maximum'], bonne:1 },
  ],
  DRT: [
    { q:'Qu\'est-ce qu\'un contrat en droit ?', rep:['Un document officiel sans engagement','Un accord de volontés créant des obligations','Une loi votée par le parlement','Un jugement de tribunal'], bonne:1 },
    { q:'Que signifie "juridiction" ?', rep:['Un type de loi','Le pouvoir de rendre la justice dans un domaine','Un contrat spécial','Une peine de prison'], bonne:1 },
    { q:'Quelle est la différence entre droit civil et droit pénal ?', rep:['Il n\'y a pas de différence','Le civil règle les litiges privés, le pénal sanctionne les infractions à la société','Le civil est plus sévère','Le pénal s\'applique aux entreprises'], bonne:1 },
    { q:'Qu\'est-ce que la présomption d\'innocence ?', rep:['Toute personne est coupable jusqu\'à preuve du contraire','Toute personne est innocente jusqu\'à preuve de sa culpabilité','Un type de contrat','Une procédure d\'appel'], bonne:1 },
    { q:'Qu\'est-ce qu\'un jugement en appel ?', rep:['Le premier jugement rendu','Un réexamen d\'une décision par une juridiction supérieure','Un jugement sans avocat','La décision finale'], bonne:1 },
    { q:'Que signifie "constitutionnel" ?', rep:['Relatif à la constitution physique','Conforme ou relatif à la Constitution de l\'État','Un type de contrat','Une procédure pénale'], bonne:1 },
    { q:'Qu\'est-ce que la capacité juridique ?', rep:['La taille d\'un tribunal','L\'aptitude à être titulaire de droits et à les exercer','Le nombre de juges','Le délai d\'un procès'], bonne:1 },
    { q:'Quel est l\'âge de la majorité civile à Madagascar ?', rep:['16 ans','18 ans','21 ans','20 ans'], bonne:1 },
    { q:'Qu\'est-ce qu\'une infraction pénale ?', rep:['Un manquement à un contrat','Un acte ou une omission puni par la loi','Une faute professionnelle','Un litige commercial'], bonne:1 },
    { q:'Que signifie "plaider coupable" ?', rep:['Nier les faits','Reconnaître sa culpabilité devant le tribunal','Demander un avocat','Faire appel'], bonne:1 },
    { q:'Qu\'est-ce que la propriété intellectuelle ?', rep:['Posséder des terrains','Droits sur les créations de l\'esprit (inventions, œuvres, marques)','Un type de contrat immobilier','Une procédure administrative'], bonne:1 },
    { q:'Qu\'est-ce que le droit du travail régit ?', rep:['Les contrats commerciaux','Les relations entre employeurs et employés','Les lois fiscales','Les contrats immobiliers'], bonne:1 },
    { q:'Qu\'est-ce qu\'une personne morale ?', rep:['Une personne physique honnête','Une entité juridique (entreprise, association) dotée de droits','Un juge','Un notaire'], bonne:1 },
    { q:'Quel document officialise un mariage ?', rep:['Un contrat de mariage uniquement','L\'acte de mariage délivré par l\'officier d\'état civil','Un jugement du tribunal','Un acte notarié'], bonne:1 },
    { q:'Qu\'est-ce que la prescription en droit ?', rep:['Une ordonnance médicale','L\'extinction d\'un droit par l\'écoulement du temps','Un type de contrat','Une procédure d\'appel'], bonne:1 },
  ],
};

const FILIERES_INFO = {
  INF: { nom:'Informatique', icone:'💻', couleur:'#059669', couleur2:'#047857' },
  GST: { nom:'Gestion',      icone:'📊', couleur:'#6366f1', couleur2:'#4f46e5' },
  DRT: { nom:'Droit',        icone:'⚖️', couleur:'#dc2626', couleur2:'#b91c1c' },
};

const SEUIL_REUSSITE = 60; // % minimum pour être admis

// ══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════
const TestAdmission = () => {
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const filiereParam = searchParams.get('filiere');

  // Étapes : 'choix' | 'infos' | 'test' | 'resultat'
  const [etape,         setEtape]         = useState(filiereParam ? 'infos' : 'choix');
  const [filiere,       setFiliere]        = useState(filiereParam || '');
  const [candidat,      setCandidat]       = useState({ nom:'', prenom:'', email:'', contact:'' });
  const [reponses,      setReponses]       = useState({});
  const [resultat,      setResultat]       = useState(null);
  const [tempsRestant,  setTempsRestant]   = useState(20 * 60); // 20 minutes
  const [timerActif,    setTimerActif]     = useState(false);
  const [questionActuelle, setQuestionActuelle] = useState(0);

  // Timer
  useEffect(() => {
    if (!timerActif) return;
    if (tempsRestant <= 0) { soumettreTest(); return; }
    const t = setInterval(() => setTempsRestant(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timerActif, tempsRestant]); // eslint-disable-line

  const formatTemps = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2,'0')}`;
  };

  const demarrerTest = () => {
    setReponses({});
    setQuestionActuelle(0);
    setTempsRestant(20 * 60);
    setTimerActif(true);
    setEtape('test');
  };

  const soumettreTest = () => {
    setTimerActif(false);
    const questions = QUESTIONS[filiere];
    let bonnes = 0;
    questions.forEach((q, i) => {
      if (reponses[i] === q.bonne) bonnes++;
    });
    const score = Math.round((bonnes / questions.length) * 100);
    setResultat({ score, bonnes, total: questions.length, admis: score >= SEUIL_REUSSITE });
    setEtape('resultat');
  };

  const recommencer = () => {
    setResultat(null);
    setReponses({});
    setEtape('infos');
  };

  const f = FILIERES_INFO[filiere];
  const questions = QUESTIONS[filiere] || [];
  const progression = Object.keys(reponses).length;

  // ── ÉTAPE 1 : Choix de filière ───────────────────────────
  if (etape === 'choix') return (
    <div style={{ minHeight:'100vh', background:'#f5f5f4', display:'flex', flexDirection:'column' }}>
      {/* Nav */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e7e5e4', padding:'16px 40px',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={() => navigate('/')} style={{ display:'flex', alignItems:'center', gap:'10px',
          background:'none', border:'none', cursor:'pointer' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px',
            background:'linear-gradient(135deg,#064e3b,#047857)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'16px', fontWeight:'900', color:'#fff' }}>S</div>
          <span style={{ fontWeight:'700', color:'#1c1917' }}>SmartCampus</span>
        </button>
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none',
          color:'#78716c', cursor:'pointer', fontSize:'14px' }}>← Retour à l'accueil</button>
      </nav>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>📝</div>
          <h1 style={{ fontSize:'36px', fontWeight:'900', color:'#1c1917',
            letterSpacing:'-1px', marginBottom:'12px' }}>
            Test d'admission
          </h1>
          <p style={{ fontSize:'16px', color:'#78716c', lineHeight:1.7 }}>
            Choisissez la filière pour laquelle vous souhaitez vous inscrire.<br/>
            Le test comporte <strong>15 questions</strong> et dure <strong>20 minutes</strong>.<br/>
            Il faut obtenir au moins <strong style={{color:'#059669'}}>60%</strong> pour être admis.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'20px', maxWidth:'800px', width:'100%' }}>
          {Object.entries(FILIERES_INFO).map(([code, info]) => (
            <button key={code} onClick={() => { setFiliere(code); setEtape('infos'); }} style={{
              padding:'32px 24px', borderRadius:'16px', border:'2px solid #e7e5e4',
              background:'#fff', cursor:'pointer', transition:'all 0.2s', textAlign:'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=info.couleur; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 32px ${info.couleur}25`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#e7e5e4'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
            >
              <div style={{ fontSize:'48px', marginBottom:'12px' }}>{info.icone}</div>
              <div style={{ fontSize:'20px', fontWeight:'800', color:'#1c1917', marginBottom:'8px' }}>{info.nom}</div>
              <div style={{ fontSize:'12px', color:'#a8a29e' }}>15 questions · 20 min</div>
              <div style={{ marginTop:'16px', padding:'10px 20px',
                background:`linear-gradient(135deg,${info.couleur},${info.couleur2})`,
                borderRadius:'10px', color:'#fff', fontWeight:'700', fontSize:'14px' }}>
                Choisir cette filière →
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── ÉTAPE 2 : Infos candidat ─────────────────────────────
  if (etape === 'infos') return (
    <div style={{ minHeight:'100vh', background:'#f5f5f4', display:'flex', flexDirection:'column' }}>
      <nav style={{ background:'#fff', borderBottom:'1px solid #e7e5e4', padding:'16px 40px',
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px',
            background:'linear-gradient(135deg,#064e3b,#047857)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'16px', fontWeight:'900', color:'#fff' }}>S</div>
          <span style={{ fontWeight:'700', color:'#1c1917' }}>Test d'admission — {f?.nom}</span>
        </div>
        <button onClick={() => setEtape('choix')} style={{ background:'none', border:'none',
          color:'#78716c', cursor:'pointer', fontSize:'14px' }}>← Changer de filière</button>
      </nav>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
        <div style={{ background:'#fff', borderRadius:'20px', padding:'40px',
          maxWidth:'520px', width:'100%', border:'1px solid #e7e5e4',
          boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>

          {/* Header filière */}
          <div style={{
            background:`linear-gradient(135deg, ${f?.couleur}, ${f?.couleur2})`,
            borderRadius:'14px', padding:'20px 24px', marginBottom:'28px',
            display:'flex', alignItems:'center', gap:'14px'
          }}>
            <div style={{ fontSize:'36px' }}>{f?.icone}</div>
            <div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', fontWeight:'600' }}>Filière choisie</div>
              <div style={{ color:'#fff', fontSize:'20px', fontWeight:'900' }}>{f?.nom}</div>
            </div>
          </div>

          <h2 style={{ fontSize:'20px', fontWeight:'800', color:'#1c1917', marginBottom:'6px' }}>
            Vos informations
          </h2>
          <p style={{ color:'#78716c', fontSize:'14px', marginBottom:'24px' }}>
            Ces informations seront utilisées pour votre dossier d'inscription.
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
            {[
              { key:'nom',     label:'Nom *',    placeholder:'Votre nom' },
              { key:'prenom',  label:'Prénom *',  placeholder:'Votre prénom' },
              { key:'email',   label:'Email *',   placeholder:'votre@email.com', full:true },
              { key:'contact', label:'Téléphone', placeholder:'034 XX XXX XX' },
            ].map(f_ => (
              <div key={f_.key} style={{ marginBottom:'16px', gridColumn: f_.full?'1/-1':undefined }}>
                <label style={{ display:'block', fontSize:'13px', fontWeight:'600',
                  color:'#44403c', marginBottom:'7px' }}>{f_.label}</label>
                <input
                  type={f_.key==='email'?'email':'text'}
                  value={candidat[f_.key]}
                  onChange={e => setCandidat(c => ({...c, [f_.key]:e.target.value}))}
                  placeholder={f_.placeholder}
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e7e5e4',
                    borderRadius:'10px', fontSize:'14px', color:'#1c1917',
                    background:'#fafaf9', outline:'none', transition:'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor=f?.couleur||'#10b981'; e.target.style.boxShadow=`0 0 0 3px ${f?.couleur||'#10b981'}18`; e.target.style.background='#fff'; }}
                  onBlur={e => { e.target.style.borderColor='#e7e5e4'; e.target.style.boxShadow='none'; e.target.style.background='#fafaf9'; }}
                />
              </div>
            ))}
          </div>

          <div style={{ background:'#f5f5f4', borderRadius:'10px', padding:'14px',
            fontSize:'13px', color:'#78716c', marginBottom:'20px', lineHeight:1.6 }}>
            📌 Le test comporte <strong>15 questions</strong> à choix multiples.<br/>
            Durée : <strong>20 minutes</strong> · Note minimale : <strong style={{color:f?.couleur}}>60%</strong>
          </div>

          <button
            disabled={!candidat.nom || !candidat.prenom || !candidat.email}
            onClick={demarrerTest}
            style={{
              width:'100%', padding:'14px',
              background: (!candidat.nom||!candidat.prenom||!candidat.email)
                ? '#e7e5e4'
                : `linear-gradient(135deg,${f?.couleur},${f?.couleur2})`,
              color: (!candidat.nom||!candidat.prenom||!candidat.email) ? '#a8a29e' : '#fff',
              border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'700',
              cursor: (!candidat.nom||!candidat.prenom||!candidat.email) ? 'not-allowed' : 'pointer',
              boxShadow: (!candidat.nom||!candidat.prenom||!candidat.email) ? 'none' : `0 6px 20px ${f?.couleur}35`,
              transition:'all 0.2s',
            }}
          >
            🚀 Commencer le test
          </button>
        </div>
      </div>
    </div>
  );

  // ── ÉTAPE 3 : Test QCM ───────────────────────────────────
  if (etape === 'test') {
    const q = questions[questionActuelle];
    const timerCouleur = tempsRestant < 300 ? '#ef4444' : tempsRestant < 600 ? '#f59e0b' : '#059669';

    return (
      <div style={{ minHeight:'100vh', background:'#f5f5f4' }}>
        {/* Header test */}
        <div style={{
          background:'#fff', borderBottom:'1px solid #e7e5e4', padding:'14px 32px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'8px',
              background:`linear-gradient(135deg,${f?.couleur},${f?.couleur2})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'14px', color:'#fff', fontWeight:'900' }}>{f?.icone}</div>
            <span style={{ fontWeight:'700', color:'#1c1917', fontSize:'15px' }}>
              Test {f?.nom} — {candidat.prenom} {candidat.nom}
            </span>
          </div>

          {/* Timer */}
          <div style={{
            display:'flex', alignItems:'center', gap:'8px', padding:'8px 18px',
            background: tempsRestant < 300 ? '#fef2f2' : '#f0fdf4',
            border:`1px solid ${timerCouleur}40`,
            borderRadius:'10px',
          }}>
            <span style={{ fontSize:'16px' }}>{tempsRestant < 300 ? '⚠️' : '⏱️'}</span>
            <span style={{ fontWeight:'800', fontSize:'18px', color:timerCouleur, letterSpacing:'-0.5px' }}>
              {formatTemps(tempsRestant)}
            </span>
          </div>

          {/* Progression */}
          <div style={{ fontSize:'13px', color:'#78716c', fontWeight:'600' }}>
            {progression} / {questions.length} répondues
          </div>
        </div>

        {/* Barre de progression globale */}
        <div style={{ height:'4px', background:'#e7e5e4' }}>
          <div style={{
            height:'100%', background:`linear-gradient(90deg,${f?.couleur},${f?.couleur2})`,
            width:`${(questionActuelle / questions.length) * 100}%`,
            transition:'width 0.3s',
          }}/>
        </div>

        <div style={{ maxWidth:'800px', margin:'0 auto', padding:'40px 24px' }}>
          {/* Navigation questions */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'32px', justifyContent:'center' }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => setQuestionActuelle(i)} style={{
                width:'36px', height:'36px', borderRadius:'8px', border:'none',
                background: reponses[i] !== undefined
                  ? `linear-gradient(135deg,${f?.couleur},${f?.couleur2})`
                  : i === questionActuelle ? '#1c1917' : '#e7e5e4',
                color: reponses[i] !== undefined || i === questionActuelle ? '#fff' : '#78716c',
                fontWeight:'700', fontSize:'13px', cursor:'pointer', transition:'all 0.15s',
              }}>{i+1}</button>
            ))}
          </div>

          {/* Question */}
          <div style={{
            background:'#fff', borderRadius:'20px', padding:'36px',
            border:'1px solid #e7e5e4', boxShadow:'0 4px 16px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize:'12px', fontWeight:'700', color:'#a8a29e',
              textTransform:'uppercase', letterSpacing:'1px', marginBottom:'16px' }}>
              Question {questionActuelle + 1} sur {questions.length}
            </div>

            <h2 style={{ fontSize:'20px', fontWeight:'800', color:'#1c1917',
              lineHeight:1.4, marginBottom:'28px', letterSpacing:'-0.3px' }}>
              {q.q}
            </h2>

            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {q.rep.map((rep, i) => {
                const selectionne = reponses[questionActuelle] === i;
                return (
                  <button key={i} onClick={() => setReponses(r => ({...r, [questionActuelle]:i}))} style={{
                    padding:'16px 20px', borderRadius:'12px', textAlign:'left',
                    border:`2px solid ${selectionne ? f?.couleur : '#e7e5e4'}`,
                    background: selectionne ? `${f?.couleur}12` : '#fafaf9',
                    color:'#1c1917', fontSize:'15px', fontWeight: selectionne ? '700' : '500',
                    cursor:'pointer', transition:'all 0.15s',
                    display:'flex', alignItems:'center', gap:'14px',
                  }}
                    onMouseEnter={e => { if(!selectionne){ e.currentTarget.style.borderColor=f?.couleur||'#10b981'; e.currentTarget.style.background=`${f?.couleur}08`; }}}
                    onMouseLeave={e => { if(!selectionne){ e.currentTarget.style.borderColor='#e7e5e4'; e.currentTarget.style.background='#fafaf9'; }}}
                  >
                    <div style={{
                      width:'28px', height:'28px', borderRadius:'50%', flexShrink:0,
                      border:`2px solid ${selectionne ? f?.couleur : '#d6d3d1'}`,
                      background: selectionne ? f?.couleur : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'12px', color:'#fff', fontWeight:'700', transition:'all 0.15s',
                    }}>
                      {selectionne ? '✓' : String.fromCharCode(65+i)}
                    </div>
                    {rep}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'28px', alignItems:'center' }}>
              <button onClick={() => setQuestionActuelle(p => Math.max(0,p-1))}
                disabled={questionActuelle===0} style={{
                  padding:'10px 20px', background:questionActuelle===0?'#f5f5f4':'#f5f5f4',
                  border:'1px solid #e7e5e4', borderRadius:'10px',
                  color:questionActuelle===0?'#a8a29e':'#44403c',
                  fontWeight:'600', fontSize:'14px', cursor:questionActuelle===0?'not-allowed':'pointer',
                }}>← Précédente</button>

              {questionActuelle < questions.length - 1 ? (
                <button onClick={() => setQuestionActuelle(p => p+1)} style={{
                  padding:'10px 24px',
                  background:`linear-gradient(135deg,${f?.couleur},${f?.couleur2})`,
                  border:'none', borderRadius:'10px', color:'#fff',
                  fontWeight:'700', fontSize:'14px', cursor:'pointer',
                  boxShadow:`0 4px 12px ${f?.couleur}35`,
                }}>Suivante →</button>
              ) : (
                <button onClick={() => {
                  if (window.confirm(`Vous avez répondu à ${progression}/${questions.length} questions. Soumettre le test ?`))
                    soumettreTest();
                }} style={{
                  padding:'10px 24px',
                  background:'linear-gradient(135deg,#059669,#047857)',
                  border:'none', borderRadius:'10px', color:'#fff',
                  fontWeight:'800', fontSize:'14px', cursor:'pointer',
                  boxShadow:'0 4px 12px rgba(5,150,105,0.4)',
                }}>✅ Terminer le test</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ÉTAPE 4 : Résultat ───────────────────────────────────
  if (etape === 'resultat' && resultat) {
    return (
      <div style={{ minHeight:'100vh',
        background: resultat.admis
          ? 'linear-gradient(160deg,#022c22,#064e3b)'
          : 'linear-gradient(160deg,#1c0a0a,#7f1d1d)',
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'40px 24px',
      }}>
        <div style={{ maxWidth:'600px', width:'100%', textAlign:'center' }}>

          {/* Icône résultat */}
          <div style={{ fontSize:'80px', marginBottom:'24px',
            filter:`drop-shadow(0 0 24px ${resultat.admis?'#10b981':'#ef4444'})` }}>
            {resultat.admis ? '🎉' : '😔'}
          </div>

          {/* Score */}
          <div style={{
            fontSize:'72px', fontWeight:'900', color:'#fff',
            letterSpacing:'-3px', lineHeight:1, marginBottom:'8px'
          }}>
            {resultat.score}<span style={{ fontSize:'32px', opacity:0.7 }}>%</span>
          </div>
          <div style={{ fontSize:'16px', color:'rgba(255,255,255,0.6)', marginBottom:'32px' }}>
            {resultat.bonnes} bonne{resultat.bonnes>1?'s':''} réponse{resultat.bonnes>1?'s':''} sur {resultat.total}
          </div>

          {/* Résultat */}
          <div style={{
            background: resultat.admis ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border:`1px solid ${resultat.admis?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'}`,
            borderRadius:'16px', padding:'24px 32px', marginBottom:'32px',
          }}>
            <div style={{ fontSize:'24px', fontWeight:'900', color:'#fff', marginBottom:'8px' }}>
              {resultat.admis ? '✅ Félicitations ! Vous êtes admis.' : '❌ Résultat insuffisant'}
            </div>
            <div style={{ fontSize:'15px', color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>
              {resultat.admis
                ? `Vous avez réussi le test d'admission en ${f?.nom}. Vous pouvez maintenant procéder à votre inscription à Inside University.`
                : `La note minimale requise est de ${SEUIL_REUSSITE}%. Vous pouvez reprendre le test après révision.`}
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display:'flex', gap:'14px', justifyContent:'center', flexWrap:'wrap' }}>
            {resultat.admis ? (
              <>
                <button onClick={() => navigate('/login')} style={{
                  padding:'14px 32px',
                  background:'linear-gradient(135deg,#10b981,#059669)',
                  color:'#fff', border:'none', borderRadius:'12px',
                  fontSize:'15px', fontWeight:'800', cursor:'pointer',
                  boxShadow:'0 6px 24px rgba(16,185,129,0.45)',
                }}>
                  🎓 Procéder à l'inscription →
                </button>
                <button onClick={() => navigate('/')} style={{
                  padding:'14px 24px',
                  background:'rgba(255,255,255,0.1)', color:'#fff',
                  border:'1px solid rgba(255,255,255,0.2)', borderRadius:'12px',
                  fontSize:'15px', fontWeight:'600', cursor:'pointer',
                }}>Retour à l'accueil</button>
              </>
            ) : (
              <>
                <button onClick={recommencer} style={{
                  padding:'14px 32px',
                  background:'linear-gradient(135deg,#f59e0b,#d97706)',
                  color:'#fff', border:'none', borderRadius:'12px',
                  fontSize:'15px', fontWeight:'800', cursor:'pointer',
                  boxShadow:'0 6px 24px rgba(245,158,11,0.45)',
                }}>
                  🔄 Recommencer le test
                </button>
                <button onClick={() => { setFiliere(''); setEtape('choix'); }} style={{
                  padding:'14px 24px',
                  background:'rgba(255,255,255,0.1)', color:'#fff',
                  border:'1px solid rgba(255,255,255,0.2)', borderRadius:'12px',
                  fontSize:'15px', fontWeight:'600', cursor:'pointer',
                }}>Changer de filière</button>
                <button onClick={() => navigate('/')} style={{
                  padding:'14px 24px',
                  background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)',
                  border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px',
                  fontSize:'14px', cursor:'pointer',
                }}>Retour à l'accueil</button>
              </>
            )}
          </div>

          {/* Détail par question */}
          <div style={{ marginTop:'40px', textAlign:'left' }}>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'rgba(255,255,255,0.4)',
              textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px', textAlign:'center' }}>
              Récapitulatif
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px' }}>
              {questions.map((q_, i) => {
                const correct = reponses[i] === q_.bonne;
                const repondu = reponses[i] !== undefined;
                return (
                  <div key={i} style={{
                    padding:'8px', borderRadius:'8px', textAlign:'center',
                    background: !repondu ? 'rgba(255,255,255,0.06)' : correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                    border:`1px solid ${!repondu?'rgba(255,255,255,0.1)':correct?'rgba(16,185,129,0.4)':'rgba(239,68,68,0.4)'}`,
                  }}>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', marginBottom:'2px' }}>Q{i+1}</div>
                    <div style={{ fontSize:'16px' }}>{!repondu?'—':correct?'✅':'❌'}</div>
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