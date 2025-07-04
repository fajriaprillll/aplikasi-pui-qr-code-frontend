import React, { useState, useEffect } from 'react';
import type { Menu } from '../types';
import { formatCurrency, truncateText } from '../utils/format';
import Button from './Button';
import { FaPlus, FaMinus, FaEdit, FaTrash, FaCartPlus, FaTag, FaRegClock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuCardProps {
  menu: Menu;
  onAddToCart: (menu: Menu, quantity: number) => void;
  isAdmin?: boolean;
  onEdit?: (menu: Menu) => void;
  onDelete?: (menuId: number) => void;
  onFixImage?: (menu: Menu) => void;
  onToggleStatus?: (menu: Menu, newStatus: 'AVAILABLE' | 'OUT_OF_STOCK') => void;
  isInCart?: boolean;
  cartQuantity?: number;
  onRemoveFromCart?: (menuId: number) => void;
  onIncreaseQuantity?: (menuId: number) => void;
  onDecreaseQuantity?: (menuId: number) => void;
  showCustomizeButton?: boolean;
  onCustomize?: (menu: Menu) => void;
  compact?: boolean;
  showActions?: boolean;
}

const MenuCard: React.FC<MenuCardProps> = ({
  menu,
  onAddToCart,
  isAdmin = false,
  onEdit,
  onDelete,
  onFixImage,
  onToggleStatus,
  isInCart = false,
  cartQuantity = 0,
  onRemoveFromCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
  showCustomizeButton = false,
  onCustomize,
  compact = false,
  showActions = true
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

  // Generate a placeholder image if no image is provided
  const placeholderImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(menu.name)}&background=random&color=fff&size=512`;
  
  // Use the menu's imageUrl or a placeholder
  const imageUrl = menu.imageUrl || placeholderImage;

  // Handle successful image load
  const handleImageLoad = () => {
    setImageError(false);
    console.log(`MenuCard: Image loaded successfully for ${menu.name}`);
  };

  const handleImageError = () => {
    console.error(`MenuCard: Image error for ${menu.name}, path: ${menu.imageUrl}`);
    setImageError(true);
    
    // Set preview URL to placeholder
    setPreviewUrl(placeholderImage);
  };

  // Check if menu is out of stock
  const isOutOfStock = menu.status === 'OUT_OF_STOCK';

  // Load image on mount and when menu.imageUrl changes
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      console.log(`MenuCard: Image preloaded successfully for ${menu.name}`);
      setImageError(false);
      setPreviewUrl(img.src); // Set the preview URL to the successful image
    };
    img.onerror = () => {
      console.error(`MenuCard: Image preload failed for ${menu.name}, path: ${menu.imageUrl}`);
      setImageError(true);
      setPreviewUrl(placeholderImage);
    };
    
    console.log(`MenuCard: Preloading image ${imageUrl} for ${menu.name}`);
    img.src = imageUrl;
    
    return () => {
      // Cleanup function
      img.onload = null;
      img.onerror = null;
    };
  }, [menu.name, menu.imageUrl, imageUrl]);

  // Handle delete functionality when delete button is pressed
  const handleDelete = () => {
    if (onDelete) {
      // Make sure menu.id is defined before passing it
      if (menu && menu.id) {
        console.log(`MenuCard: Requesting delete for menu ${menu.id} (${menu.name})`);
        onDelete(menu.id);
      } else {
        console.error('Cannot delete menu: menu.id is not defined', menu);
      }
    } else {
      console.error('Delete handler not provided to MenuCard');
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 group"
      whileHover={{ y: -5, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => {
        setIsHovered(true);
        setIsDescriptionExpanded(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDescriptionExpanded(false);
      }}
    >
      <div className="relative overflow-hidden group">
        {/* Image with hover zoom effect */}
        <motion.img 
          src={previewUrl || imageUrl} 
          alt={menu.name} 
          className={`w-full h-48 object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'} ${isOutOfStock ? 'filter grayscale' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        
        {/* Category tag */}
        {menu.category && (
          <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-primary-600 py-1 px-3 text-xs font-medium rounded-full shadow-sm flex items-center gap-1">
            <FaTag size={10} />
            {menu.category}
          </div>
        )}
        
        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
            <FaRegClock size={24} className="mb-2" />
            <div className="font-bold text-lg tracking-wider">OUT OF STOCK</div>
            <div className="text-xs mt-1 text-white/80">Currently unavailable</div>
          </div>
        )}

        {/* Add to cart quick action on hover for non-admin view */}
        {!isAdmin && !isOutOfStock && (
          <motion.div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <Button
              variant="primary"
              size="lg"
              iconLeft={<FaCartPlus />}
              className="shadow-xl"
              onClick={() => onAddToCart(menu, 1)}
            >
              Add to Cart
            </Button>
          </motion.div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-2">
          <h3 className="font-semibold text-gray-800 text-lg">{menu.name}</h3>
          <span className="font-bold text-primary-600 text-lg">{formatCurrency(menu.price)}</span>
        </div>
        
        <div className="relative min-h-[3em]">
          <AnimatePresence>
            <motion.div
              initial={false}
              animate={{
                height: isDescriptionExpanded ? "auto" : "3em"
              }}
              transition={{
                duration: 0.4,
                ease: [0.04, 0.62, 0.23, 0.98]
              }}
              className="overflow-hidden"
            >
              <motion.p 
                className="text-sm text-gray-500 mb-4"
              >
                {menu.description || "No description available"}
              </motion.p>
            </motion.div>
          </AnimatePresence>
          
          <AnimatePresence>
            {!isDescriptionExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-0 right-0 left-0 h-8 bg-gradient-to-t from-white to-transparent flex justify-end items-end"
              >
                <span className="text-xs text-gray-400 pr-1">...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {isAdmin && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <motion.button 
                onClick={() => onEdit && onEdit(menu)}
                className="flex items-center justify-center gap-1.5 text-sm py-2 px-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaEdit className="text-gray-500" size={14} /> Edit
              </motion.button>
            
              <motion.button 
                onClick={() => onDelete && onDelete(menu.id)}
                className="flex items-center justify-center gap-1.5 text-sm py-2 px-4 bg-red-500 border border-red-500 rounded-lg hover:bg-red-600 text-white"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FaTrash className="text-white" size={14} /> Delete
              </motion.button>
            </div>
            
            <motion.button 
              onClick={handleToggleStatus}
              className={`w-full text-sm py-2 px-4 rounded-lg flex items-center justify-center transition-colors ${
                menu.status === 'AVAILABLE'
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              <span className="mr-1">◉</span> {menu.status === 'AVAILABLE' ? 'Available' : 'Mark as Available'}
            </motion.button>
          </div>
        )}
        
        {!isAdmin && (
          <div className="mt-3">
            {isOutOfStock ? (
              <Button 
                variant="light" 
                className="w-full text-sm py-2 bg-gray-200 text-gray-500 cursor-not-allowed"
                disabled
              >
                Out of Stock
              </Button>
            ) : (
              <div className="flex items-center">
                <div className="flex items-center border border-gray-300 rounded-l-lg overflow-hidden">
                  <motion.button 
                    onClick={handleDecrement}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    disabled={quantity <= 1}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaMinus size={12} />
                  </motion.button>
                  <div className="px-4 py-2 text-sm font-medium text-gray-800 border-l border-r border-gray-300">
                    {quantity}
                  </div>
                  <motion.button 
                    onClick={handleIncrement}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                    whileTap={{ scale: 0.9 }}
                  >
                    <FaPlus size={12} />
                  </motion.button>
                </div>
                <Button
                  id={`add-to-cart-${menu.id}`}
                  variant="primary"
                  className="flex-1 ml-1 text-sm py-2"
                  onClick={handleAddToCart}
                  iconLeft={<FaCartPlus size={14} />}
                >
                  Add to Cart
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MenuCard; 