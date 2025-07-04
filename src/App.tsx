import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import OrderPage from './pages/customer/OrderPage';
import LoginPage from './pages/admin/LoginPage';
import TestPage from './pages/admin/TestPage';
import OrderHistoryPage from './pages/OrderHistory';
import OrdersPage from './pages/admin/OrderPage';
import TablesPage from './pages/admin/TablePage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import RegisterPage from './pages/admin/RegisterPage';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import MenuPage from './pages/admin/MenuPage';
import { AlertProvider } from './contexts/AlertContext';
import ErrorPage from './pages/ErrorPage';

function App() {
  return (
      <AlertProvider>
        <Router>
          <ErrorBoundary>
            <Routes>
              {/* Main routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/order" element={<OrderPage />} />
              <Route path="/order-history" element={<OrderHistoryPage />} />
              
              {/* Admin routes */}
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin/register" element={<RegisterPage />} />
              <Route path="/admin/test" element={<TestPage />} />
              <Route path="/admin/menu" element={<MenuPage />} />
              <Route path="/admin/orders" element={<OrdersPage />} />
              <Route path="/admin/tables" element={<TablesPage />} />
              <Route path="/admin/staff" element={<StaffManagementPage />} />
              <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
              
              {/* Redirects */}
              <Route path="/login" element={<Navigate to="/admin/login" replace />} />
              
              {/* Error and catch-all routes */}
              <Route path="/error" element={<ErrorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </AlertProvider>
  );
}

export default App;
