import type { Table } from '../types';
import api from './axios';

export const TableAPI = {
  // Get all tables
  getAll: async (): Promise<Table[]> => {
    try {
      const response = await api.get('/tables');
      return response.data;
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw error;
    }
  },

  // Get a single table by ID
  getById: async (id: number): Promise<Table> => {
    try {
      const response = await api.get(`/tables/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching table ${id}:`, error);
      throw error;
    }
  },

  // Create a new table
  create: async (table: Omit<Table, 'id'>): Promise<Table> => {
    try {
      // Validate table data
      if (!table.name || table.name.trim() === '') {
        throw new Error('Table name is required');
      }
      
      if (!table.capacity || table.capacity < 1) {
        throw new Error('Capacity must be at least 1');
      }
      
      const response = await api.post('/tables', table);
      return response.data;
    } catch (error: any) {
      console.error('Error creating table:', error);
      
      // Provide more specific error message based on the error
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server error:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to create table - server error');
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Network error - no response received');
        throw new Error('Network error - please check your connection');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw error;
      }
    }
  },

  // Update a table
  update: async (id: number, table: Partial<Table>): Promise<Table> => {
    try {
      const response = await api.put(`/tables/${id}`, table);
      return response.data;
    } catch (error) {
      console.error(`Error updating table ${id}:`, error);
      throw error;
    }
  },

  // Delete a table
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/tables/${id}`);
    } catch (error) {
      console.error(`Error deleting table ${id}:`, error);
      throw error;
    }
  },
}; 