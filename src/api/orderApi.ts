import type { Order, OrderHistory, DailyOrderCounter, CreateOrder, OrderItem } from '../types/order';
import type { Table, Menu } from '../types';
import { OrderStatus } from '../types';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import api from './axios';
import { createStartOfDay, createEndOfDay, isDateInRange } from '../utils/format';

// Create a specialized function to handle order status updates with retries
const updateOrderStatusWithRetry = async (id: number, status: any): Promise<Order> => {
  // Maximum number of retries
  const MAX_RETRIES = 3;
  // Initial delay in ms (will be doubled each retry)
  let delay = 500;
  
  // Try different payload formats
  const payloadFormats = [
    // Format 1: Use the status directly
    { status },
    // Format 2: Ensure it's a string and uppercase
    { status: typeof status === 'string' ? status.toUpperCase() : String(status).toUpperCase() },
    // Format 3: Raw string without property name transformation
    { "status": status.toString().toUpperCase() }
  ];
  
  // Try different endpoints
  const endpoints = [
    `/orders/${id}/status`,
    `/orders/${id}`
  ];
  
  // Try combinations of endpoints and payload formats
  for (let endpoint of endpoints) {
    for (let payload of payloadFormats) {
      let retries = 0;
      
      console.log(`Trying endpoint: ${endpoint} with payload:`, payload);
      
      // Retry loop
      while (retries < MAX_RETRIES) {
        try {
          console.log(`Attempt ${retries + 1}/${MAX_RETRIES} to ${endpoint}`);
          const response = await api.put<Order>(endpoint, payload);
          console.log('Success!', response.data);
          return response.data;
        } catch (error: any) {
          if (error.response?.status === 400) {
            console.error(`400 error on attempt ${retries + 1}:`, error.response.data);
            
            // Check for specific error messages
            const errorMsg = error.response.data?.message || '';
            if (errorMsg.includes('invalid') || errorMsg.includes('format')) {
              console.log('Format error detected, trying next payload format');
              break; // Try next payload format
            }
          }
          
          retries++;
          
          if (retries >= MAX_RETRIES) {
            console.log(`All ${MAX_RETRIES} attempts failed for endpoint ${endpoint} with payload`, payload);
            break;
          }
          
          // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Double the delay for next retry
        }
      }
    }
  }
  
  // If we've tried all combinations and nothing worked, throw an error
  throw new Error(`Failed to update order #${id} status to ${status} after trying all methods`);
};

export const OrderAPI = {
  getAll: async (status?: string): Promise<Order[]> => {
    try {
      // The correct endpoint is /api/orders
      let url = '/orders';
      
      // Add query parameter for status if provided
      if (status) {
        url += `?status=${status}`;
      }
      
      console.log(`OrderAPI.getAll: Fetching from ${url}`);
      const response = await api.get(url);
      
      if (!response.data) {
        console.warn('OrderAPI.getAll: Empty response data');
        return [];
      }
      
    return response.data;
    } catch (error) {
      console.error('OrderAPI.getAll error:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Order> => {
    try {
      // The correct endpoint is /api/orders/:id
    const response = await api.get(`/orders/${id}`);
    return response.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  },

  create: async (data: any): Promise<Order> => {
    try {
      // Pastikan data memiliki properti yang dibutuhkan
      if (!data.tableId) {
        throw new Error('Table ID is required');
      }
      
      // Periksa items atau orderItems (mendukung kedua format)
      const orderItems = data.items || data.orderItems;
      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        throw new Error('At least one order item is required');
      }
      
      // The correct endpoint is /api/orders
      console.log('Sending order data to API:', data);
      const response = await api.post('/orders', data);
      console.log('Order API response:', response.data);
    return response.data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
      }
      if (error.response?.data?.message || error.response?.data?.error) {
        throw new Error(error.response.data.message || error.response.data.error);
      }
      throw error;
    }
  },

  update: async (id: number, data: Partial<Order>): Promise<Order> => {
    // The correct endpoint is /api/orders/:id
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    try {
      console.log(`Updating order #${id} status to ${status}`);
      
      // Use the specialized retry function
      return await updateOrderStatusWithRetry(id, status);
    } catch (error: any) {
      console.error('Error in updateStatus:', error);
      
      // Create a more descriptive error message
      let errorMessage = `Failed to update order #${id} status to ${status}`;
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  },

  updateProcessedStatus: async (id: number, isProcessed: boolean): Promise<Order> => {
    try {
      console.log(`Updating order #${id} processed status to ${isProcessed}`);
      const response = await api.patch(`/orders/${id}/processed`, { isProcessed });
      return response.data;
    } catch (error: any) {
      console.error('Error updating processed status:', error);
      let errorMessage = `Failed to update order #${id} processed status to ${isProcessed}`;
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      throw new Error(errorMessage);
    }
  },

  cancelOrder: async (id: number): Promise<Order> => {
    try {
      console.log(`Cancelling order #${id}`);
      const response = await api.patch(`/orders/${id}/cancel`, {});
      return response.data;
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      // Handle case where order is already processed
      if (error.response?.status === 400 && error.response?.data?.message?.includes('processed')) {
        throw new Error('Pesanan sudah diproses oleh dapur dan tidak bisa dibatalkan.');
      }
      
      let errorMessage = `Failed to cancel order #${id}`;
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      throw new Error(errorMessage);
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      // The correct endpoint is /api/orders/:id
    await api.delete(`/orders/${id}`);
    } catch (error) {
      console.error(`Error deleting order ${id}:`, error);
      throw error;
    }
  },

  getOrderHistory: async (params: { 
    month?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    searchField?: 'all' | 'orderId' | 'tableCode' | 'date';
  }): Promise<OrderHistory[]> => {
    try {
      console.log('OrderAPI.getOrderHistory called with params:', JSON.stringify(params));
      
      const queryParams = new URLSearchParams();
      
      // Input validation for date parameters
      if (params.startDate && params.endDate) {
        // Basic validation - ensure they're strings in YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        
        if (!dateRegex.test(params.startDate)) {
          console.error('Invalid startDate format:', params.startDate);
          throw new Error('Start date must be in YYYY-MM-DD format');
        }
        
        if (!dateRegex.test(params.endDate)) {
          console.error('Invalid endDate format:', params.endDate);
          throw new Error('End date must be in YYYY-MM-DD format');
        }
        
        queryParams.append('startDate', params.startDate);
        queryParams.append('endDate', params.endDate);
        
        console.log(`API Query: Date range ${params.startDate} to ${params.endDate}`);
      } else if (params.month) {
        queryParams.append('month', params.month);
        console.log(`API Query: Month ${params.month}`);
      }
      
      if (params.searchTerm) {
        queryParams.append('search', params.searchTerm);
      }
      if (params.searchField && params.searchField !== 'all') {
        queryParams.append('searchField', params.searchField);
      }

      const url = `/order-history?${queryParams.toString()}`;
      console.log(`Fetching order history from: ${url}`);
      
      const response = await api.get<OrderHistory[]>(url);
      
      if (!response.data) {
        console.log('API returned empty data');
        return []; // Return empty array if no data
      }

      console.log(`API returned ${response.data.length} orders`);
      
      // ALWAYS perform client-side date filtering for consistency
      if (params.startDate && params.endDate) {
        const filteredData = response.data.filter(order => 
          isDateInRange(
            order.orderDate || order.completedAt || order.createdAt,
            params.startDate!,
            params.endDate!
          )
        );
        
        if (filteredData.length !== response.data.length) {
          console.warn(`Client-side date filtering removed ${response.data.length - filteredData.length} orders outside of date range`);
          console.log(`Returning ${filteredData.length} orders after date filtering`);
        }
        
        return filteredData;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching order history:', error);
      if (axios.isAxiosError(error)) {
        // Check if it's a 404 (Not Found) error
        if (error.response?.status === 404) {
          return []; // Return empty array if no history found
        }
        // For other errors, throw with more specific message
        throw new Error(error.response?.data?.message || `Failed to fetch order history: ${error.message}`);
      }
      throw new Error('Failed to fetch order history');
    }
  },

  // New method to get order history by daily ID
  getOrderHistoryByDailyId: async (date: string, dailyOrderId: number): Promise<OrderHistory | null> => {
    // The correct endpoint structure would be similar to other endpoints
    const response = await api.get(`/order-history/daily/${date}/${dailyOrderId}`);
    return response.data;
  },

  // Safe utility functions for handling null/undefined IDs
  safeUpdateStatus: async (id: number | undefined, status: OrderStatus): Promise<Order | null> => {
    if (!id) return null;
    return await OrderAPI.updateStatus(id, status);
  },

  safeUpdateProcessedStatus: async (id: number | undefined, isProcessed: boolean): Promise<Order | null> => {
    if (!id) return null;
    return await OrderAPI.updateProcessedStatus(id, isProcessed);
  },

  safeCancelOrder: async (id: number | undefined): Promise<Order | null> => {
    if (!id) return null;
    return await OrderAPI.cancelOrder(id);
  },
}; 