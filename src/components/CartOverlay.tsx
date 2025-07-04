import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingCart, FaTimes, FaArrowRight, FaShoppingBag, FaCheck } from 'react-icons/fa';
import { useCartStore } from '../store';
import Button from './Button';
import { formatCurrency } from '../utils/format';

interface CartOverlayProps {
  onViewCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartOverlay: React.FC<CartOverlayProps> = ({ 
  onViewCart, 
  isCartOpen, 
  setIsCartOpen 
}) => {
  const { cart } = useCartStore();
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [prevItemsCount, setPrevItemsCount] = useState(0);
  const [showPulse, setShowPulse] = useState(false);
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  
  // Animation when cart items change
  useEffect(() => {
    const currentItemsCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    
    if (currentItemsCount > prevItemsCount) {
      setShowBadgeAnimation(true);
      setShowPulse(true);
      setShowAddedAnimation(true);
      
      setTimeout(() => setShowBadgeAnimation(false), 1000);
      setTimeout(() => setShowPulse(false), 2000);
      setTimeout(() => setShowAddedAnimation(false), 2000);
    }
    
    setPrevItemsCount(currentItemsCount);
  }, [cart.items, prevItemsCount]);
  
  const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Don't show if cart is empty
  if (totalItems === 0) return null;
  
  return (
    <>
      {/* Cart Button */}
      <AnimatePresence>
        {!isCartOpen && (
          <motion.div 
            className="fixed bottom-8 right-8 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Added to cart animation overlay */}
            <AnimatePresence>
              {showAddedAnimation && (
                <motion.div 
                  className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaCheck />
                  <span className="text-sm font-medium whitespace-nowrap">Added to cart!</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Pulse animation */}
            <motion.div
              className={`absolute -inset-3 bg-primary-500 rounded-full opacity-30 ${showPulse ? 'animate-ping' : 'opacity-0'}`}
              animate={showPulse ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 1.5, repeat: 2, repeatType: "reverse" }}
            />
            
            {/* Cart button with badge */}
            <motion.button
              onClick={() => setIsCartOpen(true)}
              className="bg-gradient-to-br from-primary-500 to-primary-700 text-white p-5 rounded-full shadow-xl flex items-center justify-center relative"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
                rotate: [0, -5, 5, -5, 0]
              }}
              transition={{ duration: 0.5 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaShoppingBag className="text-xl" />
              <motion.span 
                className={`absolute -top-2 -right-2 bg-white text-primary-700 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-primary-600 shadow ${showBadgeAnimation ? 'animate-bounce' : ''}`}
                initial={showBadgeAnimation ? { scale: 0.5 } : { scale: 1 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {totalItems}
              </motion.span>
            </motion.button>
            
            {/* Price tooltip */}
            <motion.div
              className="absolute -top-12 right-0 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap border border-gray-100 dark:border-gray-700"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">{formatCurrency(totalPrice)}</span>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-gray-100 dark:border-gray-700"></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Cart Modal Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 w-full sm:w-[480px] sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex justify-between items-center">
                <div className="flex items-center">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <FaShoppingCart className="mr-3 text-lg" />
                  </motion.div>
                  <h3 className="text-lg font-semibold">Your Cart</h3>
                  <div className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </div>
                </div>
                <motion.button 
                  onClick={() => setIsCartOpen(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <FaTimes />
                </motion.button>
              </div>
              
              {/* Cart Content */}
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {cart.items.length > 0 ? (
                  <div className="space-y-5">
                    {/* Quick summary of items */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between mb-3">
                        <span className="text-gray-500 dark:text-gray-400">Total Items:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{totalItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400 text-lg">{formatCurrency(totalPrice)}</span>
                      </div>
                    </div>
                    
                    {/* Checkout button */}
                    <Button 
                      onClick={onViewCart}
                      variant="primary" 
                      className="w-full py-3.5 text-center flex items-center justify-center gap-2 shadow-lg"
                      iconRight={<FaArrowRight />}
                      elevation="floating"
                    >
                      <span className="text-base font-medium">Complete Your Order</span>
                    </Button>
                    
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                      Click to see all items and checkout
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Your cart is empty
                  </div>
                )}
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-primary-300 to-purple-300 opacity-70"></div>
              <motion.div 
                className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-primary-500 opacity-10"
                style={{ bottom: '-10px', right: '-10px' }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div 
                className="absolute top-0 left-0 w-16 h-16 rounded-full bg-yellow-500 opacity-10"
                style={{ top: '-8px', left: '-8px' }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartOverlay; 