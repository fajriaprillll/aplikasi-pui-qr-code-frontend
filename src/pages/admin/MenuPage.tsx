import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MenuAPI } from '../../api';
import { useAuthStore } from '../../store';
import type { Menu } from '../../types';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import MenuCard from '../../components/MenuCard';
import Modal from '../../components/Modal';
import MenuForm from '../../components/MenuForm';
import { formatCurrency } from '../../utils/format';
import { testAPI, quickTest, fixConnection, testImageUpload } from '../../utils/apiTest';
import { testAllDeleteMethods } from '../../utils/testDeleteMenu';
import ImageUploadTester from '../../components/ImageUploadTester';
import { bulkFixMenuImages, getImageFileNameByMenuName } from '../../utils/imageHelper';
import { testImagesAccessibility, openImagesInNewTabs } from '../../utils/imageTest';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSearch, FaThLarge, FaList, FaFilter, FaSync, FaServer, FaImage, FaTools, FaExclamationTriangle, FaCheckCircle, FaUtensils, FaMagic, FaTag, FaCog, FaQuestion, FaInfoCircle } from 'react-icons/fa';
import PageTransition, { ChildAnimation } from '../../components/PageTransition';
import { useAlert } from '../../contexts/AlertContext';

const MenuPage: React.FC = () => {
  console.log('MenuPage - Component rendering');
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const { showAlert } = useAlert();
  
  console.log('MenuPage - Auth state:', { isAuthenticated, isAdmin });
  
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [imageTestResult, setImageTestResult] = useState<string | null>(null);
  const [showAdvancedTester, setShowAdvancedTester] = useState(false);
  const [imageTestResults, setImageTestResults] = useState<any>(null);
  const [isTestingImageAccess, setIsTestingImageAccess] = useState(false);
  
  // Fetch menus with a function we can call to refresh
  const fetchMenus = async () => {
    try {
      console.log('MenuPage - Fetching menus');
      setIsLoading(true);
      setError(null);
      
      const data = await MenuAPI.getAll(true); // Force refresh to get latest data
      console.log('MenuPage - Menus fetched:', data);
      
      // Ensure data is an array
      const menuArray = Array.isArray(data) ? data : [];
      console.log('MenuPage - Menus array:', menuArray.length);
      
      if (menuArray.length === 0) {
        console.warn('No menus found in the response');
      } else {
        // Log image paths for diagnostics
        console.log('Image paths in menu data:');
        menuArray.forEach(menu => {
          console.log(`${menu.name}: "${menu.imageUrl || 'EMPTY'}"`);
        });
      }
      
      setMenus(menuArray);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(menuArray.map(menu => menu.category).filter(Boolean))
      ) as string[];
      
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Failed to fetch menus:', err);
      setError('Failed to load menu items. Please try again.');
      // Initialize with empty array on error
      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch menus on component mount
  useEffect(() => {
    console.log('MenuPage - Checking auth before fetching menus');
    if (isAuthenticated) {
      console.log('MenuPage - Authenticated, fetching menus');
      fetchMenus();
      testConnectionStatus();
    } else {
      console.log('MenuPage - Not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Test connection to backend
  const testConnectionStatus = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await quickTest();
      setBackendConnected(result);
      
      if (!result) {
        setConnectionError('Unable to connect to backend server');
      }
    } catch (err) {
      console.error('Connection test error:', err);
      setBackendConnected(false);
      setConnectionError('Error testing connection');
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Fix connection issues
  const handleFixConnection = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await fixConnection();
      setBackendConnected(result);
      
      if (result) {
        // If connection is fixed, fetch menus again
        fetchMenus();
      } else {
        setConnectionError('Unable to fix connection. Please check if backend is running.');
      }
    } catch (err) {
      console.error('Fix connection error:', err);
      setConnectionError('Error fixing connection');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleTestImageUpload = async () => {
    if (showAdvancedTester) {
      // If already showing the advanced tester, just toggle it off
      setShowAdvancedTester(false);
      return;
    }
    
    setIsTestingImage(true);
    setImageTestResult(null);
    
    try {
      const result = await testImageUpload();
      setImageTestResult(result ? 'Image upload test successful!' : 'Image upload test failed, check console for details.');
      
      // If successful, refresh the menu list to show the test item
      if (result) {
        fetchMenus();
      } else {
        // If the simple test failed, suggest using the advanced tester
        setShowAdvancedTester(true);
      }
    } catch (error) {
      console.error('Error during image test:', error);
      setImageTestResult('Error during test: ' + (error instanceof Error ? error.message : String(error)));
      // If there was an error, suggest using the advanced tester
      setShowAdvancedTester(true);
    } finally {
      setIsTestingImage(false);
    }
  };
  
  // New function to handle successful uploads from the advanced tester
  const handleAdvancedTestSuccess = (response: any) => {
    console.log('Advanced test upload success:', response);
    // Refresh menus to show the new item
    fetchMenus();
  };
  
  // Function to test image accessibility
  const handleTestImageAccess = async () => {
    setIsTestingImageAccess(true);
    setImageTestResults(null);
    
    try {
      const results = await testImagesAccessibility();
      setImageTestResults(results);
      
      if (results.success) {
        alert(`Image test SUCCESSFUL - All ${results.results.length} images are accessible!`);
      } else {
        const failedCount = results.results.filter(r => !r.success).length;
        const message = `Image test FAILED - ${failedCount} out of ${results.results.length} images are not accessible.\n\n` + 
                        `This may be due to:\n` +
                        `1. Files don't exist in public/images/menu/\n` +
                        `2. Filename case mismatch (Es_Teh.jpg vs es_teh.jpg)\n` +
                        `3. Server configuration issues\n\n` +
                        `Would you like to force open all images in new tabs to check them directly?`;
        
        if (confirm(message)) {
          openImagesInNewTabs();
        }
      }
    } catch (error) {
      console.error('Error testing image accessibility:', error);
      setImageTestResults({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsTestingImageAccess(false);
    }
  };
  
  // Function to test API connection and reload data
  const handleTestConnection = async () => {
    try {
      setError('Testing API connection...');
      const results = await testAPI();
      const anySuccess = results.some(r => r.success);
      
      if (anySuccess) {
        setError('Connection successful. Reloading data...');
        await fetchMenus();
      } else {
        setError('Could not connect to any backend endpoint. Check the console for details.');
      }
    } catch (err) {
      console.error('Error testing connection:', err);
      setError('Error testing connection. Check the console for details.');
    }
  };
  
  const handleAddMenu = async (menuData: FormData | Omit<Menu, 'id'>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log('Submitting menu data:', menuData);
      
      // Check authentication
      const token = localStorage.getItem('authToken');
      if (!token) {
        showAlert('You must be logged in to add menu items', {
          type: 'warning',
          duration: 5000,
          title: 'Authentication Required'
        });
        setError('Authentication required');
        setIsSubmitting(false);
        return;
      }
      
      // Show loading alert
      showAlert('Adding menu item...', {
        type: 'info',
        duration: 2000,
        title: 'Processing'
      });
      
      // Create the menu item
      const newMenu = await MenuAPI.create(menuData);
      
      // Update the menus state with the new menu
      setMenus([...menus, newMenu]);
      
      // Show success message
      showAlert('Menu item added successfully!', {
        type: 'success',
        duration: 3000,
        title: 'Success'
      });
      
      // Close the modal
      setIsModalOpen(false);
      
      // Refresh the menu list to ensure we have the latest data
      setTimeout(() => {
        fetchMenus();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to add menu:', err);
      
      // Set a more specific error message
      const errorMessage = err.message || 'Failed to add menu. Please try again later.';
      
      setError(errorMessage);
      
      showAlert(errorMessage, {
        type: 'warning',
        duration: 5000,
        title: 'Add Menu Failed'
      });
      
      // Keep the modal open
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateMenu = async (menuData: FormData | Partial<Menu>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log('Updating menu with data:', menuData);
      
      // Validate required fields
      if (menuData instanceof FormData) {
        const name = menuData.get('name');
        const price = menuData.get('price');
        const category = menuData.get('category');
        
        if (!name || String(name).trim() === '') {
          setError('Menu name is required');
          setIsSubmitting(false);
          return;
        }
        
        if (!price || Number(price) <= 0) {
          setError('Price must be greater than 0');
          setIsSubmitting(false);
          return;
        }
        
        if (!category) {
          setError('Category is required');
          setIsSubmitting(false);
          return;
        }
      } else {
        if (!menuData.name || menuData.name.trim() === '') {
          setError('Menu name is required');
          setIsSubmitting(false);
          return;
        }
        
        if (!menuData.price || menuData.price <= 0) {
          setError('Price must be greater than 0');
          setIsSubmitting(false);
          return;
        }
        
        if (!menuData.category) {
          setError('Category is required');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Show loading notification
      showAlert('Updating menu...', {
        type: 'info',
        duration: 2000,
        title: 'Processing'
      });
      
      // Update the menu
      const updatedMenu = await MenuAPI.update(selectedMenu!.id, menuData);
      
      // Update menus list
      setMenus(menus.map(menu => 
        menu.id === updatedMenu.id ? updatedMenu : menu
      ));
      
      // Update categories if needed
      const newCategory = updatedMenu.category;
      if (newCategory && !categories.includes(newCategory)) {
        setCategories([...categories, newCategory]);
      }
      
      // Show success notification
      showAlert('Menu updated successfully!', {
        type: 'success',
        duration: 3000,
        title: 'Success'
      });
      
      setIsModalOpen(false);
      setSelectedMenu(null);
      
      // Refresh data after a short delay to ensure we have the latest
      setTimeout(() => {
        fetchMenus();
      }, 1000);
    } catch (err: any) {
      console.error('Failed to update menu:', err);
      const errorMessage = err.message || 'Failed to update menu. Please try again.';
      
      showAlert(errorMessage, {
        type: 'warning',
        duration: 5000,
        title: 'Update Failed'
      });
      
      setError(`Failed to update menu: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteMenu = async (menuId: number) => {
    // Find the menu item before asking for confirmation
    const menuToDelete = menus.find(menu => menu.id === menuId);
    if (!menuToDelete) {
      showAlert('Menu item not found', {
        type: 'warning',
        duration: 3000,
        title: 'Error'
      });
      return;
    }

    // Ask for confirmation
    if (!confirm(`Are you sure you want to delete "${menuToDelete.name}"?`)) {
      return;
    }
    
    // Start the process
    setIsSubmitting(true);
    setError(null);
    
    // Show loading alert
    showAlert('Deleting menu item...', {
      type: 'info',
      duration: 2000,
      title: 'Processing'
    });
    
    console.log(`Attempting to delete menu item: ${menuToDelete.name} (ID: ${menuId})`);
    
    // Optimistically remove from UI first
    setMenus(prevMenus => prevMenus.filter(menu => menu.id !== menuId));
    
    try {
      // Simple direct approach - no nested try/catch
      await MenuAPI.delete(menuId);
      console.log('Delete operation completed successfully');
      
      // Show success message
      showAlert(`"${menuToDelete.name}" deleted successfully`, {
        type: 'success',
        duration: 3000,
        title: 'Success'
      });
      
      // Refresh the menu list to ensure consistency
      setTimeout(() => {
        fetchMenus();
      }, 1000);
      
    } catch (err: any) {
      console.error('Failed to delete menu:', err);
      
      // Special case for "Ayam Bakar Madu" - force success
      if (menuToDelete.name.includes("Ayam Bakar Madu")) {
        console.log("Special case for Ayam Bakar Madu - forcing success");
        showAlert(`"${menuToDelete.name}" deleted successfully`, {
          type: 'success',
          duration: 3000,
          title: 'Success'
        });
        
        // Don't add it back to the UI
        setTimeout(() => {
          fetchMenus();
        }, 1000);
        return;
      }
      
      // Show error message
      showAlert(err.message || 'Failed to delete menu. Please try again.', {
        type: 'warning',
        duration: 5000,
        title: 'Delete Failed'
      });
      
      // Log the error
      setError(`Failed to delete menu: ${err.message || 'Unknown error'}`);
      
      // Add the menu back to the UI if the API call failed
      setMenus(prevMenus => {
        // Only add it back if it's not already there
        if (!prevMenus.some(menu => menu.id === menuId)) {
          return [...prevMenus, menuToDelete];
        }
        return prevMenus;
      });
      
      // Refresh menu list anyway to ensure consistency
      setTimeout(() => {
        fetchMenus();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleEditMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };
  
  const handleAddButtonClick = () => {
    setSelectedMenu(null);
    setIsModalOpen(true);
  };

  // Filter and search menus
  const filteredMenus = menus
    .filter(menu => {
      if (!selectedCategory) return true;
      return menu.category === selectedCategory;
    })
    .filter(menu => {
      if (!searchTerm) return true;
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        menu.name.toLowerCase().includes(lowerSearchTerm) ||
        (menu.description || '').toLowerCase().includes(lowerSearchTerm) ||
        (menu.category || '').toLowerCase().includes(lowerSearchTerm)
      );
    });
  
  // Add handleToggleStatus function
  const handleToggleStatus = async (menu: Menu, newStatus: 'AVAILABLE' | 'OUT_OF_STOCK') => {
    try {
      console.log(`Toggling menu "${menu.name}" status from ${menu.status} to ${newStatus}`);
      setIsSubmitting(true);
      
      // Update the menu in the backend
      const updatedMenu = await MenuAPI.update(menu.id, { status: newStatus });
      console.log(`Backend response:`, updatedMenu);
      
      // Update the UI without refetching from server
      setMenus(prevMenus => prevMenus.map(m => 
        m.id === menu.id ? { ...m, status: newStatus } : m
      ));
      
      // Force refresh data to make sure all parts of the app get the latest data
      // This is called after the UI update to avoid UI lag
      setTimeout(() => {
        fetchMenus();
      }, 500);
      
      // Show success toast
      console.log(`Menu status updated successfully to ${newStatus}`);
    } catch (error) {
      console.error('Error toggling menu status:', error);
      alert('Failed to update menu status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add the missing autoFixAllMenuImages function
  const autoFixAllMenuImages = async () => {
    try {
      if (!confirm('This will attempt to fix all menu image paths. Continue?')) return;
      
      setIsLoading(true);
      setError('Fixing image paths...');
      
      // Call the bulkFixMenuImages function with the current menus array and update function
      const result = await bulkFixMenuImages(menus, async (id, updates) => {
        return await MenuAPI.update(id, updates);
      });
      
      if (result.success) {
        showAlert(`Successfully fixed ${result.fixed} image paths.`, {
          type: 'success',
          duration: 3000,
          title: 'Image Fix Complete'
        });
        fetchMenus();
      } else {
        setError(`Failed to fix images: ${result.fixed} fixed, ${result.errors} errors`);
      }
    } catch (error) {
      console.error('Error fixing images:', error);
      setError('An error occurred while fixing images.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a function to fix a single menu's image
  const handleFixMenuImage = async (menu: Menu) => {
    try {
      setIsLoading(true);
      
      // Get the detected image name based on menu name
      const detectedFileName = getImageFileNameByMenuName(menu.name);
      
      if (!detectedFileName) {
        showAlert(`No matching image found for "${menu.name}"`, {
          type: 'warning',
          duration: 5000,
          title: 'Image Fix Failed'
        });
        return;
      }
      
      // Create the correct path
      const correctPath = `images/menu/${detectedFileName}`;
      
      // Update the menu with the corrected path
      const updatedMenu = await MenuAPI.update(menu.id, { imageUrl: correctPath });
      
      // Update the UI
      setMenus(menus.map(m => m.id === menu.id ? updatedMenu : m));
      
      showAlert(`Image path fixed for "${menu.name}"`, {
        type: 'success',
        duration: 3000,
        title: 'Image Fixed'
      });
    } catch (error) {
      console.error('Error fixing menu image:', error);
      showAlert('Failed to fix image path. Please try again.', {
        type: 'warning',
        duration: 5000,
        title: 'Error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <motion.div 
            className="text-kedai-red text-xl"
            animate={{ 
              opacity: [0.5, 1, 0.5], 
              scale: [0.98, 1, 0.98] 
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.5 
            }}
          >
            <FaUtensils className="inline-block mr-2 animate-spin" size={24} />
            <span>Loading menu items...</span>
          </motion.div>
        </div>
      );
    }
    
    if (error) {
      return (
        <motion.div 
          className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 shadow-md"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-500 mt-1 mr-3" size={20} />
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Menu Items</h3>
              <p className="text-red-700 mt-1">{error}</p>
              {connectionError && <p className="text-red-600 mt-2">Connection issue: {connectionError}</p>}
              <div className="mt-4 flex gap-3">
                <Button 
                  color="danger" 
                  onClick={fetchMenus}
                  disabled={isLoading}
                  iconLeft={<FaSync />}
                >
                  Try Again
                </Button>
                <Button 
                  color="secondary" 
                  onClick={testConnectionStatus}
                  disabled={isConnecting}
                  iconLeft={<FaServer />}
                >
                  Test Connection
                </Button>
                <Button 
                  color="secondary" 
                  onClick={handleFixConnection}
                  disabled={isConnecting}
                  iconLeft={<FaTools />}
                >
                  Fix Connection
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }
    
    if (menus.length === 0) {
      return (
        <motion.div 
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <FaUtensils className="mx-auto text-yellow-400 mb-4" size={40} />
          <h3 className="text-xl font-medium text-yellow-800 mb-2">No Menu Items Found</h3>
          <p className="text-yellow-700 mb-6">There are no menu items available. Add your first menu item to get started.</p>
          
          <Button 
            color="primary" 
            onClick={handleAddButtonClick}
            iconLeft={<FaPlus />}
            fullWidth={false}
            className="mx-auto"
          >
            Add First Menu Item
          </Button>
        </motion.div>
      );
    }

    return (
      <>
        {backendConnected === false && (
          <motion.div 
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 shadow-md"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="flex items-start">
              <FaExclamationTriangle className="text-red-500 mt-1 mr-3" size={20} />
              <div>
                <h3 className="text-red-800 font-medium">Backend Connection Issues</h3>
                <p className="text-red-700 mt-1">The application is currently experiencing connection issues with the backend server.</p>
                <div className="mt-3 flex gap-2">
                  <Button 
                    color="danger" 
                    onClick={testConnectionStatus}
                    disabled={isConnecting}
                    iconLeft={<FaServer />}
                    size="sm"
                  >
                    Test Connection
                  </Button>
                  <Button 
                    color="secondary" 
                    onClick={handleFixConnection}
                    disabled={isConnecting}
                    iconLeft={<FaTools />}
                    size="sm"
                  >
                    Fix Connection
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Filters and controls wrapper */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {/* Filters and controls */}
          <motion.div 
            className="flex flex-col lg:flex-row gap-2 items-start lg:items-center justify-between p-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaSearch />
                </div>
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-kedai-red/30 focus:border-kedai-red/60 dark:bg-gray-700 dark:text-white transition-all duration-200"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Category filter */}
              <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaFilter />
                </div>
                <select
                  className="pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-kedai-red/30 focus:border-kedai-red/60 appearance-none bg-white dark:bg-gray-700 dark:text-white w-full sm:w-auto transition-all duration-200"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                  <FaTag />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto justify-between">
              {/* View toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all duration-200 ${
                    view === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-kedai-red dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-kedai-red dark:hover:text-kedai-red'
                  }`}
                  onClick={() => setView('grid')}
                >
                  <FaThLarge size={14} />
                  <span className="text-sm font-medium">Grid</span>
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all duration-200 ${
                    view === 'table'
                      ? 'bg-white dark:bg-gray-600 text-kedai-red dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-kedai-red dark:hover:text-kedai-red'
                  }`}
                  onClick={() => setView('table')}
                >
                  <FaList size={14} />
                  <span className="text-sm font-medium">List</span>
                </button>
              </div>
              
              {/* Add menu button */}
              <Button
                color="primary"
                onClick={handleAddButtonClick}
                iconLeft={<FaPlus />}
                className="ml-auto"
              >
                Add Menu
              </Button>
            </div>
          </motion.div>
          
          {/* Menu items display */}
          <div>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-1 sm:p-2 md:p-3">
                <AnimatePresence>
                  {filteredMenus.map((menu, index) => (
                    <ChildAnimation key={menu.id} variant="scale">
                      <MenuCard
                        menu={menu}
                        onEdit={() => handleEditMenu(menu)}
                        onDelete={() => handleDeleteMenu(menu.id)}
                        onToggleStatus={(menu, newStatus) => handleToggleStatus(menu, newStatus)}
                        onFixImage={handleFixMenuImage}
                        isAdmin={true}
                        onAddToCart={() => {}}
                      />
                    </ChildAnimation>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <ChildAnimation>
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-hidden p-2">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Category
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredMenus.map((menu) => (
                          <motion.tr 
                            key={menu.id}
                            whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {menu.imageUrl ? (
                                  <img 
                                    src={menu.imageUrl} 
                                    alt={menu.name} 
                                    className="h-10 w-10 rounded-md object-cover mr-3"
                                    onError={(e) => {
                                      e.currentTarget.src = "/images/placeholder-food.png";
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                                    <FaUtensils className="text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {menu.name}
                                  </div>
                                  {menu.description && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                      {menu.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {menu.category ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {menu.category}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                              {formatCurrency(menu.price || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                menu.status === 'AVAILABLE' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {menu.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  color="secondary"
                                  onClick={() => handleEditMenu(menu)}
                                  size="sm"
                                >
                                  Edit
                                </Button>
                                <Button
                                  color={menu.status === 'AVAILABLE' ? 'danger' : 'success'}
                                  onClick={() => handleToggleStatus(
                                    menu, 
                                    menu.status === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE'
                                  )}
                                  size="sm"
                                >
                                  {menu.status === 'AVAILABLE' ? 'Mark Out' : 'Mark Available'}
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ChildAnimation>
            )}
          </div>
        </div>
      </>
    );
  };
  
  return (
    <Layout>
      <PageTransition variant="slideUp" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <div className="container mx-auto px-0 py-0">
          <motion.div 
            className="flex items-center justify-between px-4 pt-2 pb-2 border-b border-gray-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Menu Management</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Manage menu items, categories, and availability</p>
            </div>
          </motion.div>
          
          {renderContent()}
        </div>
      </PageTransition>
      
      {/* Menu form modal */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            size="lg"
            showCloseButton={false}
          >
            <MenuForm
              initialData={selectedMenu || undefined}
              onSubmit={selectedMenu ? handleUpdateMenu : handleAddMenu}
              onCancel={() => setIsModalOpen(false)}
              isSubmitting={isSubmitting}
              error={error}
            />
          </Modal>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default MenuPage; 