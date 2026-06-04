import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Accueil       from './pages/public/Accueil';
import TestAdmission from './pages/public/TestAdmission';
import Login         from './pages/auth/Login';
import Dashboard     from './pages/dashboard/Dashboard';
import Demandes      from './pages/dashboard/Demandes';
import Etudiants     from './pages/etudiants/Etudiants';
import Enseignants   from './pages/enseignants/Enseignants';
import Cours         from './pages/cours/Cours';
import Notes         from './pages/notes/Notes';
import Presences     from './pages/presences/Presences';
import Paiements     from './pages/paiements/Paiements';
import Planning      from './pages/planning/Planning';
import Communiques   from './pages/communiques/Communiques';
import Devoirs       from './pages/devoirs/Devoirs';

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

const PublicRoute = ({ children }) => {
  const { estConnecte, chargement } = useAuth();
  if (chargement) return null;
  return estConnecte ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/"               element={<Accueil />} />
    <Route path="/test-admission" element={<TestAdmission />} />
    <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/demandes"       element={<ProtectedRoute><Demandes /></ProtectedRoute>} />
    <Route path="/etudiants"      element={<ProtectedRoute><Etudiants /></ProtectedRoute>} />
    <Route path="/enseignants"    element={<ProtectedRoute><Enseignants /></ProtectedRoute>} />
    <Route path="/cours"          element={<ProtectedRoute><Cours /></ProtectedRoute>} />
    <Route path="/notes"          element={<ProtectedRoute><Notes /></ProtectedRoute>} />
    <Route path="/presences"      element={<ProtectedRoute><Presences /></ProtectedRoute>} />
    <Route path="/paiements"      element={<ProtectedRoute><Paiements /></ProtectedRoute>} />
    <Route path="/planning"       element={<ProtectedRoute><Planning /></ProtectedRoute>} />
    <Route path="/communiques"    element={<ProtectedRoute><Communiques /></ProtectedRoute>} />
    <Route path="/devoirs"        element={<ProtectedRoute><Devoirs /></ProtectedRoute>} />
    <Route path="*"               element={<Navigate to="/" replace />} />
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