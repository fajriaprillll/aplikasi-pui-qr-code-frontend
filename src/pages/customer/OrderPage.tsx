import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MenuAPI, OrderAPI, TableAPI } from '../../api';
import { useCartStore } from '../../store';
import type { Menu, CartItem, Table } from '../../types';
import type { CreateOrderItem } from '../../types/order';
import { OrderStatus } from '../../types';
import Layout from '../../components/Layout';
import { getMenuImageUrl } from '../../utils/imageHelper';
import Button from '../../components/Button';
import { FaSearch, FaPlus, FaMinus, FaShoppingCart, FaTimes, FaUtensils, FaInfo, FaUser, FaQrcode, FaHeart, FaClock, FaCheckCircle, FaCookieBite, FaSync, FaTrash, FaTag, FaArrowRight, FaChevronLeft, FaStar, FaPercent, FaAngleDown, FaMapMarkerAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import MenuCustomizationModal from '../../components/MenuCustomizationModal';
import { useAlert } from '../../contexts/AlertContext';
import OrderSuccessPopup from '../../components/OrderSuccessPopup';

// Animation variants for consistent use
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.07,
      delayChildren: 0.05
    } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring" as const, 
      stiffness: 400, 
      damping: 25,
      mass: 0.9
    } 
  },
  hover: { 
    y: -8, 
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { 
      duration: 0.35, 
      ease: "easeOut" as const 
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (custom: number) => ({ 
    opacity: 1, 
    y: 0,
    transition: { 
      delay: custom * 0.05,
      duration: 0.45,
      type: "spring" as const,
      stiffness: 300,
      damping: 24
    }
  }),
  hover: { 
    y: -8, 
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { 
      duration: 0.35, 
      ease: [0.2, 0.65, 0.3, 0.9] 
    }
  }
};

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Featured menu will be filtered from API data in the component

// Testimonials data - moved from HomePage
const testimonials = [
  {
    id: 1,
    name: 'Andi Wijaya',
    text: 'Food was amazing and the ordering process was so convenient with the QR code system!',
    rating: 5
  },
  {
    id: 2,
    name: 'Maria Putri',
    text: 'Best nasi goreng in town! The staff were very friendly and the service was quick.',
    rating: 4
  },
  {
    id: 3,
    name: 'Budi Santoso',
    text: 'Great atmosphere and delicious food. Will definitely be coming back!',
    rating: 5
  }
];

// Animation variants imported from HomePage
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const OrderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table');
  const [tableInfo, setTableInfo] = useState<Table | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cart, addToCart, removeFromCart, clearCart, updateQuantity } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [quantityMap, setQuantityMap] = useState<Record<number, number>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerNameError, setCustomerNameError] = useState('');
  const [animateCart, setAnimateCart] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [showCartPopup, setShowCartPopup] = useState(false);
  const { showAlert } = useAlert();
  
  // New state variables for the success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [hoveredMenuId, setHoveredMenuId] = useState<number | string | null>(null);
  
  // Extract fetchData to be used outside useEffect
  const fetchData = async () => {
      try {
      setIsLoading(true);
      
      // Fetch menus
      const menuData = await MenuAPI.getAll(true);
      
      // Use menu data directly without price modification
      console.log('Menu data loaded:', menuData);
      const normalizedMenus = menuData;
      
      setMenus(normalizedMenus);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(
          normalizedMenus
            .map(menu => menu.category)
            .filter((category): category is string => category !== undefined)
        )
      );
        setCategories(uniqueCategories);
      
      // Fetch table info if tableId exists
      if (tableId) {
        try {
          const tableData = await TableAPI.getById(parseInt(tableId));
          setTableInfo(tableData);
        } catch (tableErr) {
          console.error('Failed to fetch table info:', tableErr);
          // Continue even if table fetch fails
        }
      }
      } catch (err) {
      console.error('Failed to fetch data:', err);
        setError('Failed to load menu items. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
  // Fetch menu and table info
  useEffect(() => {
    fetchData();
    
    // Show cancellation policy alert with our custom alert component
    setTimeout(() => {
      showAlert(
        "Jika ingin membatalkan pesanan setelah pemesanan dilakukan, silakan langsung ke kasir.", 
        { 
          type: 'warning',
          title: 'Kebijakan Pembatalan',
          duration: 8000 // Auto-close after 8 seconds
        }
      );
    }, 1000);
  }, [tableId]);
  
  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      
      if (detail.action === 'add' || detail.action === 'update') {
        // Trigger animation when items are added or updated
        setAnimateCart(true);
        setTimeout(() => setAnimateCart(false), 700);
        
        // Show cart popup briefly when items are added
        setShowCartPopup(true);
        setTimeout(() => setShowCartPopup(false), 3000);
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);
  
  const handleSubmitOrder = async () => {
    if (!tableId) {
      showAlert('Please scan a valid table QR code first', { type: 'warning' });
      return;
    }
    
    if (cart.items.length === 0) {
      showAlert('Please add at least one item to your order', { type: 'warning' });
      return;
    }

    // Validate customer name
    if (!customerName.trim()) {
      setCustomerNameError('Please enter your name');
      return;
    } else {
      setCustomerNameError('');
    }
    
    try {
      setIsSubmitting(true);
      const total = cart.items.reduce((sum: number, item: CartItem) => sum + Number(item.price) * item.quantity, 0);
      
      // Create order items sesuai format yang diharapkan backend
      const items = cart.items.map(item => {
        return {
          menuId: item.menuId,
          quantity: item.quantity,
          price: Number(item.price) // pastikan price adalah number
        };
      });

      // Create order data dengan format yang benar
      const orderData = {
        tableId: parseInt(tableId),
        customerName: customerName.trim(),
        items: items, // gunakan property 'items' sesuai dengan yang diharapkan backend
        totalPrice: total,
        status: OrderStatus.PENDING,
        isProcessed: false
      };

      // Log data untuk debugging
      console.log("Creating order with data:", JSON.stringify(orderData, null, 2));
      
      const response = await OrderAPI.create(orderData);
      console.log("Order created successfully:", response);
      
      // Save order items and total before clearing the cart
      setOrderItems([...cart.items]);
      setOrderTotal(total);
      
      // Clear the cart
      clearCart();
      
      // Show immediate feedback with alert
      showAlert('Order berhasil dibuat!', { 
        type: 'success', 
        title: 'Pesanan Berhasil',
        duration: 4000
      });
      
      // Set success state which will show the success view in the modal
      setOrderSuccess(true);
      
      // Show the success popup
      setShowSuccessPopup(true);
      
      // Close checkout modal
      setIsCheckoutOpen(false);
      
    } catch (err: any) {
      console.error('Failed to submit order:', err);
      // Log additional error details
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Status:', err.response.status);
      }
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to submit order';
      showAlert(`Failed to submit order: ${errorMessage}`, { type: 'warning', title: 'Order Error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const filteredMenus = menus.filter(menu => {
    const matchCategory = selectedCategory === 'All' || 
      (menu.category && menu.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchSearch = !search || menu.name.toLowerCase().includes(search.toLowerCase());
    
    // We still show out-of-stock items in the list but they'll be visually marked
    return matchCategory && matchSearch;
  });

  const handleQuantityChange = (menuId: number, delta: number) => {
    setQuantityMap(prev => {
      const newQty = Math.max(1, (prev[menuId] || 1) + delta);
      return { ...prev, [menuId]: newQty };
    });
  };
  
  const cartTotal = cart.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Enhanced add to cart with animation and availability check
  const handleAddToCart = (menu: Menu, quantity: number) => {
    // Don't add if menu is out of stock
    if (menu.status === 'OUT_OF_STOCK') {
      showAlert('Sorry, this item is currently out of stock', { type: 'warning' });
      return;
    }
    
    // If the menu has customization options, open the modal instead of directly adding to cart
    if (menu.customizationOptions && menu.customizationOptions.length > 0) {
      setSelectedMenu(menu);
      setIsCustomizationModalOpen(true);
      return;
    }
    
    // For items without customization, add directly to cart
    addToCart(menu, quantity);
    
    // Show small toast notification
    setShowCartPopup(true);
    setTimeout(() => setShowCartPopup(false), 2000);
    
    // Simple dot animation from button to cart
    const button = document.getElementById(`add-to-cart-${menu.id}`);
    const cart = document.querySelector('.fixed.bottom-6.right-6');
    
    if (button && cart) {
      const buttonRect = button.getBoundingClientRect();
      const cartRect = cart.getBoundingClientRect();
      
      const dot = document.createElement('div');
      dot.className = 'fixed z-50 pointer-events-none rounded-full bg-red-500';
      dot.style.width = '12px';
      dot.style.height = '12px';
      dot.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
      
      // Start position
      dot.style.top = `${buttonRect.top + buttonRect.height/2 - 6}px`;
      dot.style.left = `${buttonRect.left + buttonRect.width/2 - 6}px`;
      
      document.body.appendChild(dot);
      
      // Animate to cart
      const startTime = performance.now();
      const duration = 600; // faster animation
      
      const endX = cartRect.left + cartRect.width/2 - 6;
      const endY = cartRect.top + cartRect.height/2 - 6;
      const startX = parseFloat(dot.style.left);
      const startY = parseFloat(dot.style.top);
      
      // Use requestAnimationFrame for smooth animation
      const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easeOutQuad for smoother motion
        const easeProgress = 1 - (1 - progress) * (1 - progress);
        
        // Calculate current position with a slight arc
        const currentX = startX + (endX - startX) * easeProgress;
        const currentY = startY + (endY - startY) * easeProgress - Math.sin(progress * Math.PI) * 50;
        
        // Update position
        dot.style.left = `${currentX}px`;
        dot.style.top = `${currentY}px`;
        
        // Add scaling effect
        const scale = 1 - 0.5 * progress;
        dot.style.transform = `scale(${scale})`;
        
        // Continue animation if not complete
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          document.body.removeChild(dot);
          
          // Pulse the cart icon
          setAnimateCart(true);
          setTimeout(() => setAnimateCart(false), 500);
        }
      };
      
      requestAnimationFrame(animate);
    }
  };
  
  // Handle customization submission
  const handleCustomizationSubmit = (
    customizations: Record<string, string[]>,
    basePrice: number,
    extraPrice: number
  ) => {
    if (!selectedMenu) return;
    
    // Add to cart with customizations
    addToCart(selectedMenu, quantityMap[selectedMenu.id] || 1, customizations, extraPrice);
    
    // Show small toast notification
    setShowCartPopup(true);
    setTimeout(() => setShowCartPopup(false), 2000);
    
    // Close modal
    setIsCustomizationModalOpen(false);
    setSelectedMenu(null);
    
    // Pulse the cart icon
    setAnimateCart(true);
    setTimeout(() => setAnimateCart(false), 500);
  };
  
  // Helper to get category emoji icons
  const getCategoryIcon = (category: string): string => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('drink') || categoryLower.includes('beverage')) return '🥤';
    if (categoryLower.includes('dessert') || categoryLower.includes('sweet')) return '🍰';
    if (categoryLower.includes('appetizer') || categoryLower.includes('starter')) return '🍤';
    if (categoryLower.includes('main') || categoryLower.includes('dish')) return '🍲';
    if (categoryLower.includes('soup')) return '🍜';
    if (categoryLower.includes('salad')) return '🥗';
    if (categoryLower.includes('seafood')) return '🦐';
    if (categoryLower.includes('meat') || categoryLower.includes('beef')) return '🥩';
    if (categoryLower.includes('chicken')) return '🍗';
    if (categoryLower.includes('rice')) return '🍚';
    if (categoryLower.includes('noodle')) return '🍜';
    if (categoryLower.includes('pasta')) return '🍝';
    return '🍴';
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white via-red-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <div className="text-center p-8 rounded-2xl max-w-md mx-auto">
            <motion.div 
              className="relative mx-auto w-40 h-40 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Spinning plate animation */}
              <motion.div 
                className="absolute inset-0 rounded-full border-8 border-red-100"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Middle spinning circle */}
              <motion.div 
                className="absolute inset-4 rounded-full border-8 border-t-red-500 border-r-red-400 border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Inner pulsing circle */}
              <motion.div 
                className="absolute inset-10 rounded-full bg-gradient-to-br from-red-500 to-orange-400 shadow-lg"
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              />
              
              {/* Icon in the center */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ 
                  scale: { delay: 0.5, type: "spring", stiffness: 200 },
                  rotate: { delay: 1, duration: 2, repeat: Infinity, repeatDelay: 1 }
                }}
              >
                <FaUtensils className="text-4xl drop-shadow-lg" />
              </motion.div>
              
              {/* Decorative food elements */}
              <motion.div 
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-yellow-400 opacity-80 flex items-center justify-center text-yellow-800"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 10, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  repeatType: "reverse" 
                }}
              >
                🍕
              </motion.div>
              <motion.div 
                className="absolute -bottom-6 -left-2 w-8 h-8 rounded-full bg-red-300 opacity-80 flex items-center justify-center"
                animate={{ 
                  y: [0, 10, 0],
                  x: [0, -5, 0],
                  rotate: [0, -10, 0]
                }}
                transition={{ 
                  duration: 3.5, 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 0.5
                }}
              >
                🍔
              </motion.div>
              <motion.div 
                className="absolute top-10 -right-8 w-12 h-12 rounded-full bg-green-200 opacity-70 flex items-center justify-center text-green-800"
                animate={{ 
                  x: [0, 10, 0],
                  rotate: [0, 15, 0]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: 1
                }}
              >
                🥗
              </motion.div>
            </motion.div>
            
            <motion.h2 
              className="text-4xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Preparing Menu
            </motion.h2>
            
            <motion.p 
              className="text-gray-600 mb-8 max-w-xs mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              We're loading our delicious menu items just for you. This will only take a moment...
            </motion.p>
            
            <motion.div 
              className="max-w-xs mx-auto bg-white p-5 rounded-xl shadow-lg flex items-center gap-4 border border-red-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <motion.div 
                className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 0, 0, 180, 360],
                }}
                transition={{ 
                  scale: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                  rotate: { duration: 4, repeat: Infinity, repeatDelay: 1 }
                }}
              >
                <FaClock className="text-xl" />
              </motion.div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium">Almost ready!</p>
                <motion.div 
                  className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-2"
                >
                  <motion.div 
                    className="h-full bg-gradient-to-r from-red-500 to-red-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3 }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white via-red-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <motion.div 
            className="relative bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-red-100 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-50 rounded-full -mr-20 -mt-20 z-0"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-50 rounded-full -ml-16 -mb-16 z-0"></div>
            
            <motion.div 
              className="relative z-10 flex flex-col items-center"
            >
              <motion.div 
                className="w-28 h-28 bg-gradient-to-br from-red-50 to-red-100 rounded-full mx-auto mb-8 flex items-center justify-center relative overflow-hidden"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: 1, 
                  rotate: 0,
                  boxShadow: ["0 0 0 0px rgba(239, 68, 68, 0.2)", "0 0 0 20px rgba(239, 68, 68, 0)"]
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  boxShadow: { 
                    repeat: Infinity, 
                    duration: 2,
                    repeatDelay: 0.5
                  }
                }}
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ delay: 0.5, duration: 1, times: [0, 0.2, 0.5, 0.8, 1], repeat: 1, repeatDelay: 3 }}
                >
                  <FaInfo className="text-5xl text-red-500" />
                </motion.div>
                
                {/* Orbit animation */}
                <motion.div 
                  className="absolute w-full h-full rounded-full border-2 border-dashed border-red-200"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              
              <motion.h3 
                className="text-3xl font-bold text-gray-800 mb-3 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                  Oops! Something Went Wrong
                </span>
              </motion.h3>
              
              <motion.div 
                className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-6 text-left w-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-3 w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1"
                >
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="w-full px-6 py-3 shadow-md bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center gap-2"
                  >
                    <FaSync size={16} className="animate-spin-slow" />
                    <span>Try Again</span>
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1"
                >
                  <Button 
                    variant="secondary"
                    onClick={() => window.history.back()} 
                    className="w-full px-6 py-3 border border-gray-200"
                  >
                    Go Back
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="relative bg-white dark:bg-gray-900">
        {/* Enhanced Table Info Banner */}
        <AnimatePresence>
          {tableInfo && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="sticky top-0 z-50 shadow-lg"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-500 text-white py-3 px-4">
                <div className="container mx-auto flex items-center justify-between">
                  <motion.div 
                    className="flex items-center space-x-3"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-lg shadow-inner">
                      <FaUtensils className="text-xl" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg leading-tight">Table {tableInfo.name}</h2>
                      <p className="text-sm text-red-100">Capacity: {tableInfo.capacity} {tableInfo.capacity > 1 ? 'people' : 'person'}</p>
                    </div>
                  </motion.div>
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-white/20 backdrop-blur-sm">
                        <FaQrcode /> 
                        <span className="font-medium">Table #{tableInfo.id}</span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Subtle pattern overlay */}
              <div className="h-1 w-full bg-gradient-to-r from-red-400 to-red-200 opacity-50"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main container */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Enhanced Welcome Section with parallax effect */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 relative overflow-hidden rounded-3xl"
          >
            {/* Decorative background elements with parallax effect */}
            <motion.div 
              className="absolute -top-20 -right-20 w-64 h-64 bg-red-100 rounded-full opacity-30 -z-10 blur-2xl"
              animate={{ 
                x: [0, 10, 0], 
                y: [0, -10, 0]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
            />
            <motion.div 
              className="absolute -bottom-20 -left-20 w-56 h-56 bg-yellow-100 rounded-full opacity-30 -z-10 blur-xl"
              animate={{ 
                x: [0, -10, 0], 
                y: [0, 10, 0]
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
            />
            <motion.div 
              className="absolute top-10 left-40 w-20 h-20 bg-orange-100 rounded-full opacity-40 -z-10 blur-md"
              animate={{ 
                x: [0, 15, 0], 
                y: [0, 5, 0]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                repeatType: "reverse",
                delay: 1
              }}
            />
            
            <div className="relative px-6 py-8 bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-lg">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative"
              >
                <motion.h1 
                  className="text-4xl md:text-5xl font-bold mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <motion.span 
                    className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {tableInfo ? `Selamat Datang di Meja ${tableInfo.name}` : 'Selamat Datang'}
                  </motion.span>
                </motion.h1>
                <motion.div 
                  className="h-1.5 bg-gradient-to-r from-red-500 to-orange-400 mt-2 rounded-full w-32 md:w-48"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </motion.div>
              
              <motion.p 
                className="text-gray-600 mt-4 max-w-xl text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Lihat menu kami dan buat pesanan langsung dari meja Anda. 
                Makanan Anda akan segera disiapkan dan disajikan.
              </motion.p>
            </div>
          </motion.div>

          {/* Featured Menu section (moved from bottom) */}
          <motion.section 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="py-12 px-4 mb-10"
            viewport={{ once: true }}
          >
            <motion.div 
              variants={fadeInUp}
              className="text-center mb-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
                Menu Unggulan
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Pilihan hidangan spesial dari chef kami yang menjadi favorit pelanggan
              </p>
            </motion.div>

            <motion.div 
              className="flex md:grid md:grid-cols-3 gap-8 max-w-5xl mx-auto overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {menus.slice(0, 3).map((menu, index) => (
                <motion.div 
                  key={`featured-${menu.id}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0 min-w-[300px] w-[85vw] md:w-auto snap-center group"
                  variants={itemVariants}
                  whileHover="hover"
                  onMouseEnter={() => setHoveredMenuId(`featured-${menu.id}`)}
                  onMouseLeave={() => setHoveredMenuId(null)}
                >
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={getMenuImageUrl(menu.name, menu.imageUrl)}
                      alt={menu.name} 
                      className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `/images/menu/${menu.name.toLowerCase().replace(/\s+/g, '_')}.jpg`;
                        target.onerror = () => {
                          target.src = 'https://via.placeholder.com/300x200?text=Food+Image';
                          target.onerror = null;
                        };
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <div className="inline-block py-1 px-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 text-xs font-medium mb-2">
                      Unggulan
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{menu.name}</h3>
                    <div className="relative min-h-[4.5em]">
                      <AnimatePresence>
                        <motion.div
                          key={`featured-desc-container-${menu.id}`}
                          initial={false}
                          animate={{
                            height: hoveredMenuId === `featured-${menu.id}` ? "auto" : "4.5em"
                          }}
                          transition={{
                            duration: 0.4,
                            ease: [0.04, 0.62, 0.23, 0.98]
                          }}
                          className="overflow-hidden"
                        >
                          <motion.p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            {menu.description || 'Hidangan lezat yang disiapkan dengan bahan-bahan segar.'}
                          </motion.p>
                        </motion.div>
                      </AnimatePresence>
                      
                      <AnimatePresence>
                        {hoveredMenuId !== `featured-${menu.id}` && (
                          <motion.div 
                            key={`featured-desc-fade-${menu.id}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute bottom-0 right-0 left-0 h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent flex justify-end items-end"
                          >
                            <span className="text-xs text-gray-400 dark:text-gray-500 pr-1">...</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600 dark:text-primary-400 font-bold">{formatCurrency(menu.price)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* What Our Customers Say */}
          <motion.section 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="py-12 px-4 mb-10 bg-gray-50 dark:bg-gray-800/50 rounded-3xl"
            viewport={{ once: true }}
          >
            <motion.div 
              variants={fadeInUp}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
                Apa Kata Pelanggan Kami
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Jangan hanya percaya kata kami - lihat apa yang dikatakan pelanggan puas kami tentang makanan dan layanan kami
              </p>
            </motion.div>

            <motion.div 
              className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory"
              variants={containerVariants}
            >
              {/* Testimonial 1 */}
              <motion.div 
                variants={itemVariants}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex-shrink-0 min-w-[300px] w-[85vw] md:w-auto snap-center"
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <FaUser />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Sarah K.</h4>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 text-sm" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  "Nasi gorengnya sangat lezat! Yang terbaik yang pernah saya coba. Pelayanannya cepat dan stafnya sangat ramah. Pasti akan kembali lagi!"
                </p>
              </motion.div>

              {/* Testimonial 2 */}
              <motion.div 
                variants={itemVariants}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex-shrink-0 min-w-[300px] w-[85vw] md:w-auto snap-center"
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <FaUser />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Michael T.</h4>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={`text-sm ${i < 4 ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  "Sistem pemesanan dengan kode QR sangat praktis! Saya senang bisa melihat seluruh menu dengan gambar. Sate ayamnya dipanggang dengan sempurna."
                </p>
              </motion.div>

              {/* Testimonial 3 */}
              <motion.div 
                variants={itemVariants}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 flex-shrink-0 min-w-[300px] w-[85vw] md:w-auto snap-center"
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <FaUser />
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Lisa R.</h4>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-yellow-400 text-sm" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  "Saya sangat senang dengan kesegaran bahan-bahannya. Es teler menjadi pencuci mulut yang sempurna untuk mengakhiri makanan kami. Suasananya juga sangat nyaman!"
                </p>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Search Bar - Moved to after the featured menu section */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari hidangan, bahan, atau masakan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-14 pr-4 py-5 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300 bg-white text-gray-800"
              />
              
              {/* Search animation pulse */}
              <motion.div 
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{ 
                  boxShadow: search ? ["0 0 0 0 rgba(239, 68, 68, 0.1)", "0 0 0 6px rgba(239, 68, 68, 0)"] : "none" 
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: search ? Infinity : 0,
                  repeatType: "loop" 
                }}
              />

              {search && (
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setSearch('')}
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </motion.div>

          {/* Category filters */}
          <div className="mb-8 relative">
            <div className="overflow-x-auto pb-6 hide-scrollbar">
              <div className="flex space-x-3 min-w-max">
                {/* All Category */}
                <button
                  className={`px-5 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 ${
                    selectedCategory === 'All'
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedCategory('All')}
                >
                  <FaUtensils className="text-xs" />
                  <span className="whitespace-nowrap font-medium">Semua Menu</span>
                </button>

                {categories.map((category, index) => (
                  <button
                    key={category}
                    className={`px-5 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span className={selectedCategory === category ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>
                      {getCategoryIcon(category)}
                    </span>
                    <span className="whitespace-nowrap font-medium">{category}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Enhanced scroll indicators */}
            <div className="h-1.5 bg-gray-100 mt-3 rounded-full overflow-hidden relative mx-1">
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-red-300 via-red-400 to-red-300 rounded-full"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            
            {/* Fade edges for scroll indication */}
            <div className="absolute top-0 bottom-6 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
            <div className="absolute top-0 bottom-6 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>

          {/* Enhanced Menu Grid with improved cards */}
          {filteredMenus.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16 px-6 bg-white rounded-2xl shadow-sm border border-gray-100"
            >
              <motion.div 
                className="w-28 h-28 mx-auto bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mb-6 relative"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0] 
                }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-dashed border-red-200"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <FaSearch className="text-4xl text-red-300" />
              </motion.div>
              
              <motion.h3 
                className="text-2xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Tidak Ada Item Ditemukan
              </motion.h3>
              
              <motion.p 
                className="text-gray-500 max-w-md mx-auto mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Kami tidak dapat menemukan menu yang sesuai dengan kriteria Anda. Coba sesuaikan kata pencarian atau pilih kategori yang berbeda.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 justify-center"
              >
                <Button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('All');
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5"
                >
                  <FaSync size={14} /> Atur Ulang Filter
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-0"
            >
              {filteredMenus.map((menu, index) => (
                <motion.div 
                  key={menu.id}
                  custom={index}
                  variants={itemVariants}
                  whileHover="hover"
                  className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col h-full group ${
                    menu.status === 'OUT_OF_STOCK' ? 'opacity-75' : ''
                  }`}
                  onMouseEnter={() => setHoveredMenuId(menu.id)}
                  onMouseLeave={() => setHoveredMenuId(null)}
                  id={`menu-card-${menu.id}`}
                >
                  <div className="aspect-[4/3] sm:aspect-video w-full overflow-hidden bg-gray-100 relative">
                    {menu.status === 'OUT_OF_STOCK' && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white py-1 px-3 text-xs font-medium z-20">
                        OUT OF STOCK
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                    
                    <motion.img
                      src={getMenuImageUrl(menu.name, menu.imageUrl)}
                      alt={menu.name}
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        menu.status === 'OUT_OF_STOCK' ? 'filter grayscale' : ''
                      }`}
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.7 }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Try to get a fallback image from our menu images folder
                        const fallbackImage = `/images/menu/${menu.name.toLowerCase().replace(/\s+/g, '_')}.jpg`;
                        console.log(`[ERROR] Failed to load image for ${menu.name}, trying fallback: ${fallbackImage}`);
                        target.src = fallbackImage;
                        
                        // If that fails too, use a placeholder
                        target.onerror = () => {
                          target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                          target.onerror = null; // Prevent infinite loop
                        };
                      }}
                    />
                    
                    {/* Floating price tag */}
                    <motion.div 
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold text-red-600 shadow-lg flex items-center gap-1"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      style={{ display: menu.status === 'OUT_OF_STOCK' ? 'none' : 'flex' }}
                    >
                      <span className="text-xs text-red-500 opacity-80">Rp</span>
                      {formatCurrency(menu.price).replace('Rp', '')}
                    </motion.div>
                    
                    {/* Category badge */}
                    <motion.div
                      className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm text-white text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {menu.category || 'Uncategorized'}
                    </motion.div>
                  </div>
                  
                  <div className="p-3 sm:p-4 flex flex-col flex-grow">
                    <div className="mb-1 sm:mb-2">
                      <h3 className="font-bold text-gray-800 text-base sm:text-lg line-clamp-1 leading-tight transition-colors">
                        {menu.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
                        {menu.status !== 'OUT_OF_STOCK' && (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-green-100 text-green-800">
                            <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-green-500 mr-1"></span>
                            Tersedia
                          </span>
                        )}
                        {menu.status === 'OUT_OF_STOCK' && (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-red-100 text-red-800">
                            <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-red-500 mr-1"></span>
                            Stok Habis
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative min-h-[3em]">
                      <AnimatePresence>
                        <motion.div
                          key={`desc-container-${menu.id}`}
                          initial={false}
                          animate={{
                            height: menu.status !== 'OUT_OF_STOCK' && hoveredMenuId === menu.id 
                              ? "auto" 
                              : "3em"
                          }}
                          transition={{
                            duration: 0.4,
                            ease: [0.04, 0.62, 0.23, 0.98]
                          }}
                          className="overflow-hidden"
                        >
                          <motion.p 
                            className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 flex-grow"
                          >
                            {menu.description || 'Tidak ada deskripsi tersedia untuk menu ini.'}
                          </motion.p>
                        </motion.div>
                      </AnimatePresence>
                      
                      <AnimatePresence>
                        {(hoveredMenuId !== menu.id) && (
                          <motion.div 
                            key={`desc-fade-${menu.id}`}
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
                    
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleQuantityChange(menu.id, -1)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-500 transition-colors ${
                            menu.status === 'OUT_OF_STOCK' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={menu.status === 'OUT_OF_STOCK'}
                        >
                          <FaMinus size={10} className="sm:text-xs" />
                        </button>
                        <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">
                          {quantityMap[menu.id] || 1}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(menu.id, 1)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-500 transition-colors ${
                            menu.status === 'OUT_OF_STOCK' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={menu.status === 'OUT_OF_STOCK'}
                        >
                          <FaPlus size={10} className="sm:text-xs" />
                        </button>
                      </div>
                      
                      <motion.button
                        id={`add-to-cart-${menu.id}`}
                        onClick={() => handleAddToCart(menu, quantityMap[menu.id] || 1)}
                        disabled={menu.status === 'OUT_OF_STOCK'}
                        className={`px-2 sm:px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 transition-all ${
                          menu.status === 'OUT_OF_STOCK'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
                        }`}
                        whileHover={{ scale: menu.status === 'OUT_OF_STOCK' ? 1 : 1.05 }}
                        whileTap={{ scale: menu.status === 'OUT_OF_STOCK' ? 1 : 0.95 }}
                      >
                        <FaShoppingCart size={14} className="mr-0.5" />
                        <span className="hidden xs:inline">Add</span> to Cart
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Cart Button with enhanced animation */}
      <AnimatePresence>
        {cart.items.length > 0 && !isCheckoutOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-40"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={animateCart ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.4 }}
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-red-500 text-white p-2.5 md:p-3.5 rounded-full shadow-md flex items-center justify-center relative z-10"
              aria-label="View Cart"
            >
              <FaShoppingCart className="text-base md:text-xl" />
              <AnimatePresence mode="popLayout">
                {cartItemCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    key={cartItemCount}
                    className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-yellow-400 text-red-600 text-[10px] md:text-xs font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced Cart Popup that shows briefly when items are added */}
      <AnimatePresence>
        {showCartPopup && cart.items.length > 0 && !isCheckoutOpen && (
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-16 md:bottom-24 right-4 md:right-8 z-50 bg-red-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded text-xs md:text-sm shadow-md flex items-center gap-1.5 max-w-[150px] md:max-w-[200px]"
          >
            <FaCheckCircle className="text-xs md:text-sm" />
            <span className="font-medium">Added to cart!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The rest of the component (cart drawer, checkout, etc.) */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden"
            onClick={() => !orderSuccess && setIsCheckoutOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
              }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {orderSuccess ? (
                <SuccessView onClose={() => {
                  setOrderSuccess(false);
                  setIsCheckoutOpen(false);
                }} />
              ) : (
                <CheckoutView
                  tableInfo={tableInfo}
                  cart={cart}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  customerNameError={customerNameError}
                  setCustomerNameError={setCustomerNameError}
                  isSubmitting={isSubmitting}
                  handleSubmitOrder={handleSubmitOrder}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                  cartTotal={cartTotal}
                  onClose={() => setIsCheckoutOpen(false)}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Modal */}
      {orderSuccess && isCheckoutOpen && (
        <SuccessView onClose={() => {
          setIsCheckoutOpen(false);
          setOrderSuccess(false);
        }} />
      )}
      
      {/* New Order Success Popup */}
      <OrderSuccessPopup 
        visible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        orderItems={orderItems}
        orderTotal={orderTotal}
      />
    </Layout>
  );
}

// Checkout View Component
interface CheckoutViewProps {
  tableInfo: Table | null;
  cart: { items: CartItem[] };
  customerName: string;
  setCustomerName: (name: string) => void;
  customerNameError: string;
  setCustomerNameError: (error: string) => void;
  isSubmitting: boolean;
  handleSubmitOrder: () => void;
  updateQuantity: (menuId: number, quantity: number) => void;
  removeFromCart: (menuId: number) => void;
  cartTotal: number;
  onClose: () => void;
}

const CheckoutView: React.FC<CheckoutViewProps> = ({
  tableInfo,
  cart,
  customerName,
  setCustomerName,
  customerNameError,
  setCustomerNameError,
  isSubmitting,
  handleSubmitOrder,
  updateQuantity,
  removeFromCart,
  cartTotal,
  onClose
}) => {
  return (
    <>
      {/* Enhanced Header */}
      <motion.div 
        className="bg-gradient-to-r from-red-600 to-red-500 py-4 px-5 text-white flex items-center justify-between"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className="bg-white/20 p-2 rounded-lg"
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <FaShoppingCart className="text-white text-lg" />
          </motion.div>
                          <span className="text-xl font-bold">Checkout</span>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          className="text-white bg-white/20 p-2 rounded-full transition-colors"
          aria-label="Close"
        >
          <FaTimes size={18} />
        </motion.button>
      </motion.div>
      
      <div className="overflow-y-auto max-h-[calc(90vh-60px)] scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-transparent">
        <div className="p-6 space-y-6">
          {/* Table Info Card */}
          {tableInfo && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-red-50 rounded-xl p-4 border border-red-100 shadow-sm"
              whileHover={{ boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)" }}
            >
              <div className="flex items-center gap-4">
                <motion.div 
                  className="bg-white p-3 rounded-xl text-red-500 shadow-sm"
                  whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <FaUtensils size={22} />
                </motion.div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg">Table {tableInfo.name}</h4>
                  <p className="text-gray-600">Capacity: {tableInfo.capacity} {tableInfo.capacity > 1 ? 'people' : 'person'}</p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Customer Name Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
                          <label htmlFor="customerName" className="block text-gray-700 font-medium mb-2 flex items-center gap-2">
              <motion.div 
                className="bg-red-50 p-1.5 rounded-lg"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <FaUser className="text-red-500" size={14} />
              </motion.div>
              Nama Anda <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <motion.input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (e.target.value.trim()) setCustomerNameError('');
                }}
                placeholder="Masukkan nama Anda"
                className={`w-full px-4 py-3 border ${
                  customerNameError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                } rounded-xl bg-white text-gray-700 focus:border-red-400 focus:ring-2 focus:ring-red-400/30 outline-none transition-all`}
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              
              <AnimatePresence>
                {customerNameError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                  >
                    <FaInfo className="text-xs" /> {customerNameError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          
          {/* Order Items Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-800">
                <motion.div 
                  className="bg-red-100 p-2 rounded-lg"
                  whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <FaUtensils className="text-red-500" size={14} />
                </motion.div>
                <span className="font-bold text-lg">Item Pesanan</span>
              </div>
              <motion.span 
                className="text-sm bg-red-100 text-red-600 px-3 py-1.5 rounded-full font-medium"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
              </motion.span>
            </div>
            
            {/* Order Items List */}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto px-1 py-2 pr-2">
              <AnimatePresence>
                {cart.items.map((item, index) => (
                  <motion.div 
                    key={`item-${item.menuId}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: index * 0.05 }
                    }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-start gap-3">
                      <motion.div className="relative overflow-hidden rounded-lg">
                        <motion.img 
                          src={item.menu?.name ? getMenuImageUrl(item.menu.name, item.menu?.imageUrl || '') : 'https://via.placeholder.com/56?text=Food'} 
                          alt={item.menu?.name || 'Menu item'} 
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/56?text=Food';
                          }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        />
                      </motion.div>
                      <div>
                        <h4 className="font-medium text-gray-800">{item.menu?.name}</h4>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatCurrency(Number(item.price))} × {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-red-600 font-bold">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.2, backgroundColor: "#FEE2E2" }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.menuId, Math.max(1, item.quantity - 1))}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-500 transition-colors"
                        >
                          <FaMinus size={10} />
                        </motion.button>
                        <span className="w-6 text-center font-medium text-sm">
                          {item.quantity}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.2, backgroundColor: "#FEE2E2" }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-500 transition-colors"
                        >
                          <FaPlus size={10} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.2, color: '#ef4444' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeFromCart(item.menuId)}
                          className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Remove item"
                        >
                          <FaTrash size={14} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
          
          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-100 mt-6 shadow-sm"
            whileHover={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}
          >
                          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-3">
              <motion.div 
                className="bg-red-100 p-2 rounded-lg"
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <FaShoppingCart className="text-red-500" size={14} />
              </motion.div>
              <span className="text-lg">Ringkasan Pesanan</span>
            </h3>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-gray-600 items-center">
                <span>Subtotal</span>
                <motion.span 
                  className="font-medium"
                  initial={false}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                  key={cartTotal}
                >
                  {formatCurrency(cartTotal)}
                </motion.span>
              </div>
              <div className="flex justify-between text-gray-600 items-center">
                <span>Biaya Layanan</span>
                <span>Termasuk</span>
              </div>
              <motion.div 
                className="flex justify-between font-bold text-xl pt-4 border-t border-gray-200 mt-3"
                initial={false}
                animate={{ backgroundColor: ["rgba(254, 226, 226, 0)", "rgba(254, 226, 226, 0.3)", "rgba(254, 226, 226, 0)"] }}
                transition={{ duration: 1.5, delay: 0.2 }}
                key={cartTotal}
              >
                <span className="text-gray-800">Total</span>
                <span className="text-red-600">{formatCurrency(cartTotal)}</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
        
        {/* Place Order Button */}
        <motion.div 
          className="bg-white p-5 border-t border-gray-200 sticky bottom-0 left-0 right-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmitOrder}
            disabled={isSubmitting || cart.items.length === 0}
            className={`w-full py-4 px-4 rounded-xl font-medium text-white flex items-center justify-center gap-3 ${
              isSubmitting || cart.items.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <FaSync />
                </motion.div>
                <span className="text-base">Processing Order...</span>
              </>
            ) : (
              <>
                <FaShoppingCart size={18} />
                <span className="text-base">Place Order</span>
              </>
            )}
          </motion.button>
          
          <div className="text-center mt-3 text-sm text-gray-500">
            Dengan memesan, Anda menyetujui <span className="text-red-500">Syarat dan Ketentuan</span> kami
          </div>
        </motion.div>
      </div>
    </>
  );
};

// Enhanced Success View Component
const SuccessView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="bg-white p-8 text-center">
      <motion.div 
        className="py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Animated success icon */}
        <motion.div 
          className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.1, 1] }}
          transition={{ 
            duration: 0.6, 
            times: [0, 0.6, 1],
            type: "spring",
            stiffness: 300
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 5, 0, -5, 0] }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <FaCheckCircle className="text-green-500 text-5xl" />
          </motion.div>
        </motion.div>
        
        <motion.h2 
          className="text-3xl font-bold mb-3 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Pesanan Berhasil!
        </motion.h2>
        
        <motion.p 
          className="text-gray-600 mb-8 max-w-sm mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Pesanan Anda telah berhasil dibuat. Mohon tunggu di meja Anda sementara kami menyiapkan makanan Anda.
        </motion.p>
        
        {/* Order details with animation */}
        <motion.div 
          className="bg-gray-50 rounded-xl p-5 border border-gray-200 max-w-xs mx-auto mb-8 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}
        >
          <motion.div 
            className="flex justify-between text-sm pb-3 mb-3 border-b border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <span className="text-gray-500">Order ID:</span>
            <span className="font-medium">#KM-{Math.floor(Math.random() * 10000)}</span>
          </motion.div>
          <motion.div 
            className="flex justify-between text-sm pb-3 mb-3 border-b border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
          >
            <span className="text-gray-500">Date:</span>
            <span className="font-medium">{new Date().toLocaleDateString()}</span>
          </motion.div>
          <motion.div 
            className="flex justify-between text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            <span className="text-gray-500">Status:</span>
            <span className="text-green-500 font-medium flex items-center gap-1">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, 0, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                <FaCheckCircle size={14} />
              </motion.div>
              Confirmed
            </span>
          </motion.div>
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          whileHover={{ scale: 1.05, backgroundColor: "#e11d48" }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="px-8 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors shadow-lg"
        >
          Back to Menu
        </motion.button>
      </motion.div>
    </div>
  );
};

export default OrderPage; 