import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Menu, MenuCustomizationOption } from '../types';
import Button from './Button';
import { formatCurrency } from '../utils/format';
import { FaTimes } from 'react-icons/fa';

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">Customize Your Order</h3>
          <button 
            onClick={onClose}
            className="text-white p-1 hover:bg-white/20 rounded-full"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Menu info */}
        <div className="p-4 border-b">
          <h4 className="font-bold text-gray-800">{menu.name}</h4>
          <p className="text-red-600 font-medium">
            Base price: {formatCurrency(menu.price)}
          </p>
        </div>
        
        {/* Customization options */}
        <div className="flex-1 overflow-y-auto p-4">
          {!menu.customizationOptions || menu.customizationOptions.length === 0 ? (
            <p className="text-gray-500 text-center">No customization options available</p>
          ) : (
            <div className="space-y-6">
              {menu.customizationOptions.map((option) => (
                <div key={option.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-gray-800">
                        {option.name} 
                        {option.required && <span className="text-red-500 ml-1">*</span>}
                      </h5>
                      {option.type === 'checkbox' && (
                        <p className="text-xs text-gray-500">Select multiple options</p>
                      )}
                      {option.type === 'radio' && (
                        <p className="text-xs text-gray-500">Select one option</p>
                      )}
                    </div>
                    {errors[option.id] && (
                      <span className="text-xs text-red-500 font-medium">Selection required</span>
                    )}
                  </div>
                  
                  <div className={`mt-2 ${errors[option.id] ? 'border border-red-300 rounded-md p-2 bg-red-50' : ''}`}>
                    {option.type === 'select' && (
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-md"
                        value={customizations[option.id]?.[0] || ''}
                        onChange={(e) => handleSelect(option.id, [e.target.value], option.type)}
                      >
                        {option.options.map((choice) => (
                          <option key={choice.id} value={choice.id}>
                            {choice.name} {choice.price > 0 && `(+${formatCurrency(choice.price)})`}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {option.type === 'radio' && (
                      <div className="space-y-2">
                        {option.options.map((choice) => (
                          <label 
                            key={choice.id} 
                            className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="radio"
                              className="h-4 w-4 text-red-600"
                              checked={(customizations[option.id] || []).includes(choice.id)}
                              onChange={() => handleSelect(option.id, [choice.id], option.type)}
                            />
                            <span className="ml-2 flex-1">{choice.name}</span>
                            {choice.price > 0 && (
                              <span className="text-red-600 font-medium text-sm">
                                +{formatCurrency(choice.price)}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {option.type === 'checkbox' && (
                      <div className="space-y-2">
                        {option.options.map((choice) => (
                          <label 
                            key={choice.id} 
                            className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-red-600 rounded"
                              checked={(customizations[option.id] || []).includes(choice.id)}
                              onChange={(e) => {
                                const currentSelections = customizations[option.id] || [];
                                const newSelections = e.target.checked
                                  ? [...currentSelections, choice.id]
                                  : currentSelections.filter(id => id !== choice.id);
                                handleSelect(option.id, newSelections, option.type);
                              }}
                            />
                            <span className="ml-2 flex-1">{choice.name}</span>
                            {choice.price > 0 && (
                              <span className="text-red-600 font-medium text-sm">
                                +{formatCurrency(choice.price)}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium">Total Price:</span>
            <div className="text-right">
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(Number(menu.price) + Number(extraPrice))}
              </span>
              {/* Debug price data */}
              <span className="text-xs text-gray-500 block">
                (base: {menu.price}, extra: {extraPrice}, total: {Number(menu.price) + Number(extraPrice)})
              </span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmit}
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MenuCustomizationModal; 