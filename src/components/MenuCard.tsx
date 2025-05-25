import React, { useState, useEffect } from 'react';
import type { Menu } from '../types';
import { formatCurrency, truncateText } from '../utils/format';
import { getMenuImageUrl } from '../utils/imageHelper';
import Button from './Button';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaToggleOn, FaToggleOff, FaEdit, FaTrash } from 'react-icons/fa';

interface MenuCardProps {
  menu: Menu;
  onAddToCart: (menu: Menu, quantity: number) => void;
  isAdmin?: boolean;
  onEdit?: (menu: Menu) => void;
  onDelete?: (menuId: number) => void;
  onFixImage?: (menu: Menu) => void;
  onToggleStatus?: (menu: Menu, newStatus: 'AVAILABLE' | 'OUT_OF_STOCK') => void;
}

const MenuCard: React.FC<MenuCardProps> = ({
  menu,
  onAddToCart,
  isAdmin = false,
  onEdit,
  onDelete,
  onFixImage,
  onToggleStatus,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [showPathDetails, setShowPathDetails] = useState(false);
  const [forceReload, setForceReload] = useState(0); // Counter untuk paksa reload image
  const [isHovered, setIsHovered] = useState(false);

  const handleIncrement = () => {
    setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    onAddToCart(menu, quantity);
    setQuantity(1); // Reset quantity after adding to cart
    
    // Add a small animation feedback
    const button = document.getElementById(`add-to-cart-${menu.id}`);
    if (button) {
      button.classList.add('animate-pulse');
      setTimeout(() => {
        button.classList.remove('animate-pulse');
      }, 500);
    }
  };

  // Handle toggle availability status
  const handleToggleStatus = () => {
    if (onToggleStatus) {
      const newStatus = menu.status === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE';
      onToggleStatus(menu, newStatus);
    }
  };

  // Force reload image dengan timestamp untuk menghindari cache
  const reloadImage = () => {
    setImageError(false);
    setForceReload(prev => prev + 1);
  };

  // Handle different image URL formats
  const getImageUrl = () => {
    // Gunakan helper baru untuk mendapatkan URL gambar berdasarkan nama menu
    return getMenuImageUrl(menu.name, menu.image, forceReload);
  };

  // Handle successful image load
  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setShowPathDetails(false); // Don't show debug details automatically anymore
    
    // Set preview URL to placeholder
    setPreviewUrl('https://via.placeholder.com/300x200?text=Image+Error');
  };

  // Check if menu is out of stock
  const isOutOfStock = menu.status === 'OUT_OF_STOCK';

  // Load image on mount
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageError(false);
    };
    img.onerror = () => {
      setImageError(true);
      setPreviewUrl('https://via.placeholder.com/300x200?text=Image+Error');
    };
    img.src = getImageUrl();
  }, [menu.name, menu.image, forceReload]);

  return (
    <motion.div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${isOutOfStock ? 'opacity-75' : ''} border border-gray-100 dark:border-gray-700`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        y: -5, 
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="h-48 overflow-hidden relative">
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-40">
            <span className="bg-red-500 text-white font-medium px-4 py-2 rounded-full uppercase text-sm shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
        <motion.div 
          className="w-full h-full"
          animate={{ scale: isHovered && !isOutOfStock ? 1.05 : 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.img
            src={previewUrl || getImageUrl()} 
            alt={menu.name}
            className={`w-full h-full object-cover ${isOutOfStock ? 'filter grayscale' : ''}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
          {imageError && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-center px-4">Gambar tidak tersedia</p>
            </div>
          )}
        </motion.div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{menu.name}</h3>
            {!isAdmin && (
              <div className="mt-1">
                {menu.status === 'AVAILABLE' ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">Available</span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">Out of Stock</span>
                )}
              </div>
            )}
          </div>
          <motion.span 
            className="text-lg font-bold text-red-500 dark:text-red-400"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            {formatCurrency(menu.price)}
          </motion.span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
          {truncateText(menu.description, 80)}
        </p>
        
        {isAdmin ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => onEdit && onEdit(menu)}
              iconLeft={<FaEdit size={14} />}
            >
              Edit
            </Button>
            
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => onDelete && onDelete(menu.id)}
              iconLeft={<FaTrash size={14} />}
            >
              Delete
            </Button>
            
            <Button
              variant={menu.status === 'AVAILABLE' ? 'success' : 'light'}
              size="sm"
              onClick={handleToggleStatus}
              iconLeft={menu.status === 'AVAILABLE' ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />}
            >
              {menu.status === 'AVAILABLE' ? 'Available' : 'Out'}
            </Button>
            
            {imageError && onFixImage && (
              <Button 
                variant="light" 
                size="sm" 
                onClick={() => onFixImage(menu)}
              >
                Fix Image
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-4">
            {!isOutOfStock && (
              <div className="flex items-center justify-between">
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <motion.button 
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                    onClick={handleDecrement}
                    whileTap={{ scale: 0.9 }}
                    disabled={quantity <= 1}
                  >
                    <FaMinus size={12} />
                  </motion.button>
                  <span className="px-4 py-1 bg-white dark:bg-gray-800 font-medium text-gray-800 dark:text-gray-200">{quantity}</span>
                  <motion.button 
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                    onClick={handleIncrement}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaPlus size={12} />
                  </motion.button>
                </div>
                
                <Button
                  id={`add-to-cart-${menu.id}`}
                  variant="primary"
                  size="sm"
                  onClick={handleAddToCart}
                  className="ml-2 flex-grow"
                >
                  Add to Cart
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {isHovered && !isOutOfStock && !isAdmin && (
          <motion.div 
            className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full shadow-md p-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={handleAddToCart}
          >
            <FaPlus className="text-red-500 dark:text-red-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MenuCard; 