import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingBag, FaHistory, FaChevronDown } from 'react-icons/fa';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Track scroll position for header effects
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <motion.nav 
      className={`fixed top-0 w-full z-30 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-lg dark:bg-gray-800/90' 
          : 'bg-white dark:bg-gray-800'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, -5, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img 
                    src="/images/logo/download.jpg" 
                    alt="Kedai Matmoen Logo" 
                    className="h-10 w-auto rounded-full shadow-md border-2 border-primary-100" 
                  />
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 text-transparent bg-clip-text">
                    Kedai Matmoen
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                    Delicious food, delivered fast
                  </span>
                </div>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-6">
                <Link 
                  to="/" 
                  className={`text-gray-700 dark:text-gray-200 px-3 py-2 text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-2 ${
                    location.pathname === '/' ? 'text-primary-600 dark:text-primary-400' : ''
                  }`}
                >
                  <FaShoppingBag size={16} />
                  <span>Order Now</span>
                </Link>
                
                <Link 
                  to="/order-history" 
                  className={`text-gray-700 dark:text-gray-200 px-3 py-2 text-sm font-medium hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-2 ${
                    location.pathname === '/order-history' ? 'text-primary-600 dark:text-primary-400' : ''
                  }`}
                >
                  <FaHistory size={16} />
                  <span>Order History</span>
                </Link>
              </div>
            </div>
          </motion.div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
              aria-expanded="false"
              whileTap={{ scale: 0.95 }}
            >
              <span className="sr-only">Open main menu</span>
              <div className="relative w-6 h-5">
                <span 
                  className={`absolute h-0.5 w-full bg-current transform transition duration-300 ease-in-out ${
                    mobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                  }`}
                  style={{ top: '0%' }}
                ></span>
                <span 
                  className={`absolute h-0.5 w-full bg-current transform transition duration-300 ease-in-out ${
                    mobileMenuOpen ? 'opacity-0' : ''
                  }`} 
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                ></span>
                <span 
                  className={`absolute h-0.5 w-full bg-current transform transition duration-300 ease-in-out ${
                    mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                  style={{ bottom: '0%' }}
                ></span>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="md:hidden bg-white dark:bg-gray-800 shadow-lg border-t border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link 
                to="/" 
                className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  location.pathname === '/' ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-200'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <FaShoppingBag size={18} />
                  <span>Order Now</span>
                </div>
              </Link>
              
              <Link 
                to="/order-history" 
                className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  location.pathname === '/order-history' ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-200'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <FaHistory size={18} />
                  <span>Order History</span>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Decorative element */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary-300 via-primary-500 to-primary-700"></div>
    </motion.nav>
  );
};

export default Navbar; 