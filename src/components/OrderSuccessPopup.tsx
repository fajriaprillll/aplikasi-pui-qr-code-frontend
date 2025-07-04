import React, { useEffect } from 'react';
import { formatCurrency } from '../utils/format';
import { FaCheck, FaArrowLeft, FaClock, FaReceipt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderSuccessPopupProps {
  visible: boolean;
  onClose: () => void;
  orderItems: any[];
  orderTotal: number;
}

const OrderSuccessPopup: React.FC<OrderSuccessPopupProps> = ({ visible, onClose, orderItems, orderTotal }) => {
  // Close on escape key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success checkmark with animated circle */}
            <div className="relative h-36 bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center overflow-hidden">
              <motion.div 
                className="absolute w-80 h-80 bg-white opacity-10 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
              
              <motion.div 
                className="absolute w-60 h-60 bg-white opacity-10 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              />
              
              <motion.div 
                className="bg-white rounded-full p-4 shadow-lg relative z-10"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  damping: 10,
                  stiffness: 200,
                  delay: 0.6
                }}
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 1],
                    rotate: [0, 10, 0]
                  }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <FaCheck className="text-3xl text-green-500" />
                </motion.div>
              </motion.div>
              
              {/* Decorative elements */}
              <motion.div 
                className="absolute left-10 top-10 w-6 h-6 bg-white opacity-20 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.div 
                className="absolute right-10 bottom-10 w-4 h-4 bg-white opacity-20 rounded-full"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
              />
            </div>
            
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">Order Successful!</h2>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                  Your order has been placed and is being prepared.
                </p>
                
                {/* Order summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6 shadow-inner">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                      <FaReceipt className="text-green-500" />
                      <span>Order Summary</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <FaClock size={12} />
                      <span>Just now</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-auto pr-2 mb-3">
                    {orderItems.map((item, index) => (
                      <motion.div 
                        key={`${item.id}-${index}`}
                        className="flex justify-between text-sm border-b dark:border-gray-600 pb-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + (index * 0.1) }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 w-5 h-5 rounded-full flex items-center justify-center text-xs">
                            {item.quantity}
                          </span>
                          <span className="text-gray-800 dark:text-gray-200">
                            {item.menu?.name || item.name || 'Unknown Item'}
                          </span>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  <motion.div 
                    className="flex justify-between font-bold text-gray-900 dark:text-white border-t dark:border-gray-600 pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                  >
                    <span>Total</span>
                    <span>{formatCurrency(orderTotal)}</span>
                  </motion.div>
                </div>
                
                {/* Back to menu button */}
                <div className="flex justify-center">
                  <motion.button
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-8 rounded-lg shadow-lg flex items-center gap-2 hover:from-green-600 hover:to-green-700 transition-colors duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                  >
                    <FaArrowLeft size={14} />
                    <span>Kembali ke Menu</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
            
            {/* Bottom decoration */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-300 via-green-500 to-emerald-600"></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderSuccessPopup; 