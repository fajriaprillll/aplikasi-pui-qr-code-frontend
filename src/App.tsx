import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import OrderPage from './pages/customer/OrderPage';
import LoginPage from './pages/admin/LoginPage';
import TestPage from './pages/admin/TestPage';
import SimpleMenuPage from './pages/admin/SimpleMenuPage';
import OrderHistoryPage from './pages/OrderHistory';
import MenuPage from './pages/admin/MenuPage';
import OrdersPage from './pages/admin/OrderPage';
import TablesPage from './pages/admin/TablePage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import RegisterPage from './pages/admin/RegisterPage';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import { ThemeProvider } from './contexts/ThemeContext';
import { AlertProvider } from './contexts/AlertContext';

function App() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/order" element={<OrderPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin/register" element={<RegisterPage />} />
              <Route path="/admin/test" element={<TestPage />} />
              <Route path="/admin/simple-menu" element={<SimpleMenuPage />} />
              <Route path="/order-history" element={<OrderHistoryPage />} />
              <Route path="/admin/menu" element={<MenuPage />} />
              <Route path="/admin/orders" element={<OrdersPage />} />
              <Route path="/admin/tables" element={<TablesPage />} />
              <Route path="/admin/staff" element={<StaffManagementPage />} />
              <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </AlertProvider>
    </ThemeProvider>
  );
}

export default App;
