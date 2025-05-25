import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import ThemeToggle from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';

interface LayoutProps {
  children: React.ReactNode;
  noHeaderFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, noHeaderFooter }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuthStore();
  
  const isAdminPage = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  // Navigation items for admin
  const adminNavItems = [
    { path: '/admin/menu', label: 'Menu' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/tables', label: 'Tables' },
    { path: '/admin/staff', label: 'Staff' },
    { path: '/admin/analytics', label: 'Analytics' },
  ];

  // Simple content rendering in case of issues with the full component
  if (location.pathname.includes('/admin/test')) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-white dark:bg-gray-900">
        {!noHeaderFooter && (
          <header className="bg-gradient-to-r from-white to-kedai-red/10 dark:from-gray-900 dark:to-kedai-red/20 text-kedai-red dark:text-kedai-red shadow-md shadow-kedai-red/10 dark:shadow-kedai-red/20 w-full">
            <div className="w-full px-4 py-4">
              <div className="flex justify-between items-center w-full px-4 sm:px-8">
                <Link to="/" className="flex items-center gap-2 text-xl font-bold">
                  <img src="/images/logo/download.jpg" alt="Kedai Matmoen Logo" className="h-10 w-auto rounded-full" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-kedai-red to-kedai-black dark:from-kedai-red dark:to-gray-400">Kedai Matmoen</span>
                </Link>
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <Link to="/admin/login" className="text-kedai-red hover:underline dark:text-kedai-red">Login</Link>
                </div>
              </div>
            </div>
          </header>
        )}
        <main className="flex-1 w-full px-0 py-0">
          <div className="w-full">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!noHeaderFooter && (
        <motion.header 
          className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-950/50 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <motion.div 
                className="flex-shrink-0 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/" 
                  className="flex items-center gap-2"
                >
                  <img src="/images/logo/download.jpg" alt="Kedai Matmoen Logo" className="h-10 w-auto rounded-full" />
                  <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-kedai-red to-kedai-black dark:from-kedai-red dark:to-gray-300">Kedai Matmoen</span>
                </Link>
              </motion.div>
              
              <nav className="flex items-center gap-4">
                {isAdmin && isAuthenticated && (
                  <div className="flex items-center gap-2">
                    {adminNavItems.map((item) => (
                      <motion.div
                        key={item.path}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link
                          to={item.path}
                          className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                            location.pathname === item.path
                              ? 'bg-kedai-red/10 dark:bg-kedai-red/30 text-kedai-red dark:text-kedai-red shadow-sm dark:shadow-kedai-red/20 border border-kedai-red/20 dark:border-kedai-red/50'
                              : 'text-gray-700 dark:text-gray-300 hover:text-kedai-red dark:hover:text-kedai-red hover:bg-kedai-red/10 dark:hover:bg-kedai-red/20'
                          }`}
                        >
                          {item.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                <ThemeToggle />
                
                {isAuthenticated ? (
                  <motion.button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gradient-to-r from-kedai-red to-kedai-red/80 dark:from-kedai-red dark:to-kedai-red/80 text-white rounded-lg shadow-md hover:shadow-lg shadow-kedai-red/20 dark:shadow-kedai-red/30 hover:shadow-kedai-red/30 dark:hover:shadow-kedai-red/50 transition-all duration-200 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Logout
                  </motion.button>
                ) : (
                  isAdminPage && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        to="/admin/login"
                        className="px-4 py-2 bg-gradient-to-r from-kedai-red to-kedai-red/80 dark:from-kedai-red dark:to-kedai-red/80 text-white rounded-lg shadow-md hover:shadow-lg shadow-kedai-red/20 dark:shadow-kedai-red/30 hover:shadow-kedai-red/30 dark:hover:shadow-kedai-red/50 transition-all duration-200 font-medium"
                      >
                        Login
                      </Link>
                    </motion.div>
                  )
                )}
              </nav>
            </div>
          </div>
        </motion.header>
      )}
      
      <PageTransition>
        <main className="flex-1 w-full">
          {children}
        </main>
      </PageTransition>

      {!noHeaderFooter && (
        <footer className="bg-kedai-black/90 text-white py-6 mt-auto">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <img src="/images/logo/download.jpg" alt="Kedai Matmoen Logo" className="h-10 w-auto rounded-full" />
                <span className="font-bold text-lg">Kedai Matmoen</span>
              </div>
              <div className="text-sm text-gray-300">
                © {new Date().getFullYear()} Kedai Matmoen. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      )}
    </motion.div>
  );
};

export default Layout;
