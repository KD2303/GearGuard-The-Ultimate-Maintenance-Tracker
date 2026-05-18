import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import CalendarView from './pages/CalendarView';
import EquipmentList from './pages/EquipmentList';
import TeamsPage from './pages/TeamsPage';
import RequestsPage from './pages/RequestsPage';
import ActivityPage from './pages/ActivityPage';
import VehicleList from './pages/VehicleList';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';

import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/admin" element={
                <ProtectedRoute roles={['Admin', 'Manager']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/requests" element={<KanbanBoard />} />
              <Route path="/requests-all" element={<RequestsPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/equipment" element={<EquipmentList />} />
              <Route path="/vehicles" element={<VehicleList />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: { fontSize: '14px' },
          }}
        />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
