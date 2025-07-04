import type { Menu } from '../types';
import api from './axios';
import { UploadAPI } from './uploadApi';

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
          if (item.imageUrl) {
            console.log(`Menu ${index} (${item.name}) has image: ${item.imageUrl}`);
          }
          
          // Set default status to AVAILABLE if not provided
          if (!item.status) {
            item.status = 'AVAILABLE';
          }
          
          // Add professional descriptions in Indonesian if not provided
          if (!item.description) {
            if (item.name.toLowerCase().includes('nasi goreng')) {
              item.description = 'Nasi premium yang dimasak dengan teknik tradisional menggunakan bumbu rempah khas Indonesia. Disajikan dengan telur mata sapi, ayam suwir, dan kerupuk udang. Aroma khas kecap manis berpadu sempurna dengan sensasi pedas yang dapat disesuaikan.';
            } else if (item.name.toLowerCase().includes('nasi')) {
              item.description = 'Beras pilihan kualitas premium yang dimasak hingga pulen dan harum. Disajikan sebagai pendamping sempurna untuk berbagai hidangan utama kami.';
            } else if (item.name.toLowerCase().includes('mie goreng') || item.name.toLowerCase().includes('mi goreng')) {
              item.description = 'Mie berkualitas tinggi yang digoreng dengan teknik khusus bersama bumbu rahasia turun-temurun. Dilengkapi dengan potongan daging ayam, bakso, dan sayuran segar, serta telur orak-arik yang menambah cita rasa.';
            } else if (item.name.toLowerCase().includes('ayam bakar')) {
              item.description = 'Potongan ayam pilihan yang dimarinasi dengan bumbu tradisional selama minimal 6 jam, kemudian dipanggang di atas bara api hingga sempurna. Disajikan dengan sambal khas rumah yang memberikan sensasi pedas yang khas.';
            } else if (item.name.toLowerCase().includes('ayam goreng')) {
              item.description = 'Potongan ayam segar yang dimarinasi dengan rempah-rempah pilihan, digoreng dengan teknik khusus hingga renyah di luar namun tetap juicy di dalam. Disajikan dengan lalapan segar dan sambal pedas.';
            } else if (item.name.toLowerCase().includes('ayam')) {
              item.description = 'Daging ayam berkualitas premium yang diolah dengan resep eksklusif dan bumbu pilihan. Dimasak hingga sempurna untuk menghadirkan cita rasa autentik yang menggugah selera.';
            } else if (item.name.toLowerCase().includes('sate')) {
              item.description = 'Potongan daging pilihan yang ditusuk dan dipanggang di atas bara api hingga kecoklatan sempurna. Disajikan dengan bumbu kacang khas yang kaya rasa dan lontong pilihan. Cita rasa manis dan gurih yang menjadi favorit.';
            } else if (item.name.toLowerCase().includes('es teh')) {
              item.description = 'Seduhan teh premium yang disajikan dingin dengan es batu kristal. Manisnya disesuaikan dan dapat dikustomisasi sesuai selera Anda. Kesegaran yang sempurna untuk menemani hidangan.';
            } else if (item.name.toLowerCase().includes('teh') || item.name.toLowerCase().includes('tea')) {
              item.description = 'Racikan teh berkualitas tinggi dengan aroma yang khas dan menenangkan. Disajikan panas atau dingin sesuai selera, memberikan kesegaran optimal di setiap tegukan.';
            } else if (item.name.toLowerCase().includes('jus') || item.name.toLowerCase().includes('juice')) {
              item.description = 'Perpaduan buah-buahan segar pilihan yang diproses dengan teknik khusus untuk mempertahankan nutrisi dan cita rasanya. Tanpa tambahan pengawet, disajikan dingin untuk kesegaran maksimal.';
            } else if (item.name.toLowerCase().includes('kopi') || item.name.toLowerCase().includes('coffee')) {
              item.description = 'Kopi premium dari biji pilihan yang digiling segar sebelum diseduh. Metode brewing kami menghasilkan kopi dengan aroma kuat dan cita rasa yang kaya namun seimbang.';
            } else if (item.name.toLowerCase().includes('roti') || item.name.toLowerCase().includes('bread')) {
              item.description = 'Roti yang dipanggang fresh setiap hari dengan bahan berkualitas tinggi. Tekstur lembut di dalam dan renyah di luar, dengan filling yang melimpah dan lezat.';
            } else if (item.name.toLowerCase().includes('es teler')) {
              item.description = 'Minuman premium khas Indonesia yang dibuat dari paduan sempurna buah alpukat berkualitas, potongan kelapa muda segar, nangka matang pilihan, dan cincau hitam. Disiram dengan kuah santan premium yang diperkaya sirup manis aromatis. Disajikan dengan es serut halus untuk menyempurnakan kelezatan setiap tegukan.';
            } else if (item.name.toLowerCase().includes('es jeruk')) {
              item.description = 'Minuman signature berbahan dasar jeruk segar premium yang diperas langsung saat dipesan. Tingkat kemanisan diracik sempurna oleh mixologist kami, disajikan dengan es kristal dan garnish irisan jeruk nipis segar. Kesegaran alami yang menyehatkan tubuh dan menyegarkan pikiran.';
            } else if (item.name.toLowerCase().includes('es')) {
              item.description = 'Minuman dingin menyegarkan dengan bahan-bahan berkualitas premium. Disajikan dengan es batu kristal untuk kesegaran maksimal yang cocok dinikmati kapan saja.';
            } else if (item.name.toLowerCase().includes('roti bakar')) {
              item.description = 'Roti artisan premium yang dipanggang dengan teknik khusus hingga mencapai kematangan sempurna. Lapisan luar dibakar hingga keemasan renyah, sementara bagian dalam tetap lembut dan beraroma harum. Disajikan dengan pilihan topping signature seperti cokelat Belgian premium, keju mozzarella berkualitas, atau selai buah homemade tanpa pengawet.';
            } else {
              item.description = 'Hidangan spesial yang disiapkan oleh chef berpengalaman kami menggunakan bahan-bahan premium berkualitas tinggi. Diproses dengan teknik memasak modern namun tetap mempertahankan cita rasa autentik.';
            }
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

  // Create a new menu with image upload support
  create: async (menu: Omit<Menu, 'id'> | FormData): Promise<Menu> => {
    try {
      // Get the token for authorization
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Extract data from FormData or use the menu object directly
      let menuData: any = {};
      let imageFile: File | null = null;
      
      if (menu instanceof FormData) {
        // Extract all form fields
        const name = menu.get('name');
        const price = menu.get('price');
        const category = menu.get('category') || '';
        const description = menu.get('description') || '';
        const status = menu.get('status') || 'AVAILABLE';
        
        // Check for image file
        imageFile = menu.get('image') as File || null;
        
        // Create menu data object
        menuData = {
          name,
          price: Number(price),
          category,
          description,
          status,
          isAvailable: status === 'AVAILABLE'
        };
        
        console.log('Creating menu from FormData:', {
          name, price, category, description,
          hasImageFile: !!imageFile
        });
        } else {
        // Use menu object directly
        menuData = {
          name: menu.name,
          price: typeof menu.price === 'string' ? Number(menu.price) : menu.price,
          category: menu.category || '',
          description: menu.description || '',
          status: menu.status || 'AVAILABLE',
          isAvailable: menu.status !== 'OUT_OF_STOCK'
        };
      }
      
      // Handle image upload if present
      if (imageFile) {
        try {
          console.log('Uploading image file before creating menu');
          const uploadResult = await UploadAPI.uploadImage(imageFile);
          
          // Set the image URL from upload response
          menuData.imageUrl = uploadResult.url;
          console.log('Image uploaded, URL:', uploadResult.url);
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
      }
      
      console.log('Sending create menu request with payload:', menuData);
      
      // Make the API call to create menu
      const response = await api.post('/menu', menuData, {
              headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
            }
      });
      
        console.log('Menu created successfully:', response.data);
        return response.data;
    } catch (error: any) {
      console.error('Error creating menu:', error);
      
      // Format a user-friendly error message
      let errorMessage = 'Failed to create menu';
      
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        console.error(`Server returned ${status}:`, responseData);
        
        if (typeof responseData === 'object' && responseData.message) {
          errorMessage = `${errorMessage}: ${responseData.message}`;
        } else if (typeof responseData === 'object' && responseData.error) {
          errorMessage = `${errorMessage}: ${responseData.error}`;
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 400) {
          errorMessage = 'Invalid menu data. Please check all required fields.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Update a menu with image upload support
  update: async (id: number, menu: Partial<Menu> | FormData): Promise<Menu> => {
    try {
      console.log(`Updating menu ${id} with data:`, menu);
      
      // Get the token for authorization
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      // Extract data from FormData or use the menu object directly
      let menuData: any = {};
      let imageFile: File | null = null;
      
      if (menu instanceof FormData) {
        // Extract all form fields
        for (const [key, value] of menu.entries()) {
          if (key === 'image') {
            imageFile = value as File;
          } else if (key === 'price') {
            menuData[key] = Number(value);
          } else if (key !== 'imageUrl') { // Skip 'imageUrl' if we have imageFile
            menuData[key] = value;
              }
        }
        
        // Set isAvailable based on status
        const status = menuData.status || 'AVAILABLE';
        menuData.isAvailable = status === 'AVAILABLE';
        
        console.log('Updating menu from FormData:', {
          ...menuData,
          hasImageFile: !!imageFile
        });
      } else {
        // Use menu object directly
        menuData = { ...menu };
        
        // Convert price to number if it's a string
        if (menuData.price !== undefined && typeof menuData.price === 'string') {
          menuData.price = Number(menuData.price);
        }
        
        // Set isAvailable based on status
        if (menuData.status) {
          menuData.isAvailable = menuData.status === 'AVAILABLE';
        }
      }
      
      // Handle image upload if present
      if (imageFile) {
        try {
          console.log('Uploading new image file before updating menu');
          const uploadResult = await UploadAPI.uploadImage(imageFile);
          
          // Set the image URL from upload response
          menuData.imageUrl = uploadResult.url;
          console.log('Image uploaded, URL:', uploadResult.url);
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
      }
      
      console.log('Sending update menu request with payload:', menuData);
      
      // Make the API call to update menu
      const response = await api.put(`/menu/${id}`, menuData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Menu updated successfully:', response.data);
        return response.data;
    } catch (error: any) {
      console.error(`Error updating menu ${id}:`, error);
      
      // Format a user-friendly error message
      let errorMessage = 'Failed to update menu';
      
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        console.error(`Server returned ${status}:`, responseData);
        
        if (typeof responseData === 'object' && responseData.message) {
          errorMessage = `${errorMessage}: ${responseData.message}`;
        } else if (typeof responseData === 'object' && responseData.error) {
          errorMessage = `${errorMessage}: ${responseData.error}`;
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 400) {
          errorMessage = 'Invalid menu data. Please check all required fields.';
        } else if (status === 404) {
          errorMessage = 'Menu not found. It may have been deleted.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Delete a menu - simplified approach with special case handling
  delete: async (id: number): Promise<void> => {
    console.log(`Starting delete operation for menu ID: ${id}`);
    
    // Get token
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      throw new Error('Authentication required. Please log in again.');
    }
    
    // Get base URL from environment or default
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const url = `${baseUrl}/menu/${id}`;
    
    console.log(`Sending DELETE request to: ${url}`);
    
    try {
      // Use native fetch for simplicity
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Check response status
      if (response.ok) {
        console.log('Delete successful');
        return;
      }
      
      // Handle common error cases
      if (response.status === 404) {
        console.log('Item already deleted or not found, considering operation successful');
        return; // Consider this a success since the item doesn't exist anymore
      }
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // For other errors, try to get the response text
      try {
        const errorText = await response.text();
        console.error(`Delete failed with status: ${response.status}, response: ${errorText}`);
        throw new Error(`Server error (${response.status}). Please try again.`);
      } catch (textError) {
        // If we can't get the response text, use a generic error
        throw new Error(`Server error (${response.status}). Please try again.`);
      }
    } catch (error) {
      console.error('Error in delete operation:', error);
      throw error;
    }
  },
}; 