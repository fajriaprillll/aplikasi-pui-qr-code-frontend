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
import ImageUploadTester from '../../components/ImageUploadTester';
import { bulkFixMenuImages } from '../../utils/imageHelper';
import { testImagesAccessibility, openImagesInNewTabs } from '../../utils/imageTest';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSearch, FaThLarge, FaList, FaFilter, FaSync, FaServer, FaImage, FaTools, FaExclamationTriangle, FaCheckCircle, FaUtensils, FaMagic } from 'react-icons/fa';

const MenuPage: React.FC = () => {
  console.log('MenuPage - Component rendering');
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();
  
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
          console.log(`${menu.name}: "${menu.image || 'EMPTY'}"`);
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
  
  const handleAddMenu = async (menuData: Omit<Menu, 'id'> | FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log('Submitting menu data:', menuData);
      
      // Additional validation for FormData
      if (menuData instanceof FormData) {
        const name = menuData.get('name');
        const price = menuData.get('price');
        
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
      } else {
        // Regular object validation
        if (!menuData.name || menuData.name.trim() === '') {
          setError('Menu name is required');
          setIsSubmitting(false);
          return;
        }
        
        if (menuData.price <= 0) {
          setError('Price must be greater than 0');
          setIsSubmitting(false);
          return;
        }
      }
      
      const newMenu = await MenuAPI.create(menuData);
      
      console.log('Menu created successfully:', newMenu);
      
      // Update the menus state with the new menu
      setMenus([...menus, newMenu]);
      
      // Close the modal
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to add menu:', err);
      
      // Set a more specific error message
      if (err.message) {
        setError(`Failed to add menu: ${err.message}`);
      } else {
        setError('Failed to add menu. Please try again later.');
      }
      
      // Keep the modal open
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateMenu = async (menuData: Partial<Menu>) => {
    if (!selectedMenu) return;
    
    try {
      setIsSubmitting(true);
      const updatedMenu = await MenuAPI.update(selectedMenu.id, menuData);
      
      // Update menus list
      setMenus(menus.map(menu => 
        menu.id === updatedMenu.id ? updatedMenu : menu
      ));
      
      // Update categories if needed
      if (menuData.category && !categories.includes(menuData.category)) {
        setCategories([...categories, menuData.category]);
      }
      
      setIsModalOpen(false);
      setSelectedMenu(null);
    } catch (err) {
      console.error('Failed to update menu:', err);
      alert('Failed to update menu. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteMenu = async (menuId: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      await MenuAPI.delete(menuId);
      
      // Remove from state
      setMenus(menus.filter(menu => menu.id !== menuId));
      
      // Recalculate categories
      const remainingMenus = menus.filter(menu => menu.id !== menuId);
      const updatedCategories = Array.from(
        new Set(remainingMenus.map(menu => menu.category).filter(Boolean))
      ) as string[];
      
      setCategories(updatedCategories);
    } catch (err) {
      console.error('Failed to delete menu:', err);
      alert('Failed to delete menu. Please try again.');
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

  // Ensure menus is an array before filtering
  const safeMenus = Array.isArray(menus) ? menus : [];

  // Filter menus by category and search term
  const filteredMenus = safeMenus
    .filter(menu => !selectedCategory || menu.category === selectedCategory)
    .filter(menu => !searchTerm || 
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (menu.description && menu.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (menu.category && menu.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
  // Function to fix image path format
  const handleFixImagePath = async (menu: Menu) => {
    try {
      setIsSubmitting(true);
      
      // Jika path gambar kosong, tampilkan dialog untuk memilih file
      if (!menu.image || menu.image.trim() === '') {
        const fileName = prompt(
          `Menu "${menu.name}" tidak memiliki path gambar tersimpan di database.\n\n` +
          `Masukkan nama file gambar yang diinginkan (termasuk ekstensi, contoh: nasgor.jpg):`
        );
        
        if (!fileName || fileName.trim() === '') {
          setIsSubmitting(false);
          alert('Operasi dibatalkan. Tidak ada nama file yang dimasukkan.');
          return;
        }
        
        // Ubah spasi menjadi underscore untuk menghindari masalah
        const sanitizedFileName = fileName.trim().replace(/ /g, '_');
        
        // Create the standardized path dengan file yang dimasukkan user
        const fixedPath = `images/menu/${sanitizedFileName}`;
        
        // Confirm before updating
        const confirm = window.confirm(
          `Set path gambar untuk "${menu.name}"?\n\n` +
          `Path: ${fixedPath}\n\n` +
          (fileName !== sanitizedFileName ? 
            `⚠️ Nama file diubah dari "${fileName}" menjadi "${sanitizedFileName}" (spasi diganti underscore)\n\n` : '') +
          `PASTIKAN file gambar "${sanitizedFileName}" sudah ada di folder:\n` +
          `public/images/menu/`
        );
        
        if (!confirm) {
          setIsSubmitting(false);
          return;
        }
        
        // Update the menu with the fixed path
        const updatedMenu = await MenuAPI.update(menu.id, { image: fixedPath });
        
        // Update menus list
        setMenus(menus.map(m => m.id === updatedMenu.id ? updatedMenu : m));
        
        alert(`Path gambar untuk "${menu.name}" berhasil diatur.\n\nPastikan file gambar ada di: public/${fixedPath}`);
        setIsSubmitting(false);
        return;
      }
      
      // Untuk kasus normal (image path sudah ada)
      // Extract just the filename from any path format
      const filename = menu.image.split(/[\/\\]/).pop() || menu.image;
      
      // Ubah spasi menjadi underscore jika ada
      const sanitizedFilename = filename.replace(/ /g, '_');
      
      // Create the standardized path
      const fixedPath = `images/menu/${sanitizedFilename}`;
      
      // Jika sama persis dan tidak ada spasi, tidak perlu update
      if (fixedPath === menu.image && !filename.includes(' ')) {
        alert(`Path gambar untuk "${menu.name}" sudah dalam format yang benar: ${fixedPath}`);
        setIsSubmitting(false);
        return;
      }
      
      // Confirm before updating
      let confirmMessage = `Perbaiki path gambar untuk "${menu.name}"?\n\n`;
      confirmMessage += `Dari: ${menu.image}\n`;
      confirmMessage += `Menjadi: ${fixedPath}\n\n`;
      
      if (filename !== sanitizedFilename) {
        confirmMessage += `⚠️ PERHATIAN: Nama file akan diubah dari "${filename}" menjadi "${sanitizedFilename}"\n`;
        confirmMessage += `Pastikan file tersedia dengan nama yang benar di folder:\n`;
        confirmMessage += `public/images/menu/\n\n`;
        confirmMessage += `TINDAKAN YANG DIPERLUKAN:\n`;
        confirmMessage += `1. Ganti nama file dari "${filename}" menjadi "${sanitizedFilename}"\n`;
        confirmMessage += `2. Refresh halaman setelah mengklik OK (Ctrl+F5)\n`;
      } else {
        confirmMessage += `Pastikan file gambar sudah ada di folder public/images/menu/\n`;
      }
      
      const confirm = window.confirm(confirmMessage);
      
      if (!confirm) {
        setIsSubmitting(false);
        return;
      }
      
      // Update the menu with the fixed path
      const updatedMenu = await MenuAPI.update(menu.id, { image: fixedPath });
      
      // Update menus list
      setMenus(menus.map(m => m.id === updatedMenu.id ? updatedMenu : m));
      
      if (filename !== sanitizedFilename) {
        alert(
          `Path gambar untuk "${menu.name}" berhasil diperbaiki.\n\n` +
          `PENTING: Pastikan Anda mengganti nama file dari:\n` +
          `"${filename}" menjadi "${sanitizedFilename}"\n\n` +
          `Lokasi file: public/images/menu/\n\n` +
          `Lalu refresh halaman dengan Ctrl+F5`
        );
      } else {
        alert(`Path gambar untuk "${menu.name}" berhasil diperbaiki.\n\nPastikan file gambar ada di: public/${fixedPath}`);
      }
    } catch (err) {
      console.error('Failed to fix image path:', err);
      alert('Gagal memperbaiki path gambar. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to automatically fix all menu images 
  const autoFixAllMenuImages = async () => {
    try {
      setIsSubmitting(true);
      
      // Confirm first
      const confirm = window.confirm(
        `Perbaiki gambar untuk SEMUA MENU secara otomatis?\n\n` +
        `Ini akan mencoba mendeteksi dan memperbaiki path gambar untuk semua menu berdasarkan namanya.\n\n` +
        `Pastikan semua file gambar sudah tersedia di folder:\n` +
        `public/images/menu/`
      );
      
      if (!confirm) {
        setIsSubmitting(false);
        return;
      }
      
      // Apply auto-detection untuk semua menu
      const fixedMenus = bulkFixMenuImages(menus);
      
      // Log perubahan
      console.log('Auto-Fix Results:', fixedMenus);
      
      // Hitung berapa banyak menu yang berubah
      const changedMenus = fixedMenus.filter((menu, index) => 
        menu.image !== menus[index].image
      );
      
      if (changedMenus.length === 0) {
        alert('Tidak ada menu yang perlu diperbaiki.');
        setIsSubmitting(false);
        return;
      }
      
      // Tanya konfirmasi dengan detail perubahan
      const detailConfirm = window.confirm(
        `${changedMenus.length} menu akan diperbarui:\n\n` +
        changedMenus.map(menu => `- ${menu.name}: ${menu.image}`).join('\n') +
        `\n\nLanjutkan update ke database?`
      );
      
      if (!detailConfirm) {
        setIsSubmitting(false);
        return;
      }
      
      // Update satu per satu ke database
      let successCount = 0;
      let failCount = 0;
      
      for (const menu of changedMenus) {
        try {
          await MenuAPI.update(menu.id, { image: menu.image });
          successCount++;
        } catch (err) {
          console.error(`Failed to update menu ${menu.id}:`, err);
          failCount++;
        }
      }
      
      // Update state dengan menu yang sudah diperbarui
      setMenus(fixedMenus);
      
      // Tampilkan hasil
      alert(
        `Update selesai!\n\n` +
        `Berhasil: ${successCount} menu\n` +
        `Gagal: ${failCount} menu\n\n` +
        `Gambar menu akan muncul setelah halaman di-refresh.`
      );
      
      // Refresh data
      fetchMenus();
    } catch (err) {
      console.error('Error in auto-fix operation:', err);
      alert('Terjadi error saat mencoba memperbaiki gambar menu.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <motion.div 
          className="flex flex-col justify-center items-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="h-20 w-20 mb-4 relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="h-full w-full rounded-full border-4 border-gray-200"></div>
            <motion.div 
              className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            ></motion.div>
          </motion.div>
          <motion.p 
            className="text-gray-600 font-medium text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading menu items...
          </motion.p>
        </motion.div>
      );
    }
    
    if (backendConnected === false) {
      return (
        <motion.div 
          className="text-center py-10 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-24 h-24 bg-yellow-100 rounded-full mx-auto mb-6 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <FaExclamationTriangle className="text-yellow-500 text-3xl" />
          </motion.div>
          
          <motion.h2 
            className="text-2xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Connection Issue
          </motion.h2>
          
          <motion.p 
            className="text-red-500 mb-6 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            We're having trouble connecting to the backend server
          </motion.p>
          
          <motion.div 
            className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-6 text-left max-w-3xl mx-auto shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="font-bold text-gray-800 mb-3">Possible issues:</h3>
            <ol className="list-decimal pl-4 space-y-3 text-gray-700">
              <li>Backend server is not running. Make sure the Node.js server is running on port 3000.</li>
              <li>Backend server is running on a different port. Check your server port configuration.</li>
              <li>There might be permission or firewall issues. Ensure there are no restrictions on port 3000.</li>
              <li>It could be a browser cache or CORS issue. Try clearing cache or use the "Fix Connection" button.</li>
            </ol>
            
            <h3 className="font-bold text-gray-800 mt-6 mb-3">Troubleshooting steps:</h3>
            <ol className="list-decimal pl-4 space-y-3 text-gray-700">
              <li>Start backend server with the command: <code className="bg-gray-200 px-2 py-1 rounded text-red-600">npm run start</code></li>
              <li>Make sure backend is running on port 3000 or update the .env.local file with the correct port</li>
              <li>Restart browser and frontend application after backend is running</li>
              <li>If backend is already running, try using the "Fix Connection" button below</li>
            </ol>
          </motion.div>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              onClick={() => window.location.reload()} 
              className="flex items-center justify-center gap-2"
              variant="secondary"
            >
              <FaSync /> Reload Page
            </Button>
            <Button 
              onClick={() => fetchMenus()} 
              variant="secondary"
              className="flex items-center justify-center gap-2"
            >
              <FaSync /> Try Loading Data Again
            </Button>
            <Button 
              onClick={handleFixConnection} 
              variant="primary" 
              className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center gap-2"
            >
              <FaServer /> Fix Connection
            </Button>
          </motion.div>
        </motion.div>
      );
    }
    
    if (error) {
      return (
        <motion.div 
          className="text-center py-16 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <FaExclamationTriangle className="text-red-500 text-3xl" />
          </motion.div>
          
          <motion.h2 
            className="text-2xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Something went wrong
          </motion.h2>
          
          <motion.p 
            className="text-red-500 mb-6 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {error}
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={() => fetchMenus()} 
              className="flex items-center justify-center gap-2"
            >
              <FaSync /> Try Again
            </Button>
            <Button 
              onClick={() => {
              quickTest().then(connected => {
                if (connected) {
                  setBackendConnected(true);
                  fetchMenus();
                } else {
                  setBackendConnected(false);
                }
              });
              }} 
              variant="secondary"
              className="flex items-center justify-center gap-2"
            >
              <FaServer /> Test API Connection
            </Button>
          </motion.div>
        </motion.div>
      );
    }
    
    if (safeMenus.length === 0) {
      return (
        <motion.div 
          className="text-center py-16 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <FaUtensils className="text-gray-400 text-3xl" />
          </motion.div>
          
          <motion.h2 
            className="text-2xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            No menu items available
          </motion.h2>
          
          <motion.p 
            className="text-gray-500 mb-6 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Start by adding your first menu item
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={handleAddButtonClick}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600"
            >
              <FaPlus /> Add New Menu Item
            </Button>
            <Button 
              onClick={() => fetchMenus()} 
              variant="secondary"
              className="flex items-center justify-center gap-2"
            >
              <FaSync /> Refresh Data
            </Button>
          </motion.div>
        </motion.div>
      );
    }

    if (view === 'table') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md overflow-hidden overflow-x-auto border border-gray-100"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredMenus.map((menu, index) => (
                <motion.tr 
                  key={menu.id} 
                  className="hover:bg-red-50 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * (index % 10) }}
                  whileHover={{ backgroundColor: "rgba(254, 226, 226, 0.5)" }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={menu.image || 'https://via.placeholder.com/50x50?text=Food'} 
                      alt={menu.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/50x50?text=Food';
                        }}
                    />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{menu.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{menu.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {menu.category ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-700">
                        {menu.category}
                    </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700">
                        Uncategorized
                    </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {formatCurrency(menu.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <motion.button
                        className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                      onClick={() => handleEditMenu(menu)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                      Edit
                      </motion.button>
                      <motion.button
                        className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                      onClick={() => handleDeleteMenu(menu.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                      Delete
                      </motion.button>
                      <motion.button
                        className={menu.status === 'AVAILABLE' ? "text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50" : "text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"}
                        onClick={() => handleToggleStatus(menu, menu.status === 'AVAILABLE' ? 'OUT_OF_STOCK' : 'AVAILABLE')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {menu.status === 'AVAILABLE' ? 'Mark Out of Stock' : 'Mark Available'}
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      );
    }
    
    return (
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {filteredMenus.map((menu, index) => (
          <motion.div
            key={menu.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * (index % 12) }}
          >
            <MenuCard
            menu={menu}
            isAdmin
            onAddToCart={() => {}}
            onEdit={handleEditMenu}
            onDelete={handleDeleteMenu}
            onToggleStatus={handleToggleStatus}
          />
          </motion.div>
        ))}
      </motion.div>
    );
  };
  
  console.log('MenuPage - Before rendering Layout');
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Page Header with Animations */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <motion.h1 
              className="text-3xl font-bold text-gray-800"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Menu Management
            </motion.h1>
            
            {/* Backend Connection Status Indicator */}
            <AnimatePresence>
              {backendConnected === false && (
                <motion.div 
                  className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-lg flex items-start"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
              >
                  <FaExclamationTriangle className="text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-700 font-medium mb-1">Backend Connection Issue</p>
                    <p className="text-xs text-yellow-600 mb-2">{connectionError || 'Unable to connect to the backend server'}</p>
              <Button 
                variant="secondary"
                      className="text-xs py-1 px-3"
                      onClick={handleFixConnection}
                      isLoading={isConnecting}
                    >
                      <FaServer className="mr-1.5" size={12} />
                      {isConnecting ? 'Connecting...' : 'Fix Connection'}
              </Button>
            </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Image Test Result */}
            <AnimatePresence>
              {imageTestResult && (
                <motion.div
                  className={`p-3 mb-6 rounded-lg text-sm flex items-center ${
                    imageTestResult.includes('successful') 
                      ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                      : 'bg-yellow-50 text-yellow-700 border-l-4 border-yellow-500'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {imageTestResult.includes('successful') 
                    ? <FaCheckCircle className="text-green-500 mr-2" /> 
                    : <FaExclamationTriangle className="text-yellow-500 mr-2" />
                  }
                  <span>{imageTestResult}</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Image Accessibility Test Results */}
            <AnimatePresence>
              {imageTestResults && (
                <motion.div
                  className={`p-4 mb-6 rounded-lg text-sm ${
                    imageTestResults.success
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center mb-3">
                    {imageTestResults.success 
                      ? <FaCheckCircle className="text-green-500 mr-2 text-lg" /> 
                      : <FaExclamationTriangle className="text-yellow-500 mr-2 text-lg" />
                    }
                    <h3 className="font-medium">
                      {imageTestResults.success 
                        ? 'All images are accessible!' 
                        : 'Some images could not be accessed'}
                    </h3>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {imageTestResults.results?.map((result: any, index: number) => (
                      <div 
                        key={index}
                        className={`p-2 rounded flex items-start ${
                          result.success ? 'bg-green-100' : 'bg-yellow-100'
                        }`}
                      >
                        {result.success 
                          ? <FaCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0" /> 
                          : <FaExclamationTriangle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                        }
                        <div>
                          <div className="font-mono text-xs">{result.path}</div>
                          {!result.success && result.error && (
                            <div className="text-red-600 text-xs mt-1">{result.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                      className="text-xs py-1.5 px-3"
                      onClick={() => setImageTestResults(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      className="text-xs py-1.5 px-3"
                      onClick={openImagesInNewTabs}
                    >
                      Open Images in Tabs
              </Button>
            </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Main Toolbar */}
            <motion.div 
              className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4 border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {/* Search input */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaSearch size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search menu items..."
                  className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 text-sm transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Category filter */}
              <div className="flex-none">
                <div className="relative inline-block w-full md:w-auto">
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="appearance-none pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 bg-white text-sm w-full transition-all"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaFilter size={14} />
                  </div>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          
              {/* View toggle */}
              <div className="flex-none flex items-center rounded-lg border border-gray-200 overflow-hidden">
              <button
                  className={`flex items-center gap-1.5 px-3 py-2 ${
                    view === 'grid' ? 'bg-red-50 text-red-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  } transition-colors`}
                onClick={() => setView('grid')}
              >
                  <FaThLarge size={14} />
                  <span className="text-sm">Grid</span>
              </button>
              <button
                  className={`flex items-center gap-1.5 px-3 py-2 ${
                    view === 'table' ? 'bg-red-50 text-red-600' : 'bg-white text-gray-600 hover:bg-gray-50'
                  } transition-colors`}
                onClick={() => setView('table')}
              >
                  <FaList size={14} />
                  <span className="text-sm">Table</span>
              </button>
          </div>
        
              {/* Tools dropdown/buttons */}
              <div className="flex-none flex space-x-2">
            <Button 
              variant="secondary"
                  className="px-3 py-2 text-sm flex items-center gap-1.5"
                  onClick={handleTestConnection}
            >
                  <FaSync size={14} />
                  <span>Refresh</span>
            </Button>
            
            {/* Add Menu Button */}
            <Button 
              variant="primary"
              className="px-4 py-2 text-sm font-medium flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600"
              onClick={handleAddButtonClick}
            >
              <FaPlus size={14} />
              <span>Add Menu</span>
            </Button>
          </div>
            </motion.div>
            </div>
        </motion.div>
      
        {renderContent()}
      
        {/* Add/Edit Menu Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMenu(null);
            setError(null);
          }}
          title={selectedMenu ? 'Edit Menu Item' : 'Add New Menu Item'}
        >
          <MenuForm
            initialData={selectedMenu || undefined}
            onSubmit={selectedMenu ? handleUpdateMenu : handleAddMenu}
            onCancel={() => {
              setIsModalOpen(false);
              setSelectedMenu(null);
              setError(null);
            }}
            isSubmitting={isSubmitting}
            error={error}
          />
        </Modal>
      </div>
    </Layout>
  );
};

export default MenuPage; 