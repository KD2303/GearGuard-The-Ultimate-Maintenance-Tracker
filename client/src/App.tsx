import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
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
      </Router>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: "14px",
          },
        }}
      />
    </NotificationProvider>
  );
}

export default App;
