import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MenuAPI, OrderAPI, TableAPI } from '../../api';
import { useCartStore } from '../../store';
import type { Menu, CartItem, Table } from '../../types';
import type { CreateOrderItem } from '../../types/order';
import { OrderStatus } from '../../types';
import Layout from '../../components/Layout';
import { getMenuImageUrl } from '../../utils/imageHelper';
import Button from '../../components/Button';
import { FaSearch, FaPlus, FaMinus, FaShoppingCart, FaTimes, FaUtensils, FaInfo, FaUser, FaQrcode, FaHeart, FaClock, FaCheckCircle, FaCookieBite, FaSync, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import MenuCustomizationModal from '../../components/MenuCustomizationModal';
import { useAlert } from '../../contexts/AlertContext';

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
      
      clearCart();
      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        setIsCheckoutOpen(false);
      }, 3000);
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
    
    // Create flying animation effect
    const flyingItem = document.createElement('div');
    flyingItem.className = 'fixed z-50 pointer-events-none';
    flyingItem.style.width = '50px';
    flyingItem.style.height = '50px';
    flyingItem.style.borderRadius = '12px';
    flyingItem.style.backgroundColor = '#fff';
    flyingItem.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    flyingItem.style.display = 'flex';
    flyingItem.style.alignItems = 'center';
    flyingItem.style.justifyContent = 'center';
    flyingItem.style.overflow = 'hidden';
    flyingItem.style.border = '1px solid #f1f1f1';
    
    // Create image element for the menu item
    const img = document.createElement('img');
    img.src = getMenuImageUrl(menu.name, menu.image);
    img.alt = menu.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    // Add error handling for the image
    img.onerror = () => {
      img.src = 'https://via.placeholder.com/50?text=Food';
    };
    
    flyingItem.appendChild(img);
    
    // Position the flying item at the clicked position
    const rect = document.getElementById(`add-to-cart-${menu.id}`)?.getBoundingClientRect();
    if (rect) {
      flyingItem.style.top = `${rect.top + rect.height/2 - 25}px`;
      flyingItem.style.left = `${rect.left + rect.width/2 - 25}px`;
      document.body.appendChild(flyingItem);
      
      // Get the cart button position
      const cartButton = document.querySelector('.fixed.bottom-6.right-6');
      if (cartButton) {
        const cartRect = cartButton.getBoundingClientRect();
        const destinationX = cartRect.left + cartRect.width / 2 - 25;
        const destinationY = cartRect.top + cartRect.height / 2 - 25;
        
        // Create a curved path for the animation
        const controlX = window.innerWidth > 768 
          ? rect.left + (destinationX - rect.left) * 0.5 - 100
          : rect.left + (destinationX - rect.left) * 0.5;
        const controlY = rect.top + (destinationY - rect.top) * 0.3;
        
        // Animate the flying item along a curved path
        let start: number | null = null;
        const duration = 800; // animation duration in ms
        
        const animateFrame = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = (timestamp - start) / duration;
          
          if (progress < 1) {
            // Bezier curve calculation for smoother animation
            const t = progress;
            const u = 1 - t;
            const tt = t * t;
            const uu = u * u;
            const uuu = uu * u;
            const ttt = tt * t;
            
            // Quadratic bezier curve formula
            const x = uuu * rect.left + 3 * uu * t * controlX + 3 * u * tt * destinationX + ttt * destinationX;
            const y = uuu * rect.top + 3 * uu * t * controlY + 3 * u * tt * destinationY + ttt * destinationY;
            
            // Apply position
            flyingItem.style.left = `${x}px`;
            flyingItem.style.top = `${y}px`;
            
            // Apply scaling and rotation
            const scale = 1 - (0.7 * progress);
            const rotate = progress * 360;
            flyingItem.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
            
            // Apply opacity
            if (progress > 0.7) {
              flyingItem.style.opacity = `${(1 - progress) * 3}`;
            }
            
            requestAnimationFrame(animateFrame);
          } else {
            // Remove the flying item after animation
            document.body.removeChild(flyingItem);
          }
        };
        
        // Start the animation
        requestAnimationFrame(animateFrame);
      } else {
        document.body.removeChild(flyingItem);
      }
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
    
    // Close modal
    setIsCustomizationModalOpen(false);
    setSelectedMenu(null);
    
    // Create flying animation effect for customized items
    const flyingItem = document.createElement('div');
    flyingItem.className = 'fixed z-50 pointer-events-none';
    flyingItem.style.width = '50px';
    flyingItem.style.height = '50px';
    flyingItem.style.borderRadius = '12px';
    flyingItem.style.backgroundColor = '#fff';
    flyingItem.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    flyingItem.style.display = 'flex';
    flyingItem.style.alignItems = 'center';
    flyingItem.style.justifyContent = 'center';
    flyingItem.style.overflow = 'hidden';
    flyingItem.style.border = '1px solid #f1f1f1';
    
    // Create image element for the menu item
    const img = document.createElement('img');
    img.src = getMenuImageUrl(selectedMenu.name, selectedMenu.image);
    img.alt = selectedMenu.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    // Add error handling for the image
    img.onerror = () => {
      img.src = 'https://via.placeholder.com/50?text=Food';
    };
    
    flyingItem.appendChild(img);
    
    // Position the flying item at the center of the screen
    flyingItem.style.top = `${window.innerHeight / 2 - 25}px`;
    flyingItem.style.left = `${window.innerWidth / 2 - 25}px`;
    document.body.appendChild(flyingItem);
    
    // Get the cart button position
    const cartButton = document.querySelector('.fixed.bottom-6.right-6');
    if (cartButton) {
      const cartRect = cartButton.getBoundingClientRect();
      const startX = window.innerWidth / 2 - 25;
      const startY = window.innerHeight / 2 - 25;
      const destinationX = cartRect.left + cartRect.width / 2 - 25;
      const destinationY = cartRect.top + cartRect.height / 2 - 25;
      
      // Create a curved path for the animation
      const controlX = startX + (destinationX - startX) * 0.5 - 50;
      const controlY = startY + (destinationY - startY) * 0.3;
      
      // Animate the flying item along a curved path
      let start: number | null = null;
      const duration = 800; // animation duration in ms
      
      const animateFrame = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = (timestamp - start) / duration;
        
        if (progress < 1) {
          // Bezier curve calculation for smoother animation
          const t = progress;
          const u = 1 - t;
          const tt = t * t;
          const uu = u * u;
          const uuu = uu * u;
          const ttt = tt * t;
          
          // Quadratic bezier curve formula
          const x = uuu * startX + 3 * uu * t * controlX + 3 * u * tt * destinationX + ttt * destinationX;
          const y = uuu * startY + 3 * uu * t * controlY + 3 * u * tt * destinationY + ttt * destinationY;
          
          // Apply position
          flyingItem.style.left = `${x}px`;
          flyingItem.style.top = `${y}px`;
          
          // Apply scaling and rotation
          const scale = 1 - (0.7 * progress);
          const rotate = progress * 360;
          flyingItem.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
          
          // Apply opacity
          if (progress > 0.7) {
            flyingItem.style.opacity = `${(1 - progress) * 3}`;
          }
          
          requestAnimationFrame(animateFrame);
        } else {
          // Remove the flying item after animation
          document.body.removeChild(flyingItem);
        }
      };
      
      // Start the animation
      requestAnimationFrame(animateFrame);
    } else {
      document.body.removeChild(flyingItem);
    }
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
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-red-50">
          <div className="text-center p-8 rounded-2xl max-w-md">
            <motion.div 
              className="relative mx-auto w-32 h-32 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div 
                className="absolute inset-0 rounded-full bg-red-100"
                animate={{ scale: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  className="w-20 h-20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <FaUtensils className="text-5xl text-red-500 opacity-80" />
                </motion.div>
              </motion.div>
            </motion.div>
            
            <motion.h3 
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Preparing Menu
            </motion.h3>
            
            <motion.p 
              className="text-gray-600 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              Loading our delicious items just for you...
            </motion.p>
            
            <motion.div 
              className="max-w-xs mx-auto bg-white p-3 rounded-lg shadow-sm flex items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                <FaClock className="text-red-500" />
              </div>
              <p className="text-sm text-gray-600">This will only take a moment</p>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-red-50 p-4">
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto border-t-4 border-red-500"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-20 h-20 bg-red-50 rounded-full mx-auto mb-6 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, 0] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1] }}
            >
              <FaInfo className="text-3xl text-red-500" />
            </motion.div>
            
            <motion.h3 
              className="text-xl font-bold text-gray-800 mb-2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Oops! Something Went Wrong
            </motion.h3>
            
            <motion.p 
              className="text-red-500 mb-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {error}
            </motion.p>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 shadow-md"
              >
                Try Again
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
        {/* Enhanced Table Info Banner */}
        <AnimatePresence>
          {tableInfo && (
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="sticky top-0 z-50 shadow-lg"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4">
                <div className="container mx-auto flex items-center justify-between">
                  <motion.div 
                    className="flex items-center space-x-3"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg shadow-inner">
                      <FaUtensils className="text-xl" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg leading-tight">Table {tableInfo.name}</h2>
                      <p className="text-sm text-red-100">Capacity: {tableInfo.capacity} {tableInfo.capacity > 1 ? 'people' : 'person'}</p>
                    </div>
                  </motion.div>
                  <div className="flex items-center space-x-3">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="light"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm backdrop-blur-sm"
                      >
                        <FaQrcode /> Table #{tableInfo.id}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Subtle pattern overlay */}
              <div className="h-1 w-full bg-gradient-to-r from-red-400 to-red-200 opacity-50"></div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto px-4 py-6">
          {/* Enhanced Welcome Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 relative"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-200 rounded-full opacity-20 -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-200 rounded-full opacity-10 -z-10"></div>
            
            <motion.h1 
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 mb-2 pb-2 inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {tableInfo ? `Welcome to Table ${tableInfo.name}` : 'Welcome'}
              <div className="h-1 bg-gradient-to-r from-red-400 to-orange-300 mt-2 rounded-full w-3/4"></div>
            </motion.h1>
            
            <motion.p 
              className="text-gray-600 mb-6 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Browse our menu and place your order directly from your table. Your food will be prepared and served to you shortly.
            </motion.p>
            
            <motion.div 
              className="relative mb-4"
              whileHover={{ scale: 1.01 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.3,
                type: "spring", 
                stiffness: 400, 
                damping: 10 
              }}
            >
                <input
                  type="text"
                placeholder="Search for dishes, ingredients, or cuisine..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400">
                <FaSearch className="text-lg" />
              </div>
            </motion.div>
          </motion.div>

          {/* Enhanced Categories */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-3">
              <motion.h2 
                className="text-lg font-semibold text-gray-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Categories
              </motion.h2>
              {categories.length > 0 && (
                <motion.p 
                  className="text-sm text-gray-500"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {categories.length} categories available
                </motion.p>
              )}
            </div>
            
            <div className="overflow-x-auto scrollbar-hide pb-2">
              <div className="flex gap-2 pb-1 flex-nowrap">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-2 shadow-sm ${
                    selectedCategory === 'All'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-red-50 border border-gray-100'
                  }`}
                >
                  <span className={selectedCategory === 'All' ? 'text-white' : 'text-red-500'}>🍽️</span>
                  <span>All Items</span>
                </motion.button>
                
                {categories.map((category, index) => (
                  <motion.button
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-2 shadow-sm ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-red-50 border border-gray-100'
                    }`}
                  >
                    <span className={selectedCategory === category ? 'text-white' : 'text-red-500'}>
                      {getCategoryIcon(category)}
                    </span>
                    <span>{category}</span>
                  </motion.button>
                ))}
              </div>
              
              {/* Category scroll indicator */}
              <div className="h-1 bg-gray-100 mt-2 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-red-300 rounded-full"
                  initial={{ width: '10%' }}
                  animate={{ width: ['10%', '100%', '10%'] }}
                  transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
                />
              </div>
            </div>
          </motion.div>

          {/* Enhanced Menu Grid */}
          {filteredMenus.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16 px-4 bg-white rounded-xl shadow-sm border border-gray-100"
              >
              <motion.div 
                className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0] 
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <FaSearch className="text-3xl text-red-200" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Items Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">We couldn't find any menu items matching your search. Try a different search term or browse by category.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredMenus.map((menu, index) => (
                <motion.div 
                  key={menu.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + (index % 8) * 0.05 }}
                  whileHover={{ 
                    y: -5, 
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)"
                  }}
                  className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group ${menu.status === 'OUT_OF_STOCK' ? 'opacity-80' : ''}`}
                >
                  <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
                    {menu.status === 'OUT_OF_STOCK' && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-40">
                        <div className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg transform -rotate-12 shadow-lg border-2 border-white">
                          OUT OF STOCK
                        </div>
                      </div>
                    )}
                    <motion.img
                      src={getMenuImageUrl(menu.name, menu.image)}
                      alt={menu.name}
                      className={`w-full h-full object-cover ${menu.status === 'OUT_OF_STOCK' ? 'filter grayscale' : ''}`}
                      initial={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6 }}
                      onError={(e) => {
                        console.log(`[ERROR] Failed to load image for ${menu.name}`);
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-red-500 shadow-sm">
                      {formatCurrency(menu.price)}
                    </div>
                    
                    <motion.div 
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2"
                      initial={{ y: 10 }}
                      whileHover={{ y: 0 }}
                    >
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-red-500 shadow-md"
                      >
                        <FaHeart />
                      </motion.button>
                    </motion.div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <motion.h3 
                          className="font-bold text-gray-800 line-clamp-1 leading-tight group-hover:text-red-600 transition-colors"
                          whileHover={{ x: 3 }}
                          transition={{ type: "spring", stiffness: 700 }}
                        >
                          {menu.name}
                        </motion.h3>
                        {menu.status === 'OUT_OF_STOCK' && (
                          <span className="text-xs mt-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full inline-flex items-center w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span>
                            Out of stock
                          </span>
                        )}
                        {menu.status === 'AVAILABLE' && (
                          <span className="text-xs mt-1 px-2 py-0.5 bg-green-100 text-green-600 rounded-full inline-flex items-center w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
                            Available
                          </span>
                        )}
                      </div>
                      {menu.category && (
                        <span className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-lg flex items-center">
                          {getCategoryIcon(menu.category)} <span className="ml-1">{menu.category}</span>
                        </span>
                      )}
                  </div>
                    
                    <p className="text-gray-600 text-sm mb-4 h-10 line-clamp-2">{menu.description || "No description available"}</p>
                    
                    <div className="bg-gray-50 -mx-4 -mb-4 p-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex items-center border rounded-lg overflow-hidden flex-1 ${
                            menu.status === 'OUT_OF_STOCK' 
                              ? 'bg-gray-100 opacity-60' 
                              : 'bg-white shadow-sm'
                          }`}>
                          <motion.button
                            whileTap={{ scale: menu.status === 'OUT_OF_STOCK' ? 1 : 0.9 }}
                      onClick={() => handleQuantityChange(menu.id, -1)}
                            className="px-3 py-2 hover:bg-gray-100 transition-colors"
                            disabled={quantityMap[menu.id] <= 1 || menu.status === 'OUT_OF_STOCK'}
                          >
                            <FaMinus className={`${
                              quantityMap[menu.id] <= 1 || menu.status === 'OUT_OF_STOCK' 
                                ? 'text-gray-300' 
                                : 'text-gray-500'
                            }`} />
                          </motion.button>
                          <motion.span 
                            className={`flex-1 text-center font-medium ${
                              menu.status === 'OUT_OF_STOCK'
                                ? 'text-gray-400'
                                : 'text-gray-700'
                            }`}
                            key={quantityMap[menu.id] || 1}
                            initial={{ scale: 1.2 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            {quantityMap[menu.id] || 1}
                          </motion.span>
                                                                                 <motion.button
                            whileTap={{ scale: menu.status === 'OUT_OF_STOCK' ? 1 : 0.9 }}
                      onClick={() => handleQuantityChange(menu.id, 1)}
                            className="px-3 py-2 hover:bg-gray-100 transition-colors"
                            disabled={menu.status === 'OUT_OF_STOCK'}
                    >
                            <FaPlus className={menu.status === 'OUT_OF_STOCK' ? 'text-gray-300' : 'text-gray-500'} />
                          </motion.button>
                        </div>
                      </div>
                      
                      <motion.div
                        whileHover={{ scale: menu.status === 'OUT_OF_STOCK' ? 1 : 1.02 }}
                        whileTap={{ scale: menu.status === 'OUT_OF_STOCK' ? 1 : 0.98 }}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + (index % 8) * 0.05 }}
                      >
                    <Button
                          variant={menu.status === 'OUT_OF_STOCK' ? "secondary" : "primary"}
                          onClick={() => handleAddToCart(menu, quantityMap[menu.id] || 1)}
                          className={`w-full py-2.5 flex items-center justify-center gap-2 text-sm ${
                            menu.status === 'OUT_OF_STOCK' 
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-red-500 to-red-600 shadow-md'
                          }`}
                          disabled={menu.status === 'OUT_OF_STOCK'}
                        >
                          {menu.status === 'OUT_OF_STOCK' ? (
                            <>❌ Not Available</>
                          ) : (
                            <><FaShoppingCart /> Add to Cart</>
                          )}
                    </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          </div>

        {/* Enhanced Cart Modal */}
        <AnimatePresence>
          {isCheckoutOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsCheckoutOpen(false);
              }}
            >
              <motion.div 
                initial={{ y: 50, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto mx-4 my-8"
              >
                {orderSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-br from-green-50 to-white p-8 text-center"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mt-10 -mr-10 opacity-50" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-100 rounded-full -mb-8 -ml-8 opacity-30" />
                    
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.6, times: [0, 0.6, 1] }}
                      className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10"
                    >
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <motion.path 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2.5" 
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                    
                    <motion.h3 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-2xl font-bold text-gray-800 mb-3 relative z-10"
                    >
                      Order Confirmed!
                    </motion.h3>
                    
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="text-gray-600 mb-8 max-w-xs mx-auto relative z-10"
                    >
                      Your order has been placed successfully and is being prepared. It will be served to your table shortly.
                    </motion.p>
                    
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="relative z-10"
                    >
                      <Button
                        variant="primary"
                        className="px-8 py-3 shadow-lg bg-gradient-to-r from-green-500 to-green-600"
                        onClick={() => {
                          setOrderSuccess(false);
                          setIsCheckoutOpen(false);
                        }}
                      >
                        Back to Menu
                      </Button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <div className="bg-white shadow-xl">
                    <div className="relative bg-gradient-to-r from-red-600 to-red-700 pt-6 pb-5 px-6 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <FaShoppingCart className="text-yellow-300" /> Your Order
                        </h3>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsCheckoutOpen(false)} 
                          className="bg-white/20 text-white p-1.5 rounded-full hover:bg-white/30 transition-colors"
                        >
                          <FaTimes size={16} />
                        </motion.button>
                      </div>
                      
                      <div className="absolute -bottom-4 inset-x-0 h-5 bg-white rounded-t-3xl"></div>
                    </div>
                    
                    <div className="px-6 pt-8 pb-4">
                      {tableInfo && (
                        <motion.div 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-3 mb-4 flex items-center gap-3 shadow-sm"
                        >
                          <div className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm">
                            <FaUtensils className="text-red-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">Table {tableInfo.name}</h4>
                            <p className="text-xs text-gray-500">Capacity: {tableInfo.capacity} {tableInfo.capacity > 1 ? 'people' : 'person'}</p>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Customer Name Input with animation */}
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mb-4"
                      >
                        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                          Your Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaUser className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="customerName"
                            value={customerName}
                            onChange={(e) => {
                              setCustomerName(e.target.value);
                              if (e.target.value.trim()) setCustomerNameError('');
                            }}
                            placeholder="Enter your name"
                            className={`w-full pl-10 pr-4 py-2.5 border ${
                              customerNameError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                            } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300`}
                          />
                        </div>
                        <AnimatePresence>
                          {customerNameError && (
                            <motion.p 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-1.5 text-sm text-red-500 flex items-center"
                            >
                              <FaInfo className="mr-1 text-xs" /> {customerNameError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                        
                      <div className="mb-1">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                          <span>Order Items</span>
                          <span className="text-xs bg-red-50 text-red-500 rounded-full px-2.5 py-1">
                            {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </h4>
                      </div>
                      
                      {cart.items.length === 0 ? (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="text-center py-10 px-4 bg-gray-50 rounded-xl mb-4"
                        >
                          <motion.div 
                            animate={{ 
                              rotate: [0, 10, -10, 0],
                              y: [0, -5, 0, -5, 0]
                            }}
                            transition={{ 
                              duration: 4, 
                              repeat: Infinity,
                              repeatType: "reverse" 
                            }}
                            className="mx-auto w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm"
                          >
                            <FaShoppingCart className="text-gray-300 text-2xl" />
                          </motion.div>
                          <h4 className="text-gray-700 font-medium mb-2">Your Cart is Empty</h4>
                          <p className="text-gray-500 text-sm mb-4">Add some delicious items from the menu to place an order</p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-red-500 font-medium hover:text-red-600 inline-flex items-center gap-1 border-b border-red-200"
                            onClick={() => setIsCheckoutOpen(false)}
                          >
                            Browse Menu
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </motion.button>
                        </motion.div>
                      ) : (
                        <div className="space-y-3 mb-5 pb-2">
                          <AnimatePresence>
                            {cart.items.map((item) => (
                              <motion.div 
                                key={item.menuId}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm"
                              >
                                {item.menu?.name && (
                                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                    <img 
                                      src={item.menu?.name ? getMenuImageUrl(item.menu.name, item.menu?.image || '') : 'https://via.placeholder.com/56?text=Food'} 
                                      alt={item.menu?.name || 'Menu item'} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        if (item.menu?.name) {
                                          console.log(`[ERROR] Failed to load cart image for ${item.menu.name}`);
                                        }
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://via.placeholder.com/56?text=Food';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-gray-800 truncate text-sm">{item.menu?.name}</h4>
                                    <p className="font-medium text-red-500 text-sm">
                                      {formatCurrency(Number(item.price) * item.quantity)}
                                    </p>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <div className="flex items-center text-xs text-gray-600">
                                      <span>{formatCurrency(Number(item.price))} × {item.quantity}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                         <motion.button
                                           whileHover={{ backgroundColor: "#f3f4f6" }}
                                           whileTap={{ scale: 0.9 }}
                                           onClick={() => updateQuantity(item.menuId, Math.max(1, item.quantity - 1))}
                                           className="px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 transition-colors"
                                           disabled={item.quantity <= 1}
                                         >
                                           <FaMinus size={8} className={item.quantity <= 1 ? "text-gray-300" : ""} />
                                         </motion.button>
                                        <motion.span 
                                          key={item.quantity}
                                          initial={{ scale: 1.2 }}
                                          animate={{ scale: 1 }}
                                          className="px-2 py-0.5 bg-white text-gray-800 min-w-[24px] text-center text-xs"
                                        >
                                          {item.quantity}
                                        </motion.span>
                                         <motion.button
                                           whileHover={{ backgroundColor: "#f3f4f6" }}
                                           whileTap={{ scale: 0.9 }}
                                           onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                                           className="px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 transition-colors"
                                         >
                                           <FaPlus size={8} />
                                         </motion.button>
                                      </div>
                                      <motion.button
                                        whileHover={{ scale: 1.1, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => removeFromCart(item.menuId)}
                                        className="ml-1 p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors"
                                        aria-label="Remove item"
                                      >
                                        <FaTrash size={10} />
                                      </motion.button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                    
                    {cart.items.length > 0 && (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="border-t border-gray-100 px-6 py-5 bg-gradient-to-b from-white to-gray-50"
                      >
                        <div className="space-y-2 mb-5">
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(cartTotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Service Charge</span>
                            <span className="text-gray-700">Included</span>
                          </div>
                          <motion.div 
                            className="flex justify-between font-bold text-xl text-gray-900 pt-2 border-t border-dashed border-gray-200"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                          >
                            <span>Total</span>
                            <span className="text-red-600">{formatCurrency(cartTotal)}</span>
                          </motion.div>
                        </div>
                        
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            variant="primary"
                            className="w-full py-3.5 text-center font-semibold bg-gradient-to-r from-red-500 to-red-600 shadow-lg tracking-wide rounded-xl text-base flex items-center justify-center gap-2"
                            onClick={handleSubmitOrder}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing Order...
                              </span>
                            ) : (
                              <>
                                <FaCheckCircle size={18} />
                                Place Order
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Mobile Cart Floating Button */}
        <AnimatePresence>
          {cart.items.length > 0 && !isCheckoutOpen && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-36 right-6 z-40"
            >
              <motion.div
                className="relative flex items-center shadow-xl"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mr-2 bg-white dark:bg-gray-800 py-3 px-5 rounded-l-2xl shadow-md flex items-center border border-gray-100 dark:border-gray-700"
                >
                  <motion.span 
                    key={cartTotal}
                    initial={{ scale: 1 }}
                    animate={{ scale: animateCart ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    className="font-bold text-red-600 dark:text-red-400 mr-2"
                  >
                    {formatCurrency(cartTotal)}
                  </motion.span>
                  <motion.div 
                    className="text-xs bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full px-2.5 py-1 flex items-center"
                    key={cartItemCount}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <span className="font-medium">{cartItemCount}</span>
                    <span className="ml-1">{cartItemCount === 1 ? 'item' : 'items'}</span>
                  </motion.div>
                </motion.div>
              
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 8px 20px -5px rgba(239, 68, 68, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  animate={animateCart ? { 
                    scale: [1, 1.15, 1], 
                    rotate: [0, 10, -5, 0],
                    boxShadow: [
                      "0 4px 6px -1px rgba(239, 68, 68, 0.1)",
                      "0 10px 15px -2px rgba(239, 68, 68, 0.4)",
                      "0 4px 6px -1px rgba(239, 68, 68, 0.1)"
                    ]
                  } : {}}
                  transition={{ 
                    duration: 0.4,
                    ease: "easeOut"
                  }}
                  onClick={() => setIsCheckoutOpen(true)}
                  className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-center relative z-10"
                >
                  <div className="flex items-center gap-2">
                    <FaShoppingCart size={22} />
                    <span className="font-medium text-sm inline">View Cart</span>
                  </div>
                  <AnimatePresence>
                    {cartItemCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ 
                          scale: 1,
                          y: animateCart ? [0, -3, 0] : 0
                        }}
                        exit={{ scale: 0 }}
                        key={cartItemCount}
                        transition={{ 
                          scale: { type: "spring", stiffness: 500, damping: 15 },
                          y: { duration: 0.4, ease: "easeOut" }
                        }}
                        className="absolute -top-2 -right-2 bg-yellow-400 text-red-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md border border-yellow-300"
                      >
                        {cartItemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                
                {/* Enhanced ripple effect */}
                {animateCart && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    initial={{ boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)" }}
                    animate={{ 
                      boxShadow: ["0 0 0 0 rgba(239, 68, 68, 0.7)", "0 0 0 15px rgba(239, 68, 68, 0)"]
                    }}
                    transition={{ 
                      duration: 0.7,
                      ease: "easeOut",
                      times: [0, 1],
                      repeat: 1,
                      repeatDelay: 0.1
                    }}
                  />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Popup that shows briefly when items are added */}
        <AnimatePresence>
          {showCartPopup && cart.items.length > 0 && !isCheckoutOpen && (
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-48 right-6 left-6 sm:left-auto sm:w-96 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, -15, 15, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <FaShoppingCart className="text-yellow-300" />
                  </motion.div>
                  <span className="font-semibold">Added to Cart</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCartPopup(false)}
                  className="text-white/80 hover:text-white"
                >
                  <FaTimes size={16} />
                </motion.button>
              </div>
              
              <div className="p-4 max-h-60 overflow-y-auto">
                {cart.items.slice(-3).map((item, index) => (
                  <motion.div 
                    key={`popup-${item.menuId}`} 
                    className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {item.menu?.name && (
                      <motion.div 
                        className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-sm"
                        whileHover={{ scale: 1.05 }}
                      >
                        <img 
                          src={item.menu?.name ? getMenuImageUrl(item.menu.name, item.menu?.image || '') : 'https://via.placeholder.com/56?text=Food'} 
                          alt={item.menu?.name || 'Menu item'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (item.menu?.name) {
                              console.log(`[ERROR] Failed to load cart image for ${item.menu.name}`);
                            }
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/56?text=Food';
                          }}
                        />
                      </motion.div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.menu?.name}</p>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatCurrency(item.price)} × {item.quantity}</span>
                        <span className="font-medium text-red-500">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </span>
                      </div>
                      {/* Show customizations if any */}
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <div className="mt-1 text-xs text-gray-500">
                          <span className="italic">
                            {Object.entries(item.customizations)
                              .map(([key, values]) => `${key}: ${values.join(', ')}`)
                              .join(' • ')
                              .slice(0, 35)}
                            {Object.entries(item.customizations).map(([key, values]) => key + values.join(', ')).join('').length > 35 ? '...' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {cart.items.length > 3 && (
                  <motion.p 
                    className="text-center text-sm text-gray-500 mt-2 py-1 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    +{cart.items.length - 3} more items
                  </motion.p>
                )}
              </div>
              
              <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <motion.p 
                    className="font-bold text-red-600"
                    key={cartTotal}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {formatCurrency(cartTotal)}
                  </motion.p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowCartPopup(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 flex items-center gap-2"
                  >
                    <FaShoppingCart size={14} />
                    View Order
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MenuCustomizationModal */}
        {selectedMenu && (
          <MenuCustomizationModal
            menu={selectedMenu}
            isOpen={isCustomizationModalOpen}
            onClose={() => setIsCustomizationModalOpen(false)}
            onAddToCart={handleCustomizationSubmit}
          />
        )}

        {/* Add refresh button */}
        <div className="absolute top-2 right-2">
          <button 
            onClick={() => {
              setIsLoading(true);
              // Use setTimeout to ensure loading indicator shows before fetch starts
              setTimeout(() => {
                fetchData().finally(() => setIsLoading(false));
              }, 100);
            }}
            className="bg-red-500 text-white p-2 rounded-full shadow hover:bg-red-600 transition-colors"
            title="Refresh menu"
          >
            <FaSync className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </Layout>
  );
};

// Helper function to format currency
function formatCurrency(amount: number): string {
  console.log(`Formatting currency: ${amount}`);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  console.log(`Formatted currency result: ${formatted}`);
  return formatted;
}

export default OrderPage; 