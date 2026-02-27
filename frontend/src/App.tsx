import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { WorkspaceDetailPage } from './pages/WorkspaceDetailPage';
import { RoomPage } from './pages/RoomPage';
import { WorkspaceDimensionsPage } from './pages/WorkspaceDimensionsPage';
import { ProposalPage } from './pages/ProposalPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (user) return <Navigate to="/workspaces" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/workspaces" element={<ProtectedRoute><WorkspacesPage /></ProtectedRoute>} />
      <Route path="/workspaces/:id" element={<ProtectedRoute><WorkspaceDetailPage /></ProtectedRoute>} />
      <Route path="/workspaces/:id/dimensions" element={<ProtectedRoute><WorkspaceDimensionsPage /></ProtectedRoute>} />
      <Route path="/workspaces/:id/rooms/:roomId" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />
      <Route path="/workspaces/:id/rooms/:roomId/proposals/:proposalId" element={<ProtectedRoute><ProposalPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/workspaces" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
