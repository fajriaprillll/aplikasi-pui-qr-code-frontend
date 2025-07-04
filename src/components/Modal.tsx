import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  icon?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title = '',
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
  contentClassName = '',
  icon,
}) => {
  // Reference to modal content for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    // Focus trap - focus the modal when it opens
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Modal sizes
  const sizeClasses = {
    sm: 'max-w-md w-full',
    md: 'max-w-lg w-full',
    lg: 'max-w-2xl w-full',
    xl: 'max-w-4xl w-full',
    full: 'max-w-[95vw] w-full',
  };

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut' as const
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn' as const
      }
    }
  };

  const modalVariants = {
    hidden: { 
      scale: 0.8,
      opacity: 0,
      y: 20,
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300,
        duration: 0.4
      }
    },
    exit: {
      scale: 0.9,
      opacity: 0,
      y: 10,
      transition: {
        duration: 0.2,
        ease: 'easeIn' as const
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        delay: 0.2,
        duration: 0.3
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleBackdropClick}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div 
            className={`relative flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 ${sizeClasses[size] || ''} ${className}`}
            style={{ zIndex: 60 }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
          >
            {/* Header modal */}
            {title && (
              <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                <motion.div 
                  className="flex items-center"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  {icon ? (
                    <motion.div 
                      className="bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400 p-2.5 rounded-lg mr-3 shadow-sm"
                      initial={{ rotate: -10, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      {icon}
                    </motion.div>
                  ) : null}
                  <h2 
                    className="text-xl font-bold text-gray-800 dark:text-gray-100"
                    id="modal-title"
                  >
                    {title}
                  </h2>
                </motion.div>
                
                {showCloseButton && (
                  <motion.button
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full p-2.5 transition-colors shadow-sm"
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ rotate: 45, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    aria-label="Close modal"
                  >
                    <FaTimes className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            )}
            
            {/* Content without overflow restriction */}
            <motion.div 
              className={`p-6 ${contentClassName}`}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal; 