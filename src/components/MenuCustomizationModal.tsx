import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Menu, MenuCustomizationOption } from '../types';
import Button from './Button';
import { formatCurrency } from '../utils/format';
import { FaTimes, FaCheckCircle, FaCookieBite, FaExclamationCircle, FaChevronRight } from 'react-icons/fa';

interface MenuCustomizationModalProps {
  menu: Menu;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (customizations: Record<string, string[]>, basePrice: number, extraPrice: number) => void;
}

const MenuCustomizationModal: React.FC<MenuCustomizationModalProps> = ({
  menu,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const [customizations, setCustomizations] = useState<Record<string, string[]>>({});
  const [extraPrice, setExtraPrice] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initialize customizations when menu changes
    if (menu && menu.customizationOptions) {
      const initialCustomizations: Record<string, string[]> = {};
      menu.customizationOptions.forEach(option => {
        if (option.type === 'checkbox') {
          initialCustomizations[option.id] = [];
        } else if (option.options.length > 0) {
          initialCustomizations[option.id] = [option.options[0].id];
        } else {
          initialCustomizations[option.id] = [];
        }
      });
      setCustomizations(initialCustomizations);
      setExtraPrice(0);
      setErrors({});
    }
  }, [menu]);

  const handleSelect = (optionId: string, value: string[], optionType: string) => {
    let newCustomizations = { ...customizations };
    
    if (optionType === 'checkbox') {
      newCustomizations[optionId] = value;
    } else {
      newCustomizations[optionId] = [value[0]]; // Only keep single selection for radio/select
    }
    
    setCustomizations(newCustomizations);
    
    // Clear error if user has made a selection
    if (errors[optionId] && value.length > 0) {
      const newErrors = { ...errors };
      delete newErrors[optionId];
      setErrors(newErrors);
    }
    
    // Calculate extra price
    calculateExtraPrice(newCustomizations);
  };

  const calculateExtraPrice = (selections: Record<string, string[]>) => {
    let total = 0;
    
    if (menu.customizationOptions) {
      menu.customizationOptions.forEach(option => {
        const selectedIds = selections[option.id] || [];
        
        selectedIds.forEach(selectionId => {
          const foundOption = option.options.find(opt => opt.id === selectionId);
          if (foundOption) {
            // Ensure we're adding numbers
            total += Number(foundOption.price);
          }
        });
      });
    }
    
    console.log(`Calculated extra price: ${total}`);
    setExtraPrice(total);
  };

  const handleSubmit = () => {
    // Validate required fields
    const newErrors: Record<string, boolean> = {};
    let hasErrors = false;
    
    if (menu.customizationOptions) {
      menu.customizationOptions.forEach(option => {
        if (option.required && (!customizations[option.id] || customizations[option.id].length === 0)) {
          newErrors[option.id] = true;
          hasErrors = true;
        }
      });
    }
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    // Pass the selections to parent component
    console.log(`Adding to cart: ${menu.name}, base price: ${menu.price}, extra price: ${extraPrice}`);
    
    // Ensure we pass numbers, not strings
    const numericBasePrice = Number(menu.price);
    const numericExtraPrice = Number(extraPrice);
    console.log(`Total price calculation: ${numericBasePrice} + ${numericExtraPrice} = ${numericBasePrice + numericExtraPrice}`);
    
    onAddToCart(customizations, numericBasePrice, numericExtraPrice);
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-xl w-full border border-gray-200 dark:border-gray-700 relative flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-50 dark:bg-red-900/10 rounded-full opacity-30 z-0"></div>
        <div className="absolute -bottom-14 -left-14 w-28 h-28 bg-yellow-50 dark:bg-yellow-900/10 rounded-full opacity-20 z-0"></div>
        
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 flex items-center justify-between relative z-10 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-6 -left-6 w-12 h-12 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-white/5 rounded-full"></div>
          
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 4 }}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-lg"
            >
              <FaCookieBite className="text-yellow-200" size={20} />
            </motion.div>
            <div>
              <h3 className="font-bold text-lg">Customize Your Order</h3>
              <p className="text-sm text-white/80">Personalize your dish</p>
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </motion.button>
        </div>
        
        {/* Enhanced Menu info */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 relative z-10">
          <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">{menu.name}</h4>
          <div className="flex items-center justify-between mt-1">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Base price
            </p>
            <p className="text-red-600 dark:text-red-400 font-medium">
              {formatCurrency(menu.price)}
            </p>
          </div>
        </div>
        
        {/* Customization options in scrollable area */}
        <div className="overflow-y-auto px-4 py-6 space-y-4 flex-1 custom-scrollbar relative z-10">
          <div className="p-4 space-y-6">
            {!menu.customizationOptions || menu.customizationOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FaExclamationCircle size={36} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  No customization options available
                </p>
              </div>
            ) : (
              <div>
                {menu.customizationOptions.map((option, optionIndex) => (
                  <motion.div 
                    key={option.id} 
                    className={`mb-6 last:mb-0 pb-6 last:pb-0 ${optionIndex !== menu.customizationOptions!.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * optionIndex, duration: 0.4 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                          {option.name} 
                          {option.required && (
                            <span className="text-red-500 text-xs bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded font-medium">
                              Required
                            </span>
                          )}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {option.type === 'checkbox' ? 'Select multiple options' : 'Select one option'}
                        </p>
                      </div>
                      <AnimatePresence>
                        {errors[option.id] && (
                          <motion.span 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="text-xs bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 px-2 py-1 rounded-full font-medium flex items-center gap-1"
                          >
                            <FaExclamationCircle size={10} />
                            Required
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {option.type === 'select' && (
                      <motion.div
                        className="relative"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + optionIndex * 0.1 }}
                      >
                        <select 
                          className={`w-full p-3 border ${errors[option.id] ? 'border-red-300 dark:border-red-700 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none`}
                          value={customizations[option.id]?.[0] || ''}
                          onChange={(e) => handleSelect(option.id, [e.target.value], option.type)}
                        >
                          {option.options.map((choice) => (
                            <option key={choice.id} value={choice.id}>
                              {choice.name} {choice.price > 0 && `(+${formatCurrency(choice.price)})`}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                          <FaChevronRight size={12} className="transform rotate-90" />
                        </div>
                      </motion.div>
                    )}
                    
                    {option.type === 'radio' && (
                      <div className="space-y-2 mt-3">
                        {option.options.map((choice, choiceIndex) => (
                          <motion.label 
                            key={choice.id} 
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                              (customizations[option.id] || []).includes(choice.id) 
                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 shadow-sm' 
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * optionIndex + 0.05 * choiceIndex, type: "spring" }}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center h-5">
                              <input
                                id={`radio-${option.id}-${choice.id}`}
                                type="radio"
                                className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                checked={(customizations[option.id] || []).includes(choice.id)}
                                onChange={() => handleSelect(option.id, [choice.id], option.type)}
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{choice.name}</span>
                            </div>
                            {choice.price > 0 && (
                              <span className="text-red-600 dark:text-red-400 font-medium text-sm">
                                +{formatCurrency(choice.price)}
                              </span>
                            )}
                          </motion.label>
                        ))}
                      </div>
                    )}
                    
                    {option.type === 'checkbox' && (
                      <div className="space-y-2 mt-3">
                        {option.options.map((choice, choiceIndex) => (
                          <motion.label 
                            key={choice.id} 
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                              (customizations[option.id] || []).includes(choice.id) 
                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 shadow-sm' 
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * optionIndex + 0.05 * choiceIndex, type: "spring" }}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center h-5">
                              <input
                                id={`checkbox-${option.id}-${choice.id}`}
                                type="checkbox"
                                className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                checked={(customizations[option.id] || []).includes(choice.id)}
                                onChange={(e) => {
                                  const currentSelections = customizations[option.id] || [];
                                  const newSelections = e.target.checked
                                    ? [...currentSelections, choice.id]
                                    : currentSelections.filter(id => id !== choice.id);
                                  handleSelect(option.id, newSelections, option.type);
                                }}
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{choice.name}</span>
                            </div>
                            {choice.price > 0 && (
                              <span className="text-red-600 dark:text-red-400 font-medium text-sm">
                                +{formatCurrency(choice.price)}
                              </span>
                            )}
                          </motion.label>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Footer */}
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/80 relative z-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Price</span>
            <motion.div 
              key={extraPrice}
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-bold text-lg text-red-600 dark:text-red-400"
            >
              {formatCurrency(Number(menu.price) + extraPrice)}
            </motion.div>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl w-1/3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Cancel
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <FaCheckCircle size={16} />
              Add to Cart
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MenuCustomizationModal; 