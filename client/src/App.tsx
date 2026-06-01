import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

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
import AnalyticsPage from './pages/AnalyticsPage';
import InventoryList from './pages/InventoryList';
import PredictiveDashboard from './pages/PredictiveDashboard';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import ProcurementDashboard from './pages/ProcurementDashboard';
import FloorPlan from './pages/FloorPlan';
import FinancialDashboard from './pages/FinancialDashboard';
import DowntimeGantt from './pages/DowntimeGantt';

import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/requests" element={<KanbanBoard />} />
        <Route path="/financials" element={<FinancialDashboard />} />
        <Route path="/requests-all" element={<RequestsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/downtime" element={<DowntimeGantt />} />
        <Route path="/floor-plan" element={<FloorPlan />} />
        <Route path="/equipment" element={<EquipmentList />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/predictive" element={<PredictiveDashboard />} />
        <Route path="/procurement" element={<ProcurementDashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppContent />
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
