import React, { useEffect, useState, useRef } from 'react';
import { OrderAPI } from '../api/orderApi';
import type { OrderHistory } from '../types/order';
import { Link } from 'react-router-dom';
import { 
  formatCurrency, 
  formatDateForAPI, 
  createStartOfDay, 
  createEndOfDay, 
  isDateInRange, 
  calculateDateRange, 
  parseAPIDate 
} from '../utils/format';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaFilter, FaCalendarAlt, FaSync, FaTable, FaList, FaChartBar, FaMoneyBillWave, FaCreditCard, FaClipboardCheck, FaHistory, FaAngleLeft, FaExclamationTriangle } from 'react-icons/fa';

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<'orderId' | 'tableCode' | 'date' | 'all'>('date');
  
  // Initialize with a 30-day date range
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>(() => {
    return calculateDateRange(30);
  });

  // Load orders initially
  useEffect(() => {
    fetchOrders();
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Apply filters when orders, search or dates change
  useEffect(() => {
    if (orders.length > 0) {
    filterOrders();
    }
  }, [orders, searchTerm, searchField]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cancel any previous fetch
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      console.log('Fetching orders with API params:', {
        startDate: dateRange.start,
        endDate: dateRange.end,
        searchTerm: searchTerm || undefined,
        searchField: searchField !== 'all' ? searchField : undefined
      });
      
      const data = await OrderAPI.getOrderHistory({
        startDate: dateRange.start,
        endDate: dateRange.end,
        searchTerm: searchTerm || undefined,
        searchField: searchField !== 'all' ? searchField : undefined,
      });
      
      console.log('API returned', data?.length || 0, 'orders');
      
      // Ensure we have a valid array of orders
      const validOrders = Array.isArray(data) ? data : [];
      
      // Sort the orders by date (newest first)
      const sortedOrders = [...validOrders].sort((a, b) => {
        const dateA = new Date(a.completedAt || a.createdAt || 0);
        const dateB = new Date(b.completedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setOrders(sortedOrders);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to fetch order history';
      setError(errorMessage);
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };
  
  const filterOrders = () => {
    if (!orders.length) {
      setFilteredOrders([]);
      return;
    }

    let result = [...orders];

    // Apply date filter directly to what the API returned to ensure consistency
    if (searchField === 'date' || searchField === 'all') {
      console.log('Filtering by date range:', {
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      result = result.filter(order => {
        // Parse the order date from completedAt or createdAt, fallback to orderDate
        const orderDateStr = order.completedAt || order.createdAt || order.orderDate || '';
        
        // Use the shared utility function to check date range
        const inRange = isDateInRange(orderDateStr, dateRange.start, dateRange.end);
        
        if (!inRange) {
          console.debug(`Order ${order.orderId} with date ${orderDateStr} is outside range`);
        }
        
        return inRange;
      });
      
      console.log(`Date filtering: ${orders.length} → ${result.length} orders`);
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      result = result.filter(order => {
        if (searchField === 'orderId' || searchField === 'all') {
          if (order.orderId?.toString().includes(term)) return true;
        }

        if (searchField === 'tableCode' || searchField === 'all') {
          if (
            order.tableCode?.toLowerCase().includes(term) ||
            order.tableName?.toLowerCase().includes(term)
          )
            return true;
        }

        return false;
      });
      
      console.log(`Term filtering: ${term} → ${result.length} orders`);
    }

    console.log('Final filtered orders count:', result.length);
    setFilteredOrders(result);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSearchField('date');
    
    // Default to last 30 days with consistent date formatting
    const newDateRange = calculateDateRange(30);
    
    console.log('Resetting to date range:', newDateRange);
    setDateRange(newDateRange);
    
    // Set loading immediately
    setLoading(true);
    
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Fetch with a small delay to prevent race conditions
    fetchTimeoutRef.current = setTimeout(() => {
      fetchOrders();
    }, 300);
  };

  // Re-fetch orders when date range changes
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    console.log(`Date range changed: ${type} = ${value}`);
    
    // Handle empty input
    if (!value || value.trim() === '') {
      console.error('Empty date value received');
      return;
    }
    
    // Make sure the dates make sense (start not after end)
    let newStart = type === 'start' ? value : dateRange.start;
    let newEnd = type === 'end' ? value : dateRange.end;
    
    try {
      // Parse dates for validation
      const startDate = parseAPIDate(newStart);
      const endDate = parseAPIDate(newEnd);
      
      // If dates are invalid, throw error
      if (!startDate || !endDate) {
        throw new Error('Invalid date format');
      }
      
      // If start date is after end date, adjust
      if (startDate > endDate) {
        if (type === 'start') {
          newEnd = newStart;
        } else {
          newStart = newEnd;
        }
        console.log('Date range adjusted:', { newStart, newEnd });
      }
    } catch (err) {
      console.error('Date validation error:', err);
      return;
    }
    
    // Avoid unnecessary fetches if nothing changed
    if (newStart === dateRange.start && newEnd === dateRange.end) {
      console.log('Date range unchanged, skipping update');
      return;
    }
    
    const newDateRange = { 
      start: newStart, 
      end: newEnd 
    };
    
    // Update state first
    setDateRange(newDateRange);
    
    // Set loading state immediately
    setLoading(true);
    
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Fetch with a delay to prevent race conditions
    fetchTimeoutRef.current = setTimeout(() => {
      console.log('Fetching orders with new date range:', newDateRange);
      fetchOrders();
    }, 300);
  };

  return (
    <div className="container mx-auto p-6">
      <motion.div 
        className="bg-white shadow-xl rounded-xl p-8 mb-6 border border-gray-100"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Order History
            </h1>
            <p className="text-gray-600">View completed orders and search by different criteria</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
          <Link
            to="/admin/orders"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
              <FaAngleLeft />
              <span>Back to Orders</span>
          </Link>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
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
              <FaClipboardCheck size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{filteredOrders.length}</h3>
              <p className="text-gray-500 text-sm">Total Orders</p>
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
              <FaMoneyBillWave size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {formatCurrency((() => {
                  // Calculate total from filtered orders
                  const manualTotal = filteredOrders.reduce((sum, order) => {
                    let orderValue = 0;
                    const rawPrice = order.totalPrice;
                    
                    // If it's already a number, use it
                    if (typeof rawPrice === 'number') {
                      orderValue = rawPrice;
                    } 
                    // If it's a string, parse it manually
                    else if (typeof rawPrice === 'string') {
                      // Remove Rp prefix if present
                      let priceStr = rawPrice;
                      if (priceStr.includes('Rp')) {
                        priceStr = priceStr.replace('Rp', '').trim();
                      }
                      
                      // Remove all non-digits except dots or commas
                      priceStr = priceStr.replace(/[^\d.,]/g, '');
                      
                      // Replace comma with dot for decimal if needed
                      priceStr = priceStr.replace(',', '.');
                      
                      // Indonesian format uses "." as thousand separators
                      if (priceStr.includes('.')) {
                        const parts = priceStr.split('.');
                        if (parts.length > 1 && parts[parts.length-1].length === 3) {
                            priceStr = parts.join('');
                        }
                      }
                      
                      // Parse the final string to a number
                      orderValue = parseFloat(priceStr) || 0;
                    }
                    
                    return sum + orderValue;
                  }, 0);
                  
                  return manualTotal;
                })())}
              </h3>
              <p className="text-gray-500 text-sm">Total Revenue</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-4">
              <FaTable size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {new Set(filteredOrders.map(order => order.tableCode)).size}
              </h3>
              <p className="text-gray-500 text-sm">Unique Tables</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Filters Section */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search By</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <FaFilter size={14} />
                </div>
            <select
              value={searchField}
              onChange={e => setSearchField(e.target.value as any)}
                  className={`appearance-none pl-10 pr-8 py-2.5 rounded-lg border ${loading ? 'bg-gray-100 border-gray-200 text-gray-500' : 'border-gray-200 text-gray-700'} focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-white text-sm w-full transition-all`}
                  disabled={loading}
            >
                  <option value="date">Date Range</option>
              <option value="all">All Fields</option>
              <option value="orderId">Order ID</option>
              <option value="tableCode">Table Code/Name</option>
            </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
          </div>

          {searchField !== 'date' && (
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Orders</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaSearch size={14} />
                  </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by ID or table..."
                    className={`pl-10 pr-4 py-2.5 w-full rounded-lg border ${loading ? 'bg-gray-100 border-gray-200 text-gray-500' : 'border-gray-200'} focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm transition-all`}
                    disabled={loading}
              />
                </div>
            </div>
          )}

            <div className="md:col-span-2">
                <div className="flex justify-between items-end">
                <div className="w-1/2 pr-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FaCalendarAlt size={14} />
                      </div>
                  <input
                    type="date"
                    value={dateRange.start}
                      onChange={e => handleDateChange('start', e.target.value)}
                      className={`pl-10 pr-4 py-2.5 w-full rounded-lg border ${loading ? 'bg-gray-100 border-blue-200' : 'border-gray-200'} focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm transition-all`}
                      disabled={loading}
                  />
                    {loading && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      </div>
                    )}
                    </div>
                </div>
                <div className="w-1/2 pl-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FaCalendarAlt size={14} />
                      </div>
                  <input
                    type="date"
                    value={dateRange.end}
                      onChange={e => handleDateChange('end', e.target.value)}
                      className={`pl-10 pr-4 py-2.5 w-full rounded-lg border ${loading ? 'bg-gray-100 border-blue-200' : 'border-gray-200'} focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-sm transition-all`}
                      disabled={loading}
                  />
                    {loading && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                      </div>
                    )}
                </div>
                  </div>
              </div>
            </div>

          <div className="flex items-end">
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              onClick={resetFilters}
                className={`w-full py-2.5 ${loading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg transition-colors flex items-center justify-center gap-2`}
                disabled={loading}
            >
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-gray-400 rounded-full border-t-transparent"></div>
                ) : (
                <FaSync size={14} />
                )}
                <span>Reset Filters</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Results ({filteredOrders.length} orders)</h2>
          <div className="text-sm text-gray-500">
            Showing orders from {new Date(dateRange.start).toLocaleDateString()} to{' '}
            {new Date(dateRange.end).toLocaleDateString()}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30 flex justify-center">
              <FaExclamationTriangle />
            </div>
            <p className="text-gray-500 mb-4">No orders found for the selected date range</p>
            <p className="text-gray-400 text-sm">Try adjusting your filters or date range</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">#{order.orderId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium">{order.tableName}</span>
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{order.tableCode}</span>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">{order.totalPrice}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(order.completedAt || order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
