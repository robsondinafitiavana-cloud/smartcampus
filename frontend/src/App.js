/**
 * App.js — Routes principales de SmartCampus
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages publiques
import Accueil       from './pages/public/Accueil';
import TestAdmission from './pages/public/TestAdmission';
import Login         from './pages/auth/Login';

// Pages protégées
import Dashboard   from './pages/dashboard/Dashboard';
import Etudiants   from './pages/etudiants/Etudiants';
import Enseignants from './pages/enseignants/Enseignants';
import Cours       from './pages/cours/Cours';
import Notes       from './pages/notes/Notes';
import Presences   from './pages/presences/Presences';
import Paiements   from './pages/paiements/Paiements';
import Planning    from './pages/planning/Planning';
import Communiques from './pages/communiques/Communiques';

/** Route protégée */
const ProtectedRoute = ({ children }) => {
  const { estConnecte, chargement } = useAuth();
  if (chargement) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', background:'#f5f5f4', color:'#78716c', fontSize:'15px' }}>
      ⏳ Chargement...
    </div>
  );
  return estConnecte ? children : <Navigate to="/login" replace />;
};

/** Route publique — redirige si déjà connecté */
const PublicRoute = ({ children }) => {
  const { estConnecte, chargement } = useAuth();
  if (chargement) return null;
  return estConnecte ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    {/* Page d'accueil publique */}
    <Route path="/"               element={<Accueil />} />
    <Route path="/test-admission" element={<TestAdmission />} />

    {/* Connexion */}
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

    {/* Pages protégées */}
    <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/etudiants"   element={<ProtectedRoute><Etudiants /></ProtectedRoute>} />
    <Route path="/enseignants" element={<ProtectedRoute><Enseignants /></ProtectedRoute>} />
    <Route path="/cours"       element={<ProtectedRoute><Cours /></ProtectedRoute>} />
    <Route path="/notes"       element={<ProtectedRoute><Notes /></ProtectedRoute>} />
    <Route path="/presences"   element={<ProtectedRoute><Presences /></ProtectedRoute>} />
    <Route path="/paiements"   element={<ProtectedRoute><Paiements /></ProtectedRoute>} />
    <Route path="/planning"    element={<ProtectedRoute><Planning /></ProtectedRoute>} />
    <Route path="/communiques" element={<ProtectedRoute><Communiques /></ProtectedRoute>} />

    {/* 404 */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;