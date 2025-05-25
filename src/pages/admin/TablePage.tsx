import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TableAPI } from '../../api';
import { useAuthStore } from '../../store';
import type { Table } from '../../types';
import { TableStatus } from '../../types';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import TableForm from '../../components/TableForm';
import QRCodeGenerator from '../../components/QRCodeGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSync, FaSearch, FaChair, FaFilter, FaQrcode, FaEdit, FaTrash, FaUsers, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaChartBar, FaDoorOpen, FaDoorClosed, FaClock, FaHistory, FaTag } from 'react-icons/fa';

const TablePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();
  
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
  
  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);
  
  // Fetch tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        const data = await TableAPI.getAll();
        
        // Ensure data is an array
        const tableArray = Array.isArray(data) ? data : [];
        console.log('TablePage - Tables fetched:', tableArray.length);
        
        setTables(tableArray);
      } catch (err) {
        console.error('Failed to fetch tables:', err);
        setError('Failed to load tables. Please try again later.');
        // Initialize with empty array on error
        setTables([]);
      } finally {
        setIsLoading(false);
      }
    };
    
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
        setError('Capacity must be at least 1');
        return;
      }
      
      const newTable = await TableAPI.create(tableData);
      setTables([...tables, newTable]);
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('Failed to add table:', err);
      
      // Set a more specific error message
      if (err.message) {
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
    } catch (err) {
      console.error('Failed to update table:', err);
      alert('Failed to update table. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteTable = async (tableId: number) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    
    try {
      await TableAPI.delete(tableId);
      
      // Remove from state - ensure tables is an array first
      const currentTables = Array.isArray(tables) ? tables : [];
      setTables(currentTables.filter(table => table.id !== tableId));
    } catch (err) {
      console.error('Failed to delete table:', err);
      alert('Failed to delete table. Please try again.');
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
  
  const getStatusClass = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return 'bg-green-100 text-green-800';
      case TableStatus.OCCUPIED:
        return 'bg-red-100 text-red-800';
      case TableStatus.RESERVED:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            Loading tables...
          </motion.p>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 flex items-center gap-2 justify-center"
            >
              <FaSync size={14} /> Try Again
            </Button>
          </motion.div>
        </motion.div>
      );
    }
    
    if (safeTables.length === 0) {
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
            <FaChair className="text-gray-400 text-3xl" />
          </motion.div>
          
          <motion.h2 
            className="text-2xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            No tables available
          </motion.h2>
          
          <motion.p 
            className="text-gray-500 mb-6 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Create your first table to get started
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={handleAddButtonClick}
              className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-2 flex items-center gap-2 justify-center"
            >
              <FaPlus size={14} /> Add New Table
            </Button>
          </motion.div>
        </motion.div>
      );
    }
    
    if (filteredTables.length === 0) {
      return (
        <motion.div 
          className="text-center py-16 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-20 h-20 bg-yellow-100 rounded-full mx-auto mb-6 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <FaSearch className="text-yellow-500 text-3xl" />
          </motion.div>
          
          <motion.h2 
            className="text-2xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            No matching tables
          </motion.h2>
          
          <motion.p 
            className="text-gray-500 mb-6 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Try adjusting your search or filter criteria
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-6 py-2 flex items-center gap-2 justify-center"
              variant="secondary"
            >
              <FaSync size={14} /> Clear Filters
            </Button>
          </motion.div>
        </motion.div>
      );
    }
    
    return (
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {filteredTables.map((table, index) => (
          <motion.div 
            key={table.id} 
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * (index % 6) }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <FaChair className="text-red-400 mr-2" /> {table.name}
                </h3>
                <div className={`px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${getStatusClass(table.status)}`}>
                  {table.status === TableStatus.AVAILABLE && <FaCheckCircle size={12} />}
                  {table.status === TableStatus.OCCUPIED && <FaTimesCircle size={12} />}
                  {table.status === TableStatus.RESERVED && <FaClock size={12} />}
                  {table.status}
                </div>
              </div>
            </div>
            
            <div className="p-5">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2">
                    <FaUsers className="text-gray-400" size={14} />
                    Capacity
                  </span>
                  <span className="font-medium text-gray-800">{table.capacity} {table.capacity > 1 ? 'people' : 'person'}</span>
              </div>
              
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-2">
                    <FaTag className="text-gray-400" size={14} />
                    ID
                  </span>
                  <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">#{table.id}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border border-blue-100"
                  onClick={() => handleShowQRCode(table)}
                >
                  <FaQrcode size={14} />
                  QR Code
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border border-gray-200"
                  onClick={() => handleEditTable(table)}
                >
                  <FaEdit size={14} />
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border border-red-100"
                  onClick={() => handleDeleteTable(table.id)}
                >
                  <FaTrash size={14} />
                  Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };
  
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
              Table Management
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex gap-2"
            >
            <Button 
                variant="primary"
              onClick={handleAddButtonClick} 
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 shadow-md"
              >
                <FaPlus size={16} />
                <span>Add Table</span>
            </Button>
              
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200"
              >
                <FaSync size={14} />
                <span>Refresh</span>
              </Button>
            </motion.div>
          </div>
          
          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div 
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                <FaChartBar size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{stats.totalTables}</h3>
                <p className="text-gray-500 text-sm">Total Tables</p>
            </div>
            </motion.div>
          
            <motion.div 
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-4">
                <FaDoorOpen size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{stats.availableTables}</h3>
                <p className="text-gray-500 text-sm">Available Tables</p>
            </div>
            </motion.div>
          
            <motion.div 
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="w-12 h-12 rounded-lg bg-red-100 text-red-600 flex items-center justify-center mr-4">
                <FaDoorClosed size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{stats.occupiedTables}</h3>
                <p className="text-gray-500 text-sm">Occupied Tables</p>
            </div>
            </motion.div>
          
            <motion.div 
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-4">
                <FaUsers size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{stats.totalCapacity}</h3>
                <p className="text-gray-500 text-sm">Total Capacity</p>
            </div>
            </motion.div>
          </motion.div>
        
          {/* Filters */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {/* Search input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <FaSearch size={14} />
              </span>
              <input
                type="text"
                placeholder="Search tables by name or id..."
                className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          
            {/* Status filter */}
            <div className="flex-none">
              <div className="relative inline-block w-full md:w-auto">
            <select
              value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TableStatus | 'all')}
                  className="appearance-none pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50 bg-white text-sm w-full transition-all"
            >
              <option value="all">All Status</option>
              <option value={TableStatus.AVAILABLE}>Available</option>
              <option value={TableStatus.OCCUPIED}>Occupied</option>
              <option value={TableStatus.RESERVED}>Reserved</option>
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
          </motion.div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${isLoading ? 'loading' : 'loaded'}-${error ? 'error' : 'success'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
      {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Add/Edit Table Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={selectedTable ? 'Edit Table' : 'Add New Table'}
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
        title="Table QR Code"
      >
        {selectedTable && (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <h3 className="text-lg mb-2 font-bold text-gray-800">{selectedTable.name}</h3>
            <p className="text-sm text-gray-600 mb-6">
              Capacity: {selectedTable.capacity} {selectedTable.capacity > 1 ? 'people' : 'person'}
            </p>
            
            <div className="mx-auto max-w-xs bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <QRCodeGenerator tableId={selectedTable.id} tableName={selectedTable.name} />
            </div>
            
            <div className="mt-6 text-sm text-gray-600">
              <p>Scan this QR code with a mobile device to place an order.</p>
            </div>
          </motion.div>
        )}
      </Modal>
    </Layout>
  );
};

export default TablePage; 