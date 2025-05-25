import React, { useState } from 'react';
import type { CartItem } from '../types';
import { formatCurrency } from '../utils/format';
import Button from './Button';
import { useCartStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaTrash, FaTimes, FaShoppingCart } from 'react-icons/fa';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, onSubmitOrder }) => {
  const { cart, updateQuantity, removeFromCart, getTotal } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitOrder();
      onClose();
    } catch (error) {
      console.error('Failed to submit order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <motion.div 
                className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-100"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <FaShoppingCart className="text-red-500 dark:text-red-400" />
                <span>Your Order</span>
              </motion.div>
              <motion.button
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full p-2 transition-colors"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close cart"
              >
                <FaTimes className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.items.length === 0 ? (
                <motion.div 
                  className="text-center py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="w-20 h-20 mb-4 text-gray-300 dark:text-gray-600"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <FaShoppingCart className="w-full h-full" />
                  </motion.div>
                  <p className="text-lg font-medium">Your cart is empty</p>
                  <p className="text-sm mt-2">Add some items to get started</p>
                </motion.div>
              ) : (
                <AnimatePresence initial={false}>
                  <motion.ul 
                    className="divide-y divide-gray-100 dark:divide-gray-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.07 }}
                  >
                    {cart.items.map((item) => (
                      <CartItemRow
                        key={item.menuId}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </motion.ul>
                </AnimatePresence>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <motion.div 
                className="flex justify-between items-center mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="font-semibold text-gray-800 dark:text-gray-200">Total:</span>
                <motion.span 
                  className="text-xl font-bold text-gray-900 dark:text-gray-100"
                  key={getTotal()}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  {formatCurrency(getTotal())}
                </motion.span>
              </motion.div>

              <motion.div 
                className="flex gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  isLoading={isSubmitting}
                  disabled={cart.items.length === 0}
                  onClick={handleSubmitOrder}
                >
                  Place Order
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (menuId: number, quantity: number) => void;
  onRemove: (menuId: number) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      onUpdateQuantity(item.menuId, newQuantity);
    }
  };

  const subtotal = item.price * item.quantity;

  return (
    <motion.li 
      className="py-3 flex items-start"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginTop: 0, marginBottom: 0, padding: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      layout
    >
      <div className="flex-1">
        <h4 className="font-medium text-gray-800 dark:text-gray-100">{item.menu?.name}</h4>
        <div className="flex justify-between mt-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.price)} × {item.quantity}</p>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatCurrency(subtotal)}</p>
        </div>
      </div>
      
      <div className="flex items-center ml-4">
        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mr-2">
          <motion.button
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            whileTap={{ scale: 0.9 }}
            disabled={item.quantity <= 1}
            aria-label="Decrease quantity"
          >
            <FaMinus size={10} />
          </motion.button>
          <motion.span 
            className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 min-w-[30px] text-center"
            key={item.quantity}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {item.quantity}
          </motion.span>
          <motion.button
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            whileTap={{ scale: 0.9 }}
            aria-label="Increase quantity"
          >
            <FaPlus size={10} />
          </motion.button>
        </div>
        
        <motion.button
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-1.5 rounded-full"
          onClick={() => onRemove(item.menuId)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Remove item"
        >
          <FaTrash className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.li>
  );
};

export default Cart; 