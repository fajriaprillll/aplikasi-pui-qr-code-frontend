import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaTimes } from 'react-icons/fa';

type AlertType = 'info' | 'warning' | 'success';

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: AlertType;
  duration?: number; // Auto-close duration in ms, 0 to disable
  title?: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  isOpen,
  onClose,
  message,
  type = 'info',
  duration = 0, // Default: don't auto-close
  title
}) => {
  const [progress, setProgress] = useState(100);
  
  // Auto-close timer
  useEffect(() => {
    if (!isOpen || duration === 0) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;
      const progressPercent = (remaining / duration) * 100;
      
      if (remaining <= 0) {
        clearInterval(timer);
        onClose();
      } else {
        setProgress(progressPercent);
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [isOpen, duration, onClose]);
  
  // Get icon and colors based on alert type
  const getAlertStyles = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <FaExclamationTriangle className="text-3xl" />,
          bgColor: 'from-amber-500 to-amber-600',
          lightBg: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
          progressColor: 'bg-amber-500'
        };
      case 'success':
        return {
          icon: <FaCheckCircle className="text-3xl" />,
          bgColor: 'from-green-500 to-green-600',
          lightBg: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          progressColor: 'bg-green-500'
        };
      case 'info':
      default:
        return {
          icon: <FaInfoCircle className="text-3xl" />,
          bgColor: 'from-blue-500 to-blue-600',
          lightBg: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          progressColor: 'bg-blue-500'
        };
    }
  };
  
  const styles = getAlertStyles();
  
  // Default title based on type if not provided
  const alertTitle = title || (
    type === 'warning' ? 'Perhatian' : 
    type === 'success' ? 'Berhasil' : 
    'Informasi'
  );
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            // Close only if clicking the backdrop, not the alert itself
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div 
            className="relative w-full max-w-md overflow-hidden rounded-xl shadow-2xl"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              opacity: 1,
              transition: { 
                type: "spring", 
                damping: 25, 
                stiffness: 300 
              }
            }}
            exit={{ 
              scale: 0.9, 
              y: 20, 
              opacity: 0,
              transition: { duration: 0.2 } 
            }}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${styles.bgColor} text-white p-4 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    damping: 10, 
                    stiffness: 100 
                  }}
                >
                  {styles.icon}
                </motion.div>
                <motion.h3 
                  className="text-xl font-bold"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {alertTitle}
                </motion.h3>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/20"
              >
                <FaTimes />
              </motion.button>
            </div>
            
            {/* Body */}
            <div className={`${styles.lightBg} ${styles.borderColor} border-x border-b p-5`}>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`${styles.textColor} text-base`}
              >
                {message}
              </motion.div>
              
              {/* Action buttons */}
              <motion.div 
                className="flex justify-end mt-6 gap-3"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={`px-6 py-2 rounded-lg bg-gradient-to-r ${styles.bgColor} text-white font-medium shadow-md`}
                >
                  OK
                </motion.button>
              </motion.div>
            </div>
            
            {/* Progress bar for auto-close */}
            {duration > 0 && (
              <motion.div 
                className="h-1 bg-gray-200"
                initial={{ width: "100%" }}
              >
                <motion.div 
                  className={`h-full ${styles.progressColor}`}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomAlert; 