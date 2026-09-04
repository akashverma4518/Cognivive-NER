import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { Login } from './pages/auth/Login';
import { ElderHome } from './pages/elder/ElderHome';
import { ActiveGamePage } from './pages/elder/ActiveGamePage';
import { CaregiverHome } from './pages/caregiver/CaregiverHome';
import { ClinicianHome } from './pages/clinician/ClinicianHome';
import { Unauthorized } from './pages/Unauthorized';

const RootRedirect: React.FC = () => {
  const { role, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-elder-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6C3EDC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'CAREGIVER') {
    return <Navigate to="/caregiver" replace />;
  } else if (role === 'CLINICIAN' || role === 'ADMIN') {
    return <Navigate to="/clinician" replace />;
  } else {
    return <Navigate to="/elder" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SyncProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Elder Portal */}
          <Route
            path="/elder/play/:gameId"
            element={
              <ProtectedRoute allowedRoles={['ELDER']}>
                <ActiveGamePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elder/*"
            element={
              <ProtectedRoute allowedRoles={['ELDER']}>
                <ElderHome />
              </ProtectedRoute>
            }
          />

          {/* Caregiver Portal */}
          <Route
            path="/caregiver/*"
            element={
              <ProtectedRoute allowedRoles={['CAREGIVER', 'CLINICIAN', 'ADMIN']}>
                <CaregiverHome />
              </ProtectedRoute>
            }
          />

          {/* Clinician Portal */}
          <Route
            path="/clinician/*"
            element={
              <ProtectedRoute allowedRoles={['CLINICIAN', 'ADMIN']}>
                <ClinicianHome />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SyncProvider>
    </AuthProvider>
  );
};

export default App;
