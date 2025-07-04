import api from './axios';

export interface UploadResponse {
  url: string;
  filename: string;
}

export const UploadAPI = {
  /**
   * Upload an image to the server
   * @param file The image file to upload
   * @returns Promise with the upload response containing url and filename
   */
  uploadImage: async (file: File): Promise<UploadResponse> => {
    try {
      // Get the token for authorization
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', file);

      console.log('Uploading image:', file.name, 'size:', (file.size / 1024).toFixed(2) + 'KB');

      // Make the API call to upload endpoint
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': undefined, // Let browser set content-type with boundary
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Image uploaded successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      
      let errorMessage = 'Failed to upload image';
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        console.error(`Server returned ${status}:`, responseData);
        
        if (typeof responseData === 'object' && responseData.error) {
          errorMessage = `${errorMessage}: ${responseData.error}`;
        } else if (status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (status === 400) {
          errorMessage = 'Invalid image file. Please check file format and size.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
}; 