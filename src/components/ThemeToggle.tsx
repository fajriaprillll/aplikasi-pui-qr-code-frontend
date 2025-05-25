import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { FaSun, FaMoon, FaRegSun, FaRegMoon, FaStarAndCrescent } from 'react-icons/fa';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  
  const isDark = theme === 'dark';
  
  return (
    <motion.button
      onClick={toggleTheme}
      className={`p-2.5 rounded-full transition-all duration-300 relative overflow-hidden ${
        isDark 
          ? 'bg-kedai-black text-kedai-red hover:bg-kedai-black/80 shadow-inner shadow-kedai-black/50' 
          : 'bg-kedai-red/10 text-kedai-red hover:bg-kedai-red/20 shadow-md shadow-kedai-red/20'
      } ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95, rotate: isDark ? -15 : 15 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ rotate: isDark ? -45 : 45, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: isDark ? 45 : -45, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15 
          }}
          className="relative z-10 flex items-center justify-center"
        >
          {isDark ? (
            <div className="flex items-center">
              <FaSun size={18} />
            </div>
          ) : (
            <div className="flex items-center">
              <FaMoon size={18} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      
      {/* Stars for dark mode */}
      {isDark && (
        <>
          <motion.div 
            className="absolute top-1 right-1.5 text-kedai-red/80 opacity-80"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
          >
            <FaRegSun size={6} />
          </motion.div>
          <motion.div 
            className="absolute bottom-2 left-1.5 text-kedai-red/80 opacity-80"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatType: "reverse",
              delay: 0.5
            }}
          >
            <FaRegSun size={4} />
          </motion.div>
        </>
      )}
      
      {/* Clouds for light mode */}
      {!isDark && (
        <>
          <motion.div 
            className="absolute top-1 left-1 text-white opacity-80"
            animate={{ 
              x: [0, 5, 0],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
          >
            <div className="w-3 h-2 rounded-full bg-white/80" />
          </motion.div>
          <motion.div 
            className="absolute bottom-1 right-1 text-white opacity-80"
            animate={{ 
              x: [0, -3, 0],
              opacity: [0.6, 0.9, 0.6]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              repeatType: "reverse",
              delay: 0.7
            }}
          >
            <div className="w-2 h-1.5 rounded-full bg-white/70" />
          </motion.div>
        </>
      )}
      
      {/* Background animation */}
      <motion.div 
        className={`absolute inset-0 ${isDark ? 'bg-kedai-red/10' : 'bg-kedai-red/10'}`}
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0, 0.15, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          repeatType: "loop" 
        }}
      />
      
      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        whileTap={{
          backgroundColor: isDark ? "rgba(226, 12, 12, 0.2)" : "rgba(226, 12, 12, 0.2)",
          scale: 1.5,
          opacity: 0,
          transition: { duration: 0.5 }
        }}
      />
    </motion.button>
  );
};

export default ThemeToggle; 