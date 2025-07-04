import React, { useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { FaExclamationCircle, FaCheckCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | 'success';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Batal',
  type = 'warning'
}) => {
  const controls = useAnimation();
  const buttonControls = useAnimation();
  
  useEffect(() => {
    if (isOpen) {
      controls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 0.3, times: [0, 0.5, 1] }
      });
      
      // Add pulsing animation to the confirm button
      buttonControls.start({
        boxShadow: [
          '0 0 0 0 rgba(0, 0, 0, 0.1)',
          '0 0 0 8px rgba(0, 0, 0, 0)',
          '0 0 0 0 rgba(0, 0, 0, 0.1)'
        ],
        transition: {
          repeat: 2,
          duration: 1.5,
          ease: "easeInOut"
        }
      });
    }
  }, [isOpen, controls, buttonControls]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Determine styles based on type
  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <FaExclamationCircle size={32} />,
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          iconColor: 'text-amber-500 dark:text-amber-400',
          confirmBg: 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500',
          headerBg: 'bg-gradient-to-r from-amber-400 to-amber-600 dark:from-amber-600 dark:to-amber-800',
          shadow: 'shadow-amber-200 dark:shadow-amber-900/20',
        };
      case 'success':
        return {
          icon: <FaCheckCircle size={32} />,
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
          iconColor: 'text-emerald-500 dark:text-emerald-400',
          confirmBg: 'bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500',
          headerBg: 'bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-600 dark:to-emerald-800',
          shadow: 'shadow-emerald-200 dark:shadow-emerald-900/20',
        };
      case 'info':
      default:
        return {
          icon: <FaInfoCircle size={32} />,
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-500 dark:text-blue-400',
          confirmBg: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500',
          headerBg: 'bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800',
          shadow: 'shadow-blue-200 dark:shadow-blue-900/20',
        };
    }
  };

  const styles = getTypeStyles();

  // Default title based on type if not provided
  const dialogTitle = title || (
    type === 'warning' ? 'Konfirmasi' : 
    type === 'success' ? 'Berhasil' : 
    'Informasi'
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop with blur effect */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog content */}
          <motion.div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full mx-auto relative z-10 overflow-hidden border border-gray-200 dark:border-gray-700 ${styles.shadow} my-16`}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ 
              scale: 1, 
              y: 0, 
              opacity: 1,
              transition: { 
                type: "spring", 
                damping: 25, 
                stiffness: 300,
                duration: 0.3
              }
            }}
            exit={{ 
              scale: 0.95, 
              y: 10, 
              opacity: 0,
              transition: { duration: 0.2, ease: "easeOut" } 
            }}
          >
            <motion.div
              animate={controls}
            />
            
            {/* Header */}
            <div 
              className={`${styles.headerBg} text-white p-5 flex items-center justify-between relative`}
            >
              <h3 
                className="text-xl font-bold flex items-center gap-3"
              >
                <span className={`${styles.iconBg} ${styles.iconColor} rounded-full w-10 h-10 flex items-center justify-center shadow-md`}>
                  {styles.icon}
                </span>
                {dialogTitle}
              </h3>
              <button
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                onClick={onClose}
                aria-label="Tutup dialog"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Body */}
            <motion.div 
              className="p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.2 }}
            >
              <div className="text-gray-700 dark:text-gray-200 text-base leading-relaxed">
                {message.split('\n').map((text, i) => (
                  <p key={i} className={i > 0 ? "mt-3" : ""}>{text}</p>
                ))}
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div 
              className="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                className="px-5 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-sm hover:shadow-md"
                onClick={onClose}
              >
                {cancelText}
              </button>
              <motion.button
                className={`px-5 py-2.5 rounded-lg ${styles.confirmBg} text-white font-medium shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
                onClick={onConfirm}
                animate={buttonControls}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {confirmText}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;