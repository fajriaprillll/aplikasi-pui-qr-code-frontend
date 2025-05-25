import type { Menu } from '../types';
import api from './axios';

export const MenuAPI = {
  // Get all menus
  getAll: async (forceRefresh: boolean = false): Promise<Menu[]> => {
    try {
      // Add timestamp to prevent caching when forceRefresh is true
      const cacheBuster = forceRefresh ? `?_=${Date.now()}` : '';
      console.log('Fetching all menus from:', api.defaults.baseURL + '/menu' + cacheBuster);
      const response = await api.get('/menu' + cacheBuster);
      console.log('Menu response:', response.status, response.statusText);
      console.log('Menu data returned:', response.data);
      
      if (!response.data) {
        console.warn('No menu data returned from API');
        return [];
      }
      
      // Debug any image URLs in the response
      if (Array.isArray(response.data)) {
        response.data.forEach((item, index) => {
          if (item.image) {
            console.log(`Menu ${index} (${item.name}) has image: ${item.image}`);
          }
          
          // Set default status to AVAILABLE if not provided
          if (!item.status) {
            item.status = 'AVAILABLE';
          }
          
          // For demo purposes: Add some customization options to specific food types
          if (item.name.toLowerCase().includes('chicken') || item.name.toLowerCase().includes('ayam')) {
            // Add spice level customization for chicken dishes
            item.customizationOptions = [
              {
                id: 'spice-level',
                name: 'Spice Level',
                type: 'radio',
                required: true,
                options: [
                  { id: 'mild', name: 'Mild', price: 0 },
                  { id: 'medium', name: 'Medium', price: 0 },
                  { id: 'spicy', name: 'Spicy', price: 0 },
                  { id: 'extra-spicy', name: 'Extra Spicy 🔥', price: 5000 }
                ]
              }
            ];
          } else if (item.name.toLowerCase().includes('nasi') || item.name.toLowerCase().includes('rice')) {
            // Add rice portion customization
            item.customizationOptions = [
              {
                id: 'portion',
                name: 'Portion Size',
                type: 'radio',
                required: true,
                options: [
                  { id: 'small', name: 'Small', price: -5000 },
                  { id: 'regular', name: 'Regular', price: 0 },
                  { id: 'large', name: 'Large (+50%)', price: Math.round(item.price * 0.5) }
                ]
              }
            ];
          }
        });
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching menus:', error);
      
      if (error.response) {
        console.error('Server error response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response from server. Is the backend running?');
      }
      
      // Return empty array on error to avoid crashes
      return [];
    }
  },

  // Get a single menu by ID
  getById: async (id: number): Promise<Menu> => {
    try {
      const response = await api.get(`/menu/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching menu ${id}:`, error);
      throw error;
    }
  },

  // Create a new menu
  create: async (menu: Omit<Menu, 'id'> | FormData): Promise<Menu> => {
    try {
      console.log('Creating menu with data:', menu);
      
      // Handle FormData or regular object
      if (menu instanceof FormData) {
        // Set default status if not specified
        if (!menu.get('status')) {
          menu.append('status', 'AVAILABLE');
        }
        
        console.log('Sending as FormData');
        
        // Check if there's a file in the FormData
        const imageFile = menu.get('image');
        if (imageFile instanceof File) {
          console.log('FormData contains file:', imageFile.name, imageFile.type, imageFile.size);
          
          // Add a debugging copy of the image filename to help trace what happens to it
          menu.append('originalFilename', imageFile.name);
        } else {
          console.log('FormData does not contain a file or it is not a File object:', imageFile);
        }
        
        // Try multiple approaches to find one that works with the backend
        let errorMessages = [];
        
        // Approach 1: Standard FormData without any special headers
        try {
          console.log('Approach 1: Sending FormData with default browser-set headers');
          const response = await api.post('/menu', menu);
          console.log('Menu created successfully with approach 1:', response.data);
          
          // Log image URL in response if it exists
          if (response.data && response.data.image) {
            console.log('Response includes image URL:', response.data.image);
          }
          
          return response.data;
        } catch (error1: any) {
          console.error('Approach 1 failed:', error1.message);
          errorMessages.push(`Approach 1: ${error1.message}`);
          
          // Approach 2: Try with explicit multipart/form-data content type
          try {
            console.log('Approach 2: Sending with explicit multipart/form-data header');
            const customConfig = {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            };
            
            const response = await api.post('/menu', menu, customConfig);
            console.log('Menu created successfully with approach 2:', response.data);
            return response.data;
          } catch (error2: any) {
            console.error('Approach 2 failed:', error2.message);
            errorMessages.push(`Approach 2: ${error2.message}`);
            
            // Approach 3: Try with specific URL for file uploads if the backend has a different endpoint
            try {
              console.log('Approach 3: Trying alternative endpoint for uploads');
              const response = await api.post('/upload/menu', menu);
              console.log('Menu created successfully with approach 3:', response.data);
              return response.data;
            } catch (error3: any) {
              console.error('Approach 3 failed:', error3.message);
              errorMessages.push(`Approach 3: ${error3.message}`);
              
              throw new Error(`All upload approaches failed: ${errorMessages.join(', ')}`);
            }
          }
        }
      } else {
        // Set default status if not specified
        if (!menu.status) {
          menu = { ...menu, status: 'AVAILABLE' };
        }
        
        console.log('Sending as JSON object:', menu);
        
        // For regular JSON objects
        const response = await api.post('/menu', menu);
        console.log('Menu created successfully:', response.data);
        return response.data;
      }
    } catch (error: any) {
      console.error('Error creating menu:', error);
      
      if (error.response) {
        console.error('Server response error:', error.response.status, error.response.data);
        const errorMessage = 
          (typeof error.response.data === 'object' && error.response.data.message) 
            ? error.response.data.message 
            : 'Failed to create menu - server error';
        throw new Error(errorMessage);
      } else if (error.request) {
        console.error('No response received from server');
        throw new Error('Network error - please check your connection');
      } else {
        throw new Error(error.message || 'Failed to create menu');
      }
    }
  },

  // Update a menu
  update: async (id: number, menu: Partial<Menu> | FormData): Promise<Menu> => {
    try {
      console.log(`Updating menu ${id} with data:`, menu);
      
      // Choose the right approach based on data type
      if (menu instanceof FormData) {
        // Check if there's an image file
        const imageFile = menu.get('image');
        if (imageFile instanceof File) {
          console.log('FormData contains file for update:', imageFile.name, imageFile.type, imageFile.size);
          
          // Add a debugging copy of the image filename
          menu.append('originalFilename', imageFile.name);
        }
        
        // Multiple approaches for update with FormData
        let errorMessages = [];
        
        // Approach 1: Standard method without headers
        try {
          console.log('Approach 1: Updating with FormData (no custom headers)');
          const response = await api.put(`/menu/${id}`, menu);
          console.log('Menu updated successfully with approach 1:', response.data);
          return response.data;
        } catch (error1: any) {
          console.error('Approach 1 failed for update:', error1.message);
          errorMessages.push(`Approach 1: ${error1.message}`);
          
          // Approach 2: With explicit headers
          try {
            console.log('Approach 2: Updating with multipart/form-data header');
            const customConfig = {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            };
            
            const response = await api.put(`/menu/${id}`, menu, customConfig);
            console.log('Menu updated successfully with approach 2:', response.data);
            return response.data;
          } catch (error2: any) {
            console.error('Approach 2 failed for update:', error2.message);
            errorMessages.push(`Approach 2: ${error2.message}`);
            
            // Approach 3: Try with POST and method override for APIs that don't support PUT with FormData
            try {
              console.log('Approach 3: Using POST with method override for PUT');
              menu.append('_method', 'PUT'); // Some backends use this convention
              const response = await api.post(`/menu/${id}`, menu);
              console.log('Menu updated successfully with approach 3:', response.data);
              return response.data;
            } catch (error3: any) {
              console.error('All update approaches failed:', error3.message);
              errorMessages.push(`Approach 3: ${error3.message}`);
              
              throw new Error(`All update approaches failed: ${errorMessages.join(', ')}`);
            }
          }
        }
      } else {
        // For regular JSON updates
        
        // Handle status updates
        if ('status' in menu) {
          console.log(`Menu ${id} status updating to: ${menu.status}`);
          // Validate status properly
          if (menu.status !== 'AVAILABLE' && menu.status !== 'OUT_OF_STOCK') {
            console.warn(`Invalid status value: ${menu.status}, defaulting to AVAILABLE`);
            menu.status = 'AVAILABLE'; // Default to available
          }
        }
        
        const response = await api.put(`/menu/${id}`, menu);
        console.log('Menu updated successfully (JSON):', response.data);
        return response.data;
      }
    } catch (error: any) {
      console.error(`Error updating menu ${id}:`, error);
      
      if (error.response) {
        const errorMessage = 
          (typeof error.response.data === 'object' && error.response.data.message) 
            ? error.response.data.message 
            : 'Failed to update menu - server error';
        throw new Error(errorMessage);
      } else {
        throw new Error('Failed to update menu - please try again');
      }
    }
  },

  // Delete a menu
  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/menu/${id}`);
    } catch (error) {
      console.error(`Error deleting menu ${id}:`, error);
      throw error;
    }
  },
}; 