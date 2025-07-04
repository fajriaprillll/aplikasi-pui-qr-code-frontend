/**
 * Utility functions for testing and debugging menu delete operations
 */

/**
 * Test deletion of a menu item using raw fetch API
 * @param id The ID of the menu item to delete
 * @returns Promise resolving to the result of the operation
 */
export const testDeleteWithFetch = async (id: number): Promise<any> => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const url = `${baseUrl}/menu/${id}`;
    
    console.log(`Testing DELETE with fetch to: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server returned ${response.status}: ${text}`);
    }
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Delete with fetch failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Test deletion of a menu item using XMLHttpRequest
 * @param id The ID of the menu item to delete
 * @returns Promise resolving to the result of the operation
 */
export const testDeleteWithXHR = async (id: number): Promise<any> => {
  return new Promise((resolve) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        resolve({
          success: false,
          error: 'No authentication token found'
        });
        return;
      }
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const url = `${baseUrl}/menu/${id}`;
      
      console.log(`Testing DELETE with XMLHttpRequest to: ${url}`);
      
      const xhr = new XMLHttpRequest();
      xhr.open('DELETE', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText
          });
        } else {
          resolve({
            success: false,
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText
          });
        }
      };
      
      xhr.onerror = function() {
        resolve({
          success: false,
          error: 'Network error during delete operation'
        });
      };
      
      xhr.send();
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
};

/**
 * Test all available delete methods and return results
 * @param id The ID of the menu item to delete
 * @returns Promise resolving to the results of all methods
 */
export const testAllDeleteMethods = async (id: number): Promise<any> => {
  // Clone the ID to avoid modifying the original
  const menuId = id;
  
  console.log(`Testing all delete methods for menu ID: ${menuId}`);
  
  // Test XMLHttpRequest first
  console.log('Testing XMLHttpRequest method...');
  const xhrResult = await testDeleteWithXHR(menuId);
  
  // If XHR succeeded, don't try fetch to avoid double deletion
  if (xhrResult.success) {
    return {
      success: true,
      method: 'xhr',
      details: xhrResult
    };
  }
  
  // Try fetch as fallback
  console.log('XMLHttpRequest failed, trying fetch method...');
  const fetchResult = await testDeleteWithFetch(menuId);
  
  if (fetchResult.success) {
    return {
      success: true,
      method: 'fetch',
      details: fetchResult
    };
  }
  
  // All methods failed
  return {
    success: false,
    xhrResult,
    fetchResult
  };
};

export default {
  testDeleteWithFetch,
  testDeleteWithXHR,
  testAllDeleteMethods
}; 