import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';
import { FaChevronUp } from 'react-icons/fa';

interface LayoutProps {
  children: React.ReactNode;
  noHeaderFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, noHeaderFooter }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  const isAdminPage = location.pathname.startsWith('/admin');

  // Track scroll position for header effects and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      const shouldShowScrollToTop = window.scrollY > 300;
      
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
      
      if (shouldShowScrollToTop !== showScrollToTop) {
        setShowScrollToTop(shouldShowScrollToTop);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled, showScrollToTop]);

  const handleLogout = () => {
    logout();
  };
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
          <header className="bg-gradient-to-r from-white to-red-100 dark:from-gray-900 dark:to-gray-800 text-red-600 dark:text-red-400 shadow-md shadow-red-100 dark:shadow-gray-800 w-full">
            <div className="w-full px-4 py-4">
              <div className="flex justify-between items-center w-full px-4 sm:px-8">
                <Link to="/" className="flex items-center gap-2">
                  <img src="/images/logo/download.jpg" alt="Kedai Matmoen Logo" className="h-8 w-auto" />
                  <span className="text-xl font-bold text-red-700 dark:text-red-400">Kedai Matmoen</span>
                </Link>
                <div className="flex items-center gap-3">
                  <Link to="/admin/login" className="text-red-500 hover:underline dark:text-red-400">Login</Link>
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

  // Calculate the height of the header and mobile nav for padding
  const headerHeight = 64; // 16 * 4 = 64px (h-16)
  const mobileNavHeight = isAuthenticated && isAdmin ? 36 : 0; // Approximate height of mobile nav
  const totalTopPadding = headerHeight + mobileNavHeight;
  
  // Calculate footer height for bottom padding
  const footerHeight = 60; // Approximate footer height

  return (
    <motion.div 
      className="min-h-screen flex flex-col w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!noHeaderFooter && (
        <motion.header 
          className={`${scrolled 
            ? 'bg-white dark:bg-gray-800 shadow-md h-16' 
            : 'bg-white dark:bg-gray-800 h-16'
          } border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-all duration-300`}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
              <Link to="/" className="flex items-center gap-3">
                <img 
                  src="/images/logo/download.jpg" 
                  alt="Kedai Matmoen Logo" 
                  className="h-8 w-auto rounded-sm"
                />
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">
                    Kedai Matmoen
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    Delicious food, delivered fast
                  </span>
                </div>
              </Link>
              
              <nav className="flex items-center gap-4">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <div className="hidden sm:flex items-center gap-2">
                        {adminNavItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                              location.pathname === item.path
                                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-800/50'
                                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors duration-200 font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  isAdminPage && (
                    <Link
                      to="/admin/login"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg shadow-sm transition-colors duration-200 font-medium"
                    >
                      Login
                    </Link>
                  )
                )}
              </nav>
            </div>
          </div>
        </motion.header>
      )}
      
      {/* Mobile navigation for admin */}
      {!noHeaderFooter && isAuthenticated && isAdmin && (
        <div className="bg-red-600 dark:bg-red-700 sm:hidden w-full shadow-sm sticky top-16 z-30">
          <div className="w-full px-2 py-1">
            <div className="flex justify-between items-center gap-1 overflow-x-auto pb-1">
              {adminNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex justify-center items-center py-2 px-3 rounded-md text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-white/20 text-white shadow-inner'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <PageTransition variant="fade">
        <main className="flex-1 w-full">
          <div className="w-full">
            {children}
          </div>
        </main>
      </PageTransition>
      
      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.button
            className="fixed bottom-6 left-6 z-20 bg-red-600 text-white p-3 rounded-full shadow-lg"
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaChevronUp />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Footer with subtle animation */}
      {!noHeaderFooter && (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <img src="/images/logo/download.jpg" alt="Kedai Matmoen Logo" className="h-8 w-auto rounded-sm" />
                <div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">Kedai Matmoen</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    The best food in town, delivered to your table
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <span>&copy; {new Date().getFullYear()} Kedai Matmoen. All rights reserved.</span>
                  <div className="flex gap-4">
                    <Link to="/privacy" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      Privacy Policy
                    </Link>
                    <Link to="/terms" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      Terms of Service
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </motion.div>
  );
};

export default Layout;
