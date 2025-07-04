import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Layout from '../../components/Layout';
import { TableAPI } from '../../api';
import type { Table } from '../../types';
import { TableStatus } from '../../types';
import { useAuthStore } from '../../store';
import Modal from '../../components/Modal';
import TableForm from '../../components/TableForm';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSync, FaSearch, FaChair, FaFilter, FaQrcode, FaEdit, FaTrash, FaUsers, FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaTable, FaPencilAlt } from 'react-icons/fa';
import { useAlert } from '../../contexts/AlertContext';
import ConfirmationDialog from '../../components/ConfirmationDialog';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05 
    } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 400, 
      damping: 30 
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({ 
    opacity: 1, 
    y: 0,
    transition: { 
      delay: custom * 0.1,
      duration: 0.5,
      ease: "easeOut" as const
    }
  }),
  hover: { 
    y: -8, 
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { duration: 0.3, ease: "easeOut" as const }
  }
};

// Add new animation variants for enhanced UI
const buttonVariants = {
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95
  }
};

const TablePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const { showAlert } = useAlert();
  
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Add confirmation dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<number | null>(null);
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);
  
  // Fetch tables
  const fetchTables = async () => {
    try {
      setIsLoading(true);
      setRefreshing(true);
      const data = await TableAPI.getAll();
      
      // Ensure data is an array
      const tableArray = Array.isArray(data) ? data : [];
      console.log('TablePage - Tables fetched:', tableArray.length);
      
      setTables(tableArray);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setError('Failed to load tables. Please try again later.');
      // Initialize with empty array on error
      setTables([]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setRefreshing(false), 500);
    }
  };
  
  useEffect(() => {
    fetchTables();
  }, []);
  
  const handleAddTable = async (tableData: Omit<Table, 'id'>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Additional validation
      if (!tableData.name || tableData.name.trim() === '') {
        setError('Table name is required');
        return;
      }
      
      if (!tableData.capacity || tableData.capacity < 1) {
        setError('Capacity must be at least 1 person');
        return;
      }
      
      const newTable = await TableAPI.create(tableData);
      setTables([...tables, newTable]);
      setIsFormModalOpen(false);
      
      // Show success notification
      showAlert('Table added successfully!', {
        type: 'success',
        duration: 3000
      });
    } catch (err: unknown) {
      console.error('Failed to add table:', err);
      
      // Set a more specific error message
      if (err instanceof Error && err.message) {
        setError(`Failed to add table: ${err.message}`);
      } else {
        setError('Failed to add table. Please try again later.');
      }
      
      // Keep the modal open
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateTable = async (tableData: Partial<Table>) => {
    if (!selectedTable) return;
    
    try {
      setIsSubmitting(true);
      const updatedTable = await TableAPI.update(selectedTable.id, tableData);
      
      // Update tables list - ensure tables is an array first
      const currentTables = Array.isArray(tables) ? tables : [];
      setTables(currentTables.map(table => 
        table.id === updatedTable.id ? updatedTable : table
      ));
      
      setIsFormModalOpen(false);
      setSelectedTable(null);
      
      // Show success notification
      showAlert('Table updated successfully!', {
        type: 'success',
        duration: 3000
      });
    } catch (err) {
      console.error('Failed to update table:', err);
      setError('Failed to update table. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteTable = async (tableId: number) => {
    setIsConfirmDialogOpen(false);
    
    try {
      await TableAPI.delete(tableId);
      
      // Remove from state - ensure tables is an array first
      const currentTables = Array.isArray(tables) ? tables : [];
      setTables(currentTables.filter(table => table.id !== tableId));
      
      // Show success notification
      showAlert('Table deleted successfully!', {
        type: 'success',
        duration: 3000
      });
    } catch (err) {
      console.error('Failed to delete table:', err);
      showAlert('Failed to delete table. Please try again.', {
        type: 'warning',
        duration: 3000
      });
    }
  };
  
  const handleEditTable = (table: Table) => {
    setSelectedTable(table);
    setIsFormModalOpen(true);
  };
  
  const handleAddButtonClick = () => {
    setSelectedTable(null);
    setIsFormModalOpen(true);
  };
  
  const handleShowQRCode = (table: Table) => {
    setSelectedTable(table);
    setIsQRModalOpen(true);
  };
  
  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs flex items-center">
            <FaCheckCircle className="mr-1" size={10} /> Available
          </span>
        );
      case TableStatus.OCCUPIED:
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs flex items-center">
            <FaTimesCircle className="mr-1" size={10} /> Occupied
          </span>
        );
      case TableStatus.RESERVED:
        return (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center">
            <FaTimesCircle className="mr-1" size={10} /> Reserved
          </span>
        );
      default:
        return null;
    }
  };

  // Ensure tables is an array
  const safeTables = Array.isArray(tables) ? tables : [];

  // Get table statistics
  const getTableStats = () => {
    const totalTables = safeTables.length;
    const availableTables = safeTables.filter(table => table.status === TableStatus.AVAILABLE).length;
    const occupiedTables = safeTables.filter(table => table.status === TableStatus.OCCUPIED).length;
    const reservedTables = safeTables.filter(table => table.status === TableStatus.RESERVED).length;
    
    const totalCapacity = safeTables.reduce((sum, table) => sum + table.capacity, 0);
    
    return {
      totalTables,
      availableTables,
      occupiedTables,
      reservedTables,
      totalCapacity
    };
  };

  const stats = getTableStats();

  // Filter tables
  const filteredTables = safeTables
    .filter(table => {
      if (statusFilter === 'all') return true;
      return table.status === statusFilter;
    })
    .filter(table => {
      if (!searchTerm) return true;
      const searchTermLower = searchTerm.toLowerCase();
      return table.name.toLowerCase().includes(searchTermLower) || 
             table.id.toString().includes(searchTermLower);
    });
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Dashboard Header */}
        <div className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <motion.div 
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <motion.span 
                    className="text-primary-500 mr-3"
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <FaTable className="inline-block" />
                  </motion.span>
                  Table Management
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add, edit and manage restaurant tables
                </p>
              </div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex gap-2"
              >
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button
                    variant="primary"
                    onClick={handleAddButtonClick}
                    className="flex items-center gap-2 px-6 py-2.5 shadow-lg transition-all duration-300"
                    iconLeft={<FaPlus size={16} />}
                  >
                    <span>Add Table</span>
                  </Button>
                </motion.div>
                
                <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                  <Button
                    variant="secondary"
                    onClick={fetchTables}
                    isLoading={refreshing}
                    className="flex items-center gap-2 px-6 py-2.5 shadow-sm transition-all duration-300"
                    iconLeft={<FaSync size={16} className={refreshing ? "animate-spin" : ""} />}
                  >
                    <span>Refresh</span>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Summary Cards */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              custom={1}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tables</p>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                      {stats.totalTables}
                    </h3>
                  </div>
                  <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center shadow-inner">
                    <FaTable className="text-xl text-primary-500" />
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              custom={2}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Tables</p>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                      {stats.availableTables}
                    </h3>
                  </div>
                  <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center shadow-inner">
                    <FaCheckCircle className="text-xl text-green-500" />
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              custom={3}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupied Tables</p>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                      {stats.occupiedTables}
                    </h3>
                  </div>
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shadow-inner">
                    <FaUsers className="text-xl text-red-500" />
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              custom={4}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reserved Tables</p>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                      {stats.reservedTables}
                    </h3>
                  </div>
                  <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shadow-inner">
                    <FaChair className="text-xl text-amber-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Search and Filter Section */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 mb-8 border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg mr-3">
                <FaFilter className="text-primary-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Search & Filter</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaSearch size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Search tables by name or ID..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900 focus:border-primary-500 dark:focus:border-primary-700 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={statusFilter === "all" ? "primary" : "secondary"}
                  onClick={() => setStatusFilter('all')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${
                    statusFilter === "all" 
                      ? 'shadow-lg shadow-primary-500/30' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  rounded="full"
                  size="sm"
                >
                  <span>All Tables</span>
                </Button>
                
                <Button
                  variant={statusFilter === TableStatus.AVAILABLE ? "primary" : "secondary"}
                  onClick={() => setStatusFilter(TableStatus.AVAILABLE)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${
                    statusFilter === TableStatus.AVAILABLE 
                      ? 'shadow-lg shadow-primary-500/30' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  rounded="full"
                  size="sm"
                >
                  <FaCheckCircle size={14} />
                  <span>Available</span>
                </Button>
                
                <Button
                  variant={statusFilter === TableStatus.OCCUPIED ? "primary" : "secondary"}
                  onClick={() => setStatusFilter(TableStatus.OCCUPIED)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${
                    statusFilter === TableStatus.OCCUPIED 
                      ? 'shadow-lg shadow-primary-500/30' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  rounded="full"
                  size="sm"
                >
                  <FaUsers size={14} />
                  <span>Occupied</span>
                </Button>
                
                <Button
                  variant={statusFilter === TableStatus.RESERVED ? "primary" : "secondary"}
                  onClick={() => setStatusFilter(TableStatus.RESERVED)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-300 ${
                    statusFilter === TableStatus.RESERVED 
                      ? 'shadow-lg shadow-primary-500/30' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  rounded="full"
                  size="sm"
                >
                  <FaChair size={14} />
                  <span>Reserved</span>
                </Button>
              </div>
            </div>
          </motion.div>
          
          {/* Table cards */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 flex flex-col items-center justify-center h-64 border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative h-16 w-16 mb-4">
                  <div className="h-full w-full rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
                  <motion.div 
                    className="absolute top-0 left-0 h-full w-full rounded-full border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  ></motion.div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">Loading tables...</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Please wait while we process your request</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                key="error"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-red-200 dark:border-red-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div 
                    className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <FaExclamationCircle className="text-3xl text-red-500 dark:text-red-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Failed to Load Tables</h3>
                  <p className="text-red-600 dark:text-red-400 mb-6 max-w-md">{error}</p>
                  <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                    <Button
                      variant="primary"
                      onClick={fetchTables}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-lg transition-all duration-300"
                    >
                      Try Again
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            ) : filteredTables.length === 0 ? (
              <motion.div 
                key="empty"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div 
                    className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4"
                    initial={{ scale: 0.8, rotateY: 0 }}
                    animate={{ scale: 1, rotateY: 360 }}
                    transition={{ duration: 1.5, type: "spring" }}
                  >
                    <FaTable className="text-3xl text-amber-500 dark:text-amber-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No Tables Found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                    {tables.length === 0 
                      ? "Add your first table to get started" 
                      : "No tables match your search criteria"}
                  </p>
                  
                  {tables.length === 0 ? (
                    <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                      <Button
                        variant="primary"
                        onClick={handleAddButtonClick}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-lg transition-all duration-300"
                        iconLeft={<FaPlus size={16} />}
                      >
                        Add First Table
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                        }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-sm transition-all duration-300"
                        iconLeft={<FaFilter size={16} />}
                      >
                        Clear Filters
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="table-list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTables.map((table, index) => (
                    <motion.div
                      key={table.id}
                      custom={index}
                      variants={cardVariants}
                      whileHover="hover"
                      initial="hidden"
                      animate="visible"
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transform-gpu"
                      layoutId={`table-card-${table.id}`}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <motion.div 
                              className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 ${
                                table.status === TableStatus.AVAILABLE 
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  : table.status === TableStatus.OCCUPIED
                                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <FaChair size={20} />
                            </motion.div>
                            <div>
                              <motion.h3 
                                className="text-lg font-bold text-gray-800 dark:text-white"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 + 0.2 }}
                              >
                                {table.name}
                              </motion.h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">ID: {table.id}</p>
                            </div>
                          </div>
                          {getStatusLabel(table.status)}
                        </div>
                        
                        <div className="flex items-center mb-4">
                          <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            <FaUsers className="text-primary-500 mr-2" size={14} />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Capacity: {table.capacity}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleShowQRCode(table)} 
                              className="flex items-center gap-1.5 px-3 py-1.5"
                              iconLeft={<FaQrcode size={14} />}
                            >
                              QR Code
                            </Button>
                          </motion.div>
                          
                          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleEditTable(table)} 
                              className="flex items-center gap-1.5 px-3 py-1.5"
                              iconLeft={<FaEdit size={14} />}
                            >
                              Edit
                            </Button>
                          </motion.div>
                          
                          <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setTableToDelete(table.id);
                                setIsConfirmDialogOpen(true);
                              }} 
                              className="flex items-center gap-1.5 px-3 py-1.5"
                              iconLeft={<FaTrash size={14} />}
                            >
                              Delete
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Form Modal */}
          <Modal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            title={selectedTable ? `Edit ${selectedTable.name}` : 'Add New Table'}
            size="md"
            icon={selectedTable ? <FaPencilAlt size={18} /> : <FaPlus size={18} />}
          >
            <TableForm
              initialData={selectedTable || undefined}
              onSubmit={selectedTable ? handleUpdateTable : handleAddTable}
              onCancel={() => setIsFormModalOpen(false)}
              isSubmitting={isSubmitting}
              error={error}
            />
          </Modal>
          
          {/* QR Code Modal */}
          <Modal
            isOpen={isQRModalOpen}
            onClose={() => setIsQRModalOpen(false)}
            title={`QR Code for ${selectedTable?.name || ''}`}
            size="md"
            icon={<FaQrcode size={18} />}
          >
            {selectedTable && (
              <QRCodeGenerator tableId={selectedTable.id} tableName={selectedTable.name} />
            )}
          </Modal>
          
          {/* Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={isConfirmDialogOpen}
            onClose={() => setIsConfirmDialogOpen(false)}
            onConfirm={() => {
              if (tableToDelete !== null) {
                handleDeleteTable(tableToDelete);
              }
            }}
            message="Are you sure you want to delete this table?"
            title="Confirm Deletion"
            confirmText="Delete"
            cancelText="Cancel"
            type="warning"
          />
        </div>
      </div>
    </Layout>
  );
};

export default TablePage; 