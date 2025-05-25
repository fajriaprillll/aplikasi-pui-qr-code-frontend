import axios from 'axios';

/**
 * Utility function to test the API connection
 * Run this in the browser console with testAPI()
 */
export const testAPI = async () => {
  const hostname = window.location.hostname;
  
  // Check current configuration
  console.log('Environment:', import.meta.env.MODE);
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL || 'not set');
  
  // Create URLs to test
  const baseURLs = [
    'http://localhost:3000/api',
    'http://127.0.0.1:3000/api',
  ];
  
  // If running from a device on the network, test using the IP 
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    baseURLs.push(`http://${hostname}:3000/api`);
  }
  
  // Always test relative to origin
  baseURLs.push(window.location.origin + '/api');
  
  // Test some specific endpoints
  console.log('Testing API connectivity...');
  console.log('Current origin:', window.location.origin);
  console.log('Current hostname:', hostname);
  
  const results = await Promise.all(
    baseURLs.map(async (url) => {
      try {
        console.log(`Testing API at ${url}/menu...`);
        const start = Date.now();
        const response = await axios.get(`${url}/menu`, { timeout: 5000 });
        const time = Date.now() - start;
        
        return {
          url,
          success: true,
          status: response.status,
          data: response.data,
          time: `${time}ms`
        };
      } catch (error: any) {
        // Log the full error for debugging
        console.error(`Error connecting to ${url}/menu:`, error);
        
        return {
          url,
          success: false,
          error: error.message,
          details: error.response ? {
            status: error.response.status,
            data: error.response.data
          } : 'No response'
        };
      }
    })
  );
  
  console.table(results.map(r => ({
    url: r.url,
    success: r.success,
    status: r.success ? r.status : '-',
    time: r.success ? r.time : '-',
    items: r.success ? (Array.isArray(r.data) ? r.data.length : 'not array') : '-'
  })));
  
  return results;
};

// Fix common connection issues
export const fixConnection = async () => {
  console.log('Attempting to fix connection issues...');
  const api = (await import('../api/axios')).default;
  
  try {
    // First try a regular API call to see if we can connect
    console.log('Testing current API config:', api.defaults.baseURL);
    const testResponse = await api.get('/menu');
    
    if (testResponse.status === 200) {
      console.log('✅ Connection is already working!');
      console.log('Data received:', testResponse.data);
      return true;
    }
  } catch (error) {
    console.log('❌ Current connection is not working, trying alternatives...');
  }
  
  // Try different URLs to find one that works
  const alternativeUrls = [
    'http://localhost:3000/api',
    window.location.origin + '/api',
  ];
  
  // Add the IP-based URL if we're on a device
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    alternativeUrls.push(`http://${hostname}:3000/api`);
  }
  
  for (const url of alternativeUrls) {
    try {
      console.log(`Trying alternative URL: ${url}`);
      const response = await axios.get(`${url}/menu`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log(`✅ Found working URL: ${url}`);
        
        // Override the baseURL
        api.defaults.baseURL = url;
        console.log('API baseURL updated to:', api.defaults.baseURL);
        
        return true;
      }
    } catch (error) {
      console.log(`❌ ${url} is not working`);
    }
  }
  
  console.log('❌ Could not find a working API connection');
  return false;
};

// Helper to make a quick single test to the backend (simpler than the full test)
export const quickTest = async () => {
  try {
    console.log('Performing quick backend test...');
    const api = (await import('../api/axios')).default;
    console.log('Current API URL:', api.defaults.baseURL);
    const response = await api.get('/menu');
    console.log('✅ Backend is connected!');
    console.log('Status:', response.status);
    console.log('Data count:', Array.isArray(response.data) ? response.data.length : 'not an array');
    console.log('Data:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return false;
  }
};

// Check if the backend API supports file uploads
export const checkFileUploadSupport = async (): Promise<{
  supported: boolean,
  method?: string,
  message: string,
}> => {
  console.log('Checking file upload support...');
  
  try {
    // Create a simple test image
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { 
        supported: false, 
        message: 'Could not create canvas context for test image' 
      };
    }
    
    // Draw a simple red square
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 10, 10);
    
    // Convert to Blob
    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95);
    });
    
    if (!blob) {
      return { 
        supported: false, 
        message: 'Could not create test blob for upload'
      };
    }
    
    // Create a test file
    const testFile = new File([blob], 'tiny-test.jpg', { type: 'image/jpeg' });
    
    // Create FormData
    const formData = new FormData();
    formData.append('image', testFile);
    formData.append('name', 'Upload Test');
    formData.append('price', '1000');
    formData.append('description', 'Testing upload support');
    
    // Get the API instance
    const api = (await import('../api/axios')).default;
    
    // Try different methods to see what's supported
    
    // Method 1: Standard POST without custom headers
    try {
      console.log('Trying standard POST without custom headers...');
      const response = await api.post('/menu', formData);
      console.log('Standard POST succeeded:', response.data);
      return {
        supported: true,
        method: 'standard',
        message: 'File uploads supported with standard POST method'
      };
    } catch (error1) {
      console.log('Standard POST failed, trying with explicit headers...');
      
      // Method 2: With explicit multipart/form-data
      try {
        const response = await api.post('/menu', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('POST with explicit headers succeeded:', response.data);
        return {
          supported: true,
          method: 'explicit-headers',
          message: 'File uploads supported with explicit multipart/form-data header'
        };
      } catch (error2) {
        console.log('All methods failed');
        
        // Try to determine if the API accepts uploads at all by checking OPTIONS
        try {
          const optionsResponse = await axios.options(`${api.defaults.baseURL}/menu`);
          const allowedMethods = optionsResponse.headers['allow'] || optionsResponse.headers['Access-Control-Allow-Methods'];
          
          if (allowedMethods && allowedMethods.includes('POST')) {
            return {
              supported: false,
              message: 'API seems to support POST but file uploads failed. The backend may not support multipart/form-data.'
            };
          } else {
            return {
              supported: false,
              message: 'API does not seem to support POST method required for file uploads.'
            };
          }
        } catch {
          return {
            supported: false,
            message: 'Could not determine file upload support. Backend may not support multipart/form-data.'
          };
        }
      }
    }
  } catch (error) {
    console.error('Error checking file upload support:', error);
    return {
      supported: false,
      message: 'Error checking file upload support: ' + (error instanceof Error ? error.message : String(error))
    };
  }
};

// Test image upload specifically
export const testImageUpload = async () => {
  try {
    console.log('Testing image upload functionality...');
    
    // First check if the API supports file uploads
    const uploadSupport = await checkFileUploadSupport();
    if (!uploadSupport.supported) {
      console.error('File upload support test failed:', uploadSupport.message);
      return false;
    }
    
    console.log('File upload support confirmed:', uploadSupport.message);
    
    // Create a test image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not create canvas context');
      return false;
    }
    
    // Draw a simple colored rectangle
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 50, 50);
    ctx.fillStyle = 'blue';
    ctx.fillRect(50, 0, 50, 50);
    ctx.fillStyle = 'green';
    ctx.fillRect(0, 50, 50, 50);
    ctx.fillStyle = 'yellow';
    ctx.fillRect(50, 50, 50, 50);
    
    // Convert to Blob
    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.95);
    });
    
    if (!blob) {
      console.error('Failed to create test image blob');
      return false;
    }
    
    // Create a test file
    const testFile = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });
    console.log('Created test image file:', testFile.name, testFile.size, 'bytes');
    
    // Create FormData with the test image and menu details
    const formData = new FormData();
    formData.append('name', 'Test Upload Item');
    formData.append('price', '12500');
    formData.append('description', 'This is a test item created by the image upload test utility.');
    formData.append('category', 'Test');
    formData.append('image', testFile);
    
    // Get the API instance
    const api = (await import('../api/axios')).default;
    console.log('Sending test upload to:', api.defaults.baseURL + '/menu');
    
    // Use the method that was detected as working
    let response;
    if (uploadSupport.method === 'explicit-headers') {
      response = await api.post('/menu', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } else {
      // Default to standard method
      response = await api.post('/menu', formData);
    }
    
    console.log('✅ Image upload test successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // Check if the image field was processed correctly
    if (response.data && response.data.image) {
      console.log('✅ Server returned image path:', response.data.image);
      
      // Display the test item image
      console.log('Test item ID:', response.data.id);
      return true;
    } else {
      console.warn('⚠️ Upload succeeded but no image path was returned in the response');
      return false;
    }
  } catch (error) {
    console.error('❌ Image upload test failed:', error);
    return false;
  }
};

// Expose for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testAPI = testAPI;
  (window as any).quickTest = quickTest;
  (window as any).fixConnection = fixConnection;
  (window as any).testImageUpload = testImageUpload;
  (window as any).checkFileUploadSupport = checkFileUploadSupport;
  console.log('API testing utilities available. Run "testAPI()", "quickTest()", "fixConnection()", "testImageUpload()" or "checkFileUploadSupport()" in console.');
}

export default testAPI; 