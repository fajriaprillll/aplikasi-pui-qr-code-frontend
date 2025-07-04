import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OrderAPI, TableAPI, MenuAPI } from '../../api';
import api from '../../api/axios';
import { useAuthStore } from '../../store';
import type { Order, Table, Menu } from '../../types';
import { OrderStatus } from '../../types';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { formatCurrency, formatDate } from '../../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSync, FaFilter, FaSearch, FaCalendarAlt, FaCheck, FaTimes, FaInfo, FaUtensils, FaBell, FaClipboardCheck, FaAngleRight, FaCalendarDay, FaCalendarWeek, FaCalendarAlt as FaCalendarMonth, FaListUl, FaTag, FaChair, FaUser, FaMoneyBillWave, FaExclamationTriangle, FaHistory, FaTrash } from 'react-icons/fa';
import ConfirmationDialog from '../../components/ConfirmationDialog';

const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Record<number, Table>>({});
  const [menus, setMenus] = useState<Record<number, Menu>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [updatingStatus, setUpdatingStatus] = useState<OrderStatus | null>(null);
  const [dailyOrderId, setDailyOrderId] = useState<number | null>(null);
  
  // Confirmation dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<{
    orderId: number;
    status?: OrderStatus;
    action?: 'complete' | 'cancel' | 'process';
    message: string;
  } | null>(null);
  
  const updateProcessedStatusRef = useRef<{ orderId: number; isProcessed: boolean } | null>(null);
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);
  
  // Fetch orders, tables, and menus
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all required data in parallel
        const [ordersData, tablesData, menusData] = await Promise.all([
          OrderAPI.getAll(statusFilter || undefined),
          TableAPI.getAll(),
          MenuAPI.getAll(),
        ]);
        
        // Ensure data is an array
        const ordersArray = Array.isArray(ordersData) ? ordersData : [];
        const tablesArray = Array.isArray(tablesData) ? tablesData : [];
        const menusArray = Array.isArray(menusData) ? menusData : [];
        
        // Add additional defensive check against undefined data
        if (ordersData === undefined) {
          console.error('OrderPage - ordersData is undefined');
          setError('Gagal memuat data pesanan. Silakan coba lagi nanti.');
          setOrders([]);
          setIsLoading(false);
          return;
        }
        
        console.log('OrderPage - Data fetched:', {
          orders: ordersArray.length,
          tables: tablesArray.length,
          menus: menusArray.length
        });
        
        // Convert arrays to lookup objects
        const tablesMap: Record<number, Table> = {};
        tablesArray.forEach(table => {
          tablesMap[table.id] = table;
        });
        
        const menusMap: Record<number, Menu> = {};
        menusArray.forEach(menu => {
          menusMap[menu.id] = menu;
        });
        
        setOrders(ordersArray as Order[]);
        setTables(tablesMap);
        setMenus(menusMap);
      } catch (err) {
        console.error('Gagal mengambil data:', err);
        setError('Gagal memuat pesanan. Silakan coba lagi nanti.');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [statusFilter]);
  
  const handleUpdateOrderStatus = async (orderId: number, status: OrderStatus) => {
    try {
      // Prevent changing from completed to pending
      if (selectedOrder?.status === OrderStatus.COMPLETED && status === OrderStatus.PENDING) {
        alert('Tidak dapat mengubah status kembali ke pending setelah selesai.');
        return;
      }

      // Show confirmation dialog for completing order
      if (status === OrderStatus.COMPLETED) {
        const confirmMessage = 'Apakah Anda yakin ingin menyelesaikan pesanan ini?\n\nCatatan: Tindakan ini tidak dapat dibatalkan dan status pesanan tidak dapat diubah kembali ke pending.';
        setConfirmDialogData({
          orderId,
          status,
          message: confirmMessage
        });
        setIsConfirmDialogOpen(true);
        return;
      }

      // For other status changes, proceed without confirmation
      await updateOrderStatusRequest(orderId, status);
    } catch (err: any) {
      console.error('Failed in outer try block:', err);
      
      let errorMsg = 'Gagal memperbarui status pesanan.';
      if (err.response?.data?.message) {
        errorMsg += ` ${err.response.data.message}`;
      } else if (err.message) {
        errorMsg += ` Error: ${err.message}`;
      }
      
      alert(errorMsg + ' Silakan coba lagi.');
      setUpdatingStatus(null);
    }
  };
  
  const updateOrderStatusRequest = async (orderId: number, status: OrderStatus) => {
    console.log(`Updating order #${orderId} status to ${status}`);
    setUpdatingStatus(status);
    
    try {
      // Log the enum value we're sending to help diagnose issues
      console.log('Status enum value:', status);
      console.log('Status type:', typeof status);
      
      // Direct API call without delay
      const updatedOrder = await OrderAPI.updateStatus(orderId, status);
      console.log('Successfully updated order:', updatedOrder);
      
      // Update orders list with type casting
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === updatedOrder.id ? (updatedOrder as Order) : order
        )
      );
      
      // Update selected order if open in modal
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder as Order);
      }
      
      // Show success message
      alert(`Status pesanan berhasil diubah menjadi ${updatedOrder.status}`);
      
      // Only refresh for COMPLETED or CANCELLED status, not PROCESSING
      if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
      window.location.reload();
      }
      
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      
      // Retry with a different approach if the first attempt failed
      try {
        console.log('Retrying status update with basic method...');
        
        // Try a simpler update approach as fallback - using raw string instead of enum
        const statusString = status.toString();
        console.log('Using string value for status:', statusString);
        
        const simpleUpdate = await api.put(`/orders/${orderId}/status`, { 
          status: statusString
        });
        
        if (simpleUpdate?.data) {
          console.log('Update succeeded with simple method:', simpleUpdate.data);
          alert(`Status pesanan berhasil diubah menjadi ${status}`);
          
          // Only refresh for COMPLETED or CANCELLED status, not PROCESSING
          if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
          window.location.reload();
          } else {
            // Update local state instead of refreshing for PROCESSING
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === orderId ? {...order, status} : order
              )
            );
          }
          return;
        }
      } catch (retryErr: any) {
        console.error('Retry also failed:', retryErr);
        
        // Try a third approach with different casing
        try {
          console.log('Trying third approach with status value normalization');
          
          // Try with uppercase value explicitly
          const upperStatus = status.toString().toUpperCase();
          console.log('Using uppercase status:', upperStatus);
          
          const thirdTry = await api.put(`/orders/${orderId}/status`, { 
            status: upperStatus
          });
          
          if (thirdTry?.data) {
            console.log('Third attempt succeeded:', thirdTry.data);
            alert(`Status pesanan berhasil diubah menjadi ${status}`);
            
            // Only refresh for COMPLETED or CANCELLED status, not PROCESSING
            if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
            window.location.reload();
            } else {
              // Update local state instead of refreshing for PROCESSING
              setOrders(prevOrders => 
                prevOrders.map(order => 
                  order.id === orderId ? {...order, status} : order
                )
              );
            }
            return;
          }
        } catch (thirdErr: any) {
          console.error('Third attempt also failed:', thirdErr);
          
          // Log request details for debugging
          if (thirdErr.response) {
            console.error('Error details:', {
              status: thirdErr.response.status,
              data: thirdErr.response.data,
              headers: thirdErr.response.headers
            });
          }
        }
      }
      
      let errorMsg = 'Gagal memperbarui status pesanan.';
      if (err.response?.data?.message) {
        errorMsg += ` ${err.response.data.message}`;
      } else if (err.message) {
        errorMsg += ` Error: ${err.message}`;
      }
      
      alert(errorMsg + ' Silakan coba lagi.');
    } finally {
      setUpdatingStatus(null);
    }
  };
  
  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) return;
    
    try {
      await OrderAPI.delete(orderId);
      
      // Remove from state - ensure orders is an array first
      const currentOrders = Array.isArray(orders) ? orders : [];
      setOrders(currentOrders.filter(order => order.id !== orderId));
      
      // Close modal if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setIsDetailModalOpen(false);
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Gagal menghapus pesanan:', err);
      alert('Gagal menghapus pesanan. Silakan coba lagi.');
    }
  };
  
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };
  
  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case OrderStatus.PROCESSING:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case OrderStatus.COMPLETED:
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };
  
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <FaBell className="text-yellow-500" />;
      case OrderStatus.PROCESSING:
        return <FaUtensils className="text-blue-500" />;
      case OrderStatus.COMPLETED:
        return <FaCheck className="text-green-500" />;
      case OrderStatus.CANCELLED:
        return <FaTimes className="text-red-500" />;
      default:
        return <FaInfo className="text-gray-500" />;
    }
  };
  
  // Get next status for an order
  const getNextStatus = (currentStatus: OrderStatus): OrderStatus => {
    switch (currentStatus) {
      case OrderStatus.PENDING:
        return OrderStatus.PROCESSING;
      case OrderStatus.PROCESSING:
        return OrderStatus.COMPLETED;
      default:
        return currentStatus;
    }
  };
  
  // Enable or disable status change buttons based on current status
  const isStatusChangeAllowed = (currentStatus: OrderStatus, targetStatus: OrderStatus): boolean => {
    // Don't allow changing back from completed
    if (currentStatus === OrderStatus.COMPLETED) return false;
    
    // Allow processing to pending (rare case of error)
    if (currentStatus === OrderStatus.PROCESSING && targetStatus === OrderStatus.PENDING) return true;
    
    // Allow sequential progression
    if (currentStatus === OrderStatus.PENDING && targetStatus === OrderStatus.PROCESSING) return true;
    if (currentStatus === OrderStatus.PROCESSING && targetStatus === OrderStatus.COMPLETED) return true;
    
    // Allow direct pending to completed (skip processing)
    if (currentStatus === OrderStatus.PENDING && targetStatus === OrderStatus.COMPLETED) return true;
    
    return false;
  };
  
  // Ensure orders is always an array
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  // Filter orders by time
  const filterOrdersByTime = (order: Order) => {
    if (timeFilter === 'all') return true;
    
    const now = new Date();
    const orderDate = new Date(order.createdAt || '');
    
    if (timeFilter === 'today') {
      return orderDate.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0);
    }
    
    if (timeFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return orderDate >= oneWeekAgo;
    }
    
    if (timeFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return orderDate >= oneMonthAgo;
    }
    
    return true;
  };

  // Helper to sort orders by creation time for queue display
  const sortOrdersByCreationTime = (orders: Order[]): Order[] => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
      return dateA - dateB; // Sort by oldest first for the queue
    });
  };

  // Get queue of pending orders sorted by creation time
  const getOrderQueue = (): Order[] => {
    return sortOrdersByCreationTime(
      safeOrders.filter(order => order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING)
    );
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDateString = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if an order was created today
  const isOrderCreatedToday = (order: Order): boolean => {
    if (!order.createdAt) return false;
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    return orderDate === getTodayDateString();
  };

  // Filter orders by status, search term, and time
  const filteredOrders = safeOrders
    .filter(order => {
      if (!searchTerm) return true;
      const tableName = tables[order.tableId]?.name || '';
      const searchTermLower = searchTerm.toLowerCase();
      return order.id?.toString().includes(searchTermLower) || 
             tableName.toLowerCase().includes(searchTermLower);
    })
    .filter(filterOrdersByTime)
    // Filter out PENDING and PROCESSING orders, they should only appear in the order queue
    .filter(order => order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED)
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()); // Newest first

  // Queue for pending and processing orders
  const orderQueue = getOrderQueue();

  // Cek apakah ada gap pada ID order
  let hasIdGap = false;
  if (filteredOrders.length > 1) {
    const sortedIds = filteredOrders.map(o => o.id).filter((id): id is number => id !== undefined).sort((a, b) => a - b);
    for (let i = 1; i < sortedIds.length; i++) {
      if (sortedIds[i] !== sortedIds[i - 1] + 1) {
        hasIdGap = true;
        break;
      }
    }
  }

  // Get order statistics
  const getOrderStats = () => {
    const pendingCount = filteredOrders.filter(order => order.status === OrderStatus.PENDING).length;
    const completedCount = filteredOrders.filter(order => order.status === OrderStatus.COMPLETED).length;
    
    // First calculate from items to have a reference value
    let itemBasedTotal = 0;
    filteredOrders
      .filter(order => order.status === OrderStatus.COMPLETED)
      .forEach(order => {
        if (order.orderItems && Array.isArray(order.orderItems)) {
          order.orderItems.forEach(item => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity) || 0;
            itemBasedTotal += price * quantity;
          });
        }
      });
    
    // Improved revenue calculation with aggressive scaling for IDR
    const totalRevenue = filteredOrders
      .filter(order => order.status === OrderStatus.COMPLETED)
      .reduce((sum, order) => {
        // Get the raw price
        const rawPrice = order.totalPrice;
        let orderTotal = 0;
        
        // For numeric values, use directly
        if (typeof rawPrice === 'number') {
          orderTotal = rawPrice;
        } 
        // For string values
        else if (typeof rawPrice === 'string') {
          const priceStr = rawPrice as string; // Type assertion
          if (priceStr.includes('Rp')) {
            // Clean currency symbols
            const cleanPrice = priceStr.replace(/[^0-9]/g, '');
            orderTotal = parseInt(cleanPrice, 10) || 0;
          } else {
            // Try direct conversion
            orderTotal = Number(priceStr) || 0;
          }
        }
        
        // CRITICAL FIX: For Indonesian Rupiah values
        // If the value seems too small (less than 1000), multiply by 1000
        if (orderTotal > 0 && orderTotal < 1000) {
          orderTotal *= 1000;
        }
        
        // Double-check against the item-based calculation
        if (itemBasedTotal > 10000 && orderTotal < 1000) {
          orderTotal *= 1000; // Apply additional scaling if needed
        }
        
        return sum + (orderTotal || 0);
      }, 0);
    
    // Final safety check - if our calculated revenue is suspiciously low
    // but we have a reasonable item-based total, use that instead
    let finalRevenue = totalRevenue;
    if (totalRevenue < 1000 && itemBasedTotal > 10000) {
      finalRevenue = itemBasedTotal;
    }
    
    // If the total still seems too small with multiple orders, apply scaling
    if (finalRevenue > 0 && finalRevenue < 1000 && completedCount > 0) {
      finalRevenue *= 1000;
    }
    
    return {
      pendingCount,
      completedCount,
      totalRevenue: finalRevenue
    };
  };
  
  const stats = getOrderStats();
  
  // Format helper functions to handle undefined values
  const safeDateFormat = (dateString?: string): string => {
    return dateString ? formatDate(dateString) : '-';
  };
  
  const safeDeleteOrder = (orderId?: number): void => {
    if (orderId !== undefined) {
      handleDeleteOrder(orderId);
    } else {
      console.error('Cannot delete order: ID is undefined');
      alert('Error: Cannot delete this order due to missing ID');
    }
  };
  
  const safeUpdateStatus = (orderId: number | undefined, status: OrderStatus): void => {
    if (orderId !== undefined) {
      handleUpdateOrderStatus(orderId, status);
    } else {
      console.error('Cannot update order status: ID is undefined');
      alert('Error: Cannot update this order due to missing ID');
    }
  };
  
  const handleCancelOrder = async (orderId: number) => {
    try {
      // Show confirmation dialog for cancelling order
      const confirmMessage = 'Apakah Anda yakin ingin membatalkan pesanan ini? Pastikan pesanan belum diproses oleh dapur.';
      setConfirmDialogData({
        orderId,
        action: 'cancel',
        message: confirmMessage
      });
      setIsConfirmDialogOpen(true);
    } catch (err) {
      console.error('Error in handleCancelOrder:', err);
      alert('Terjadi kesalahan saat membatalkan pesanan.');
    }
  };

  const handleCancelOrderRequest = async (orderId: number) => {
    try {
      console.log(`Cancelling order #${orderId}`);
      
      const cancelledOrder = await OrderAPI.cancelOrder(orderId);
      console.log('Successfully cancelled order:', cancelledOrder);
      
      // Update orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === cancelledOrder.id ? (cancelledOrder as Order) : order
        )
      );
      
      // Update selected order if open in modal
      if (selectedOrder && selectedOrder.id === cancelledOrder.id) {
        setSelectedOrder(cancelledOrder as Order);
      }
      
      // Show success message
      alert('Pesanan berhasil dibatalkan.');
      
      // Refresh the page to get the latest data
      window.location.reload();
      
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      alert(err.message || 'Gagal membatalkan pesanan. Silakan coba lagi.');
    }
  };
  
  const handleUpdateProcessedStatus = async (orderId: number, isProcessed: boolean) => {
    try {
      // Show confirmation dialog for updating processed status
      const confirmMessage = `Apakah Anda yakin ingin menandai pesanan ini sebagai ${isProcessed ? 'sudah' : 'belum'} diproses oleh dapur?`;
      setConfirmDialogData({
        orderId,
        action: 'process',
        message: confirmMessage
      });
      setIsConfirmDialogOpen(true);
      
      // Store the processed status in a ref to access it in the confirmation handler
      updateProcessedStatusRef.current = { orderId, isProcessed };
    } catch (err) {
      console.error('Error in handleUpdateProcessedStatus:', err);
      alert('Terjadi kesalahan saat memperbarui status proses pesanan.');
    }
  };
  
  const handleUpdateProcessedStatusRequest = async (orderId: number, isProcessed: boolean) => {
    try {
      console.log(`Updating order #${orderId} processed status to ${isProcessed}`);
      
      const updatedOrder = await OrderAPI.updateProcessedStatus(orderId, isProcessed);
      console.log('Successfully updated order processed status:', updatedOrder);
      
      // If marking as processed, also update order status to PROCESSING if it's currently PENDING
      if (isProcessed) {
        const orderToUpdate = orders.find(o => o.id === orderId);
        if (orderToUpdate && orderToUpdate.status === OrderStatus.PENDING) {
          await updateOrderStatusRequest(orderId, OrderStatus.PROCESSING);
        }
      }
      
      // Update orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === updatedOrder.id ? (updatedOrder as Order) : order
        )
      );
      
      // Update selected order if open in modal
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder as Order);
      }
      
      // Show success message
      alert(`Pesanan berhasil ditandai sebagai ${isProcessed ? 'sudah' : 'belum'} diproses oleh dapur.`);
      
    } catch (err: any) {
      console.error('Failed to update order processed status:', err);
      alert(err.message || 'Gagal memperbarui status proses pesanan. Silakan coba lagi.');
    }
  };
  
  // Handle confirmation dialog actions
  const handleConfirmDialogClose = () => {
    setIsConfirmDialogOpen(false);
    setConfirmDialogData(null);
  };

  const handleConfirmDialogConfirm = () => {
    if (confirmDialogData) {
      if (confirmDialogData.action === 'cancel') {
        handleCancelOrderRequest(confirmDialogData.orderId);
      } else if (confirmDialogData.action === 'process' && updateProcessedStatusRef.current) {
        const { orderId, isProcessed } = updateProcessedStatusRef.current;
        handleUpdateProcessedStatusRequest(orderId, isProcessed);
        updateProcessedStatusRef.current = null;
      } else if (confirmDialogData.status !== undefined) {
        updateOrderStatusRequest(confirmDialogData.orderId, confirmDialogData.status);
      }
      setIsConfirmDialogOpen(false);
      setConfirmDialogData(null);
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
          <div className="relative">
            <motion.div 
              className="h-28 w-28 mb-8 relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="h-full w-full rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
              <motion.div 
                className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-t-primary-500 dark:border-t-primary-400 border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              ></motion.div>
              <motion.div 
                className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-t-transparent border-r-primary-400 dark:border-r-primary-300 border-b-transparent border-l-transparent"
                animate={{ rotate: -180 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              ></motion.div>
            </motion.div>
            
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            >
              <div className="w-14 h-14 rounded-full bg-primary-500 dark:bg-primary-600 flex items-center justify-center text-white shadow-lg">
                <FaUtensils size={24} />
              </div>
            </motion.div>
          </div>
          
          <motion.p 
            className="text-gray-700 dark:text-gray-300 font-medium text-xl mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Loading Orders
          </motion.p>
          
          <motion.div 
            className="mt-2 text-gray-500 dark:text-gray-400 text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            Please wait while we fetch the latest data
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
            className="w-28 h-28 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-8 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ delay: 0.5, duration: 0.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1], repeat: 1 }}
            >
              <FaExclamationTriangle className="text-red-500 dark:text-red-400 text-5xl" />
            </motion.div>
          </motion.div>
          
          <motion.h2 
            className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Something Went Wrong
          </motion.h2>
          
          <motion.div 
            className="text-red-500 dark:text-red-400 mb-8 max-w-md mx-auto bg-red-50 dark:bg-red-900/20 p-5 rounded-xl border border-red-100 dark:border-red-800/30 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p>{error}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 flex items-center gap-2 justify-center"
              variant="primary"
              iconLeft={<FaSync size={16} />}
              elevation="floating"
            >
              Try Again
            </Button>
          </motion.div>
        </motion.div>
      );
    }
    
    if (safeOrders.length === 0) {
      return (
        <motion.div 
          className="text-center py-16 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-28 h-28 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-8 flex items-center justify-center relative overflow-hidden"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600"
              animate={{ 
                rotate: 360,
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{ 
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                backgroundPosition: { duration: 3, repeat: Infinity, repeatType: "reverse" }
              }}
            />
            <motion.div 
              className="relative z-10"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                repeatType: "reverse",
                ease: "easeInOut" 
              }}
            >
              <FaUtensils className="text-gray-400 dark:text-gray-500 text-5xl" />
            </motion.div>
          </motion.div>
          
          <motion.h2 
            className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            No Orders Available
          </motion.h2>
          
          <motion.p 
            className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Orders will appear here after customers place them. Check back later or refresh the page.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="primary"
              className="px-6 py-2.5"
              onClick={() => window.location.reload()}
              iconLeft={<FaSync size={16} />}
              elevation="floating"
            >
              Refresh
            </Button>
          </motion.div>
        </motion.div>
      );
    }
    
    // Render Order Queue first
    const orderQueueContent = renderOrderQueue();
    
    return (
      <div>
        {/* First render the order queue if there are pending orders */}
        {orderQueueContent}
        
        {/* Then render the order table */}
        <motion.div 
          className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {hasIdGap && (
            <motion.div 
              className="m-4 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg px-4 py-3 flex items-start"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <FaExclamationTriangle className="text-amber-500 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
              <p>Some orders may have been deleted, resulting in non-sequential ID numbers.</p>
            </motion.div>
          )}
          
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <motion.th 
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  Daily ID
                </motion.th>
                <motion.th 
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                >
                  Table
                </motion.th>
                <motion.th 
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  Customer
                </motion.th>
                <motion.th 
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                >
                  Items
                </motion.th>
                <motion.th 
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  Total
                </motion.th>
                <motion.th 
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                >
                  Status
                </motion.th>
                <motion.th 
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  Created At
                </motion.th>
                <motion.th 
                  className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.45 }}
                >
                  Actions
                </motion.th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {filteredOrders.map((order, index) => (
                <motion.tr 
                  key={order.id} 
                  className="hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * (index % 10) }}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <motion.span 
                      className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium px-2.5 py-1 rounded-md"
                      whileHover={{ scale: 1.05 }}
                    >
                      #{order.dailyOrderId || '-'}
                    </motion.span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaChair className="text-primary-400 dark:text-primary-500 mr-2" size={14} />
                      <span className="dark:text-gray-300">{tables[order.tableId]?.name || `Table ${order.tableId}`}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.customerName ? (
                      <div className="flex items-center">
                        <FaUser className="text-primary-400 dark:text-primary-500 mr-2" size={14} />
                        <span className="font-medium dark:text-gray-300">{order.customerName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">Not provided</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                      {order.orderItems?.length || 0} items
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium">
                      <FaMoneyBillWave className="text-gray-400 dark:text-gray-500 mr-2" size={14} />
                      {formatCurrency(Number(order.totalPrice))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(order.status)}
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {safeDateFormat(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1.5 font-medium"
                        onClick={() => handleViewOrder(order)}
                      >
                        <FaInfo size={14} />
                        View
                      </motion.button>
                      
                      {/* Cancel button only for PENDING orders */}
                      {order.status === OrderStatus.PENDING && (
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                          className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-red-100 dark:border-red-800/50 font-medium"
                          onClick={() => order.id && handleCancelOrder(order.id)}
                      >
                        <FaTimes size={14} />
                          Cancel
                      </motion.button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    );
  };
  
  const renderOrderQueue = () => {
    // Skip rendering if no pending or processing orders
    if (orderQueue.length === 0) {
      return null;
    }
  
    return (
      <motion.div 
        className="mb-8 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl shadow-md overflow-hidden border border-primary-200 dark:border-primary-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-700 dark:to-primary-800 text-white">
          <h3 className="text-lg font-bold flex items-center">
            <FaBell className="mr-2" /> Order Queue
            <motion.span 
              className="ml-2 bg-white dark:bg-white/20 text-primary-600 dark:text-primary-200 text-sm rounded-full px-2.5 py-0.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.3 }}
            >
              {orderQueue.length}
            </motion.span>
          </h3>
        </div>

        <div className="p-4">
          <div className="space-y-3">
            <AnimatePresence>
              {orderQueue.map((order, index) => (
                <motion.div 
                  key={order.id} 
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border ${
                    order.status === OrderStatus.PROCESSING 
                      ? 'border-blue-200 dark:border-blue-700' 
                      : 'border-gray-100 dark:border-gray-700'
                  }`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  whileHover={{ y: -4, boxShadow: "0 12px 20px -5px rgba(0, 0, 0, 0.1)" }}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <motion.div 
                        className={`w-12 h-12 rounded-full ${
                          order.status === OrderStatus.PROCESSING
                            ? 'bg-blue-500 dark:bg-blue-600'
                            : index === 0 
                              ? 'bg-primary-600 dark:bg-primary-500' 
                              : 'bg-primary-400 dark:bg-primary-600'
                        } text-white font-bold flex items-center justify-center mr-4`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        {index + 1}
                      </motion.div>
                      <div>
                        <div className="flex items-center mb-1">
                          <FaChair className="text-primary-400 dark:text-primary-500 mr-2" size={14} />
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {tables[order.tableId]?.name || `Table ${order.tableId}`}
                          </span>
                          <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                          <motion.span 
                            className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm px-2.5 py-0.5 rounded-md font-medium"
                            whileHover={{ scale: 1.05 }}
                          >
                            #{order.dailyOrderId || order.id}
                          </motion.span>
                          
                          {/* Status Badge */}
                          {order.status === OrderStatus.PROCESSING && (
                            <span className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-md font-medium">
                              Processing
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <FaUser className="text-gray-400 dark:text-gray-500 mr-1" size={12} />
                            <span>{order.customerName || 'Anonymous'}</span>
                          </div>
                          
                          <div className="flex items-center">
                            <FaTag className="text-gray-400 dark:text-gray-500 mr-1" size={12} />
                            <span>{order.orderItems?.length || 0} items</span>
                          </div>
                          
                          <div className="flex items-center font-medium text-primary-600 dark:text-primary-400">
                            <FaMoneyBillWave className="text-gray-400 dark:text-gray-500 mr-1" size={12} />
                            <span>{formatCurrency(Number(order.totalPrice))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  
                    <div className="flex gap-2">
                      {order.status === OrderStatus.PENDING && (
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm shadow-sm flex items-center gap-2 font-medium"
                          onClick={() => safeUpdateStatus(order.id, OrderStatus.PROCESSING)}
                        >
                          <FaUtensils size={14} />
                          Process
                        </motion.button>
                      )}
                    
                      {order.status === OrderStatus.PROCESSING && (
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm flex items-center gap-2 font-medium"
                        onClick={() => safeUpdateStatus(order.id, OrderStatus.COMPLETED)}
                      >
                        <FaCheck size={14} />
                        Complete
                      </motion.button>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-blue-100 dark:border-blue-800/50 font-medium"
                        onClick={() => handleViewOrder(order)}
                      >
                        <FaInfo size={14} />
                        View
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  };
  
  console.log('OrderPage - Rendering');
  
  return (
    <Layout>
      <div className="min-h-screen flex flex-col container mx-auto px-4 py-6 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Page Header with Animations */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="h-12 w-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400 flex items-center justify-center">
                <FaUtensils size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Order Management</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage and track customer orders</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex gap-3"
            >
              <Button
                variant="primary"
                onClick={() => navigate('/order-history')}
                className="flex items-center gap-2 px-5 py-2.5"
                iconLeft={<FaHistory size={16} />}
                elevation="floating"
              >
                Order History
              </Button>
              
              <Button
                variant="light"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2.5"
                iconLeft={<FaSync size={14} />}
              >
                Refresh
              </Button>
            </motion.div>
          </div>
          
          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div 
              key="pending"
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 flex items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mr-5 shadow-sm">
                <FaBell size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingCount}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Pending Orders</p>
              </div>
            </motion.div>
            
            <motion.div 
              key="completed"
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 flex items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mr-5 shadow-sm">
                <FaClipboardCheck size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completedCount}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Completed Orders</p>
              </div>
            </motion.div>
            
            <motion.div 
              key="revenue"
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 flex items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mr-5 shadow-sm">
                <FaMoneyBillWave size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalRevenue)}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Revenue</p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Filters */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 mb-8 flex flex-col md:flex-row md:items-center gap-4 border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            {/* Search input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <FaSearch size={16} />
              </span>
              <input
                type="text"
                placeholder="Search orders by table or id..."
                className="pl-12 pr-4 py-3 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-primary-300 dark:focus:border-primary-500 focus:ring focus:ring-primary-200 dark:focus:ring-primary-500/30 focus:ring-opacity-50 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Status filter */}
            <div className="flex-none md:w-52">
              <div className="relative inline-block w-full">
                <select
                  value={statusFilter || ''}
                  onChange={(e) => setStatusFilter(e.target.value || null)}
                  className="appearance-none pl-12 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-primary-300 dark:focus:border-primary-500 focus:ring focus:ring-primary-200 dark:focus:ring-primary-500/30 focus:ring-opacity-50 w-full transition-all shadow-sm"
                >
                  <option value="">All Status</option>
                  <option value={OrderStatus.PENDING}>Pending</option>
                  <option value={OrderStatus.PROCESSING}>Processing</option>
                  <option value={OrderStatus.COMPLETED}>Completed</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <FaFilter size={16} />
                </div>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          
            {/* Time filter */}
            <div className="flex-none md:w-52">
              <div className="relative inline-block w-full">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as 'today' | 'week' | 'month' | 'all')}
                  className="appearance-none pl-12 pr-10 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-primary-300 dark:focus:border-primary-500 focus:ring focus:ring-primary-200 dark:focus:ring-primary-500/30 focus:ring-opacity-50 w-full transition-all shadow-sm"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <FaCalendarAlt size={16} />
                </div>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      
        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${isLoading ? 'loading' : 'loaded'}-${error ? 'error' : 'success'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Custom Order Detail Modal ala Staff Edit User */}
      {isDetailModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Tombol silang di pojok kanan atas */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold focus:outline-none"
              onClick={() => setIsDetailModalOpen(false)}
              aria-label="Close order detail"
            >
              &times;
            </button>
            <div className="flex items-center mb-6">
              <div className="h-14 w-14 flex-shrink-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white mr-4 shadow-sm">
                <FaClipboardCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Order #{selectedOrder.dailyOrderId || selectedOrder.id}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${getStatusClass(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    • {safeDateFormat(selectedOrder.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-500 mb-1">Table</p>
                <p className="font-semibold text-gray-900">
                  {tables[selectedOrder.tableId]?.name || `#${selectedOrder.tableId}`}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="font-semibold text-gray-900">{formatCurrency(selectedOrder.totalPrice)}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                <p className="font-semibold text-gray-900">
                  {selectedOrder.customerName || 'Anonymous'}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <FaUtensils className="mr-2 text-primary-500" size={14} />
                  Order Items
                </h3>
                <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  {selectedOrder.orderItems?.length || 0} items
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {selectedOrder.orderItems.map((item, index) => (
                      <div key={index} className="p-3 flex justify-between items-center hover:bg-gray-100 transition-colors">
                        <div className="flex items-center">
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center mr-3 text-xs font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {menus[item.menuId]?.name || `Menu #${item.menuId}`}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs mr-1.5">
                                {item.quantity}x
                              </span>
                              <span>{formatCurrency(item.price)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary-600">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No items in this order
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end items-center gap-4 mt-6">
              <div className="text-lg font-bold text-primary-600">
                Total: {formatCurrency(selectedOrder.totalPrice)}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-8">
                  {selectedOrder.status === OrderStatus.PENDING && (
                    <>
                      <Button
                        variant="success"
                        onClick={() => {
                          setIsDetailModalOpen(false);
                          if (selectedOrder.id !== undefined) {
                            safeUpdateStatus(selectedOrder.id, OrderStatus.COMPLETED);
                          }
                        }}
                        className="px-3 py-2 text-sm"
                        iconLeft={<FaCheck size={14} />}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setIsDetailModalOpen(false);
                          if (selectedOrder.id !== undefined) {
                            handleCancelOrder(selectedOrder.id);
                          }
                        }}
                        className="px-3 py-2 text-sm"
                        iconLeft={<FaTimes size={14} />}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === OrderStatus.PROCESSING && (
                    <Button
                      variant="success"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        if (selectedOrder.id !== undefined) {
                          safeUpdateStatus(selectedOrder.id, OrderStatus.COMPLETED);
                        }
                      }}
                      className="px-3 py-2 text-sm"
                      iconLeft={<FaCheck size={14} />}
                    >
                      Complete
                    </Button>
                  )}
              <Button
                variant="light"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-3 py-2 text-sm"
              >
                Close
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  if (selectedOrder.id !== undefined) {
                    safeDeleteOrder(selectedOrder.id);
                  }
                }}
                className="px-3 py-2 text-sm"
                iconLeft={<FaTrash size={14} />}
              >
                Delete
              </Button>
            </div>
          </motion.div>
          </div>
        )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={handleConfirmDialogClose}
        onConfirm={handleConfirmDialogConfirm}
        title="Confirm Action"
        message={confirmDialogData?.message || ''}
      />
    </Layout>
  );
};

export default OrderPage; 