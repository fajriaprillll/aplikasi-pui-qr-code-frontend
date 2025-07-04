import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Menu } from '../types';
import Button from './Button';
import { FaClipboardCheck, FaImage } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAlert } from '../contexts/AlertContext';

interface MenuFormProps {
  initialData?: Menu;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

const MenuForm: React.FC<MenuFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
}) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<Menu>({
    defaultValues: initialData || {
      name: '',
      price: 0,
      description: '',
      category: '',
      imageUrl: '',
      status: 'AVAILABLE'
    }
  });

  const { showAlert } = useAlert();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isEditing = !!initialData;

  // Set form values if initialData is provided
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      if (initialData.imageUrl) {
        // For existing images, display the preview
        setPreviewUrl(initialData.imageUrl);
      }
    }
  }, [initialData, reset]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle image upload preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showAlert('Please select a valid image file (JPEG, PNG, GIF, WEBP)', {
        type: 'warning',
        title: 'Invalid File Type'
      });
      return;
    }

    // Limit file size to 5MB
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showAlert('Image file size must be less than 5MB', {
        type: 'warning',
        title: 'File Too Large'
      });
      return;
    }

    // Store the selected file for later use
    setImageFile(file);

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    console.log('File selected for upload:', file.name);
  };

  const submitHandler = handleSubmit((data) => {
    console.log('Form submitted with data:', data);
    
    try {
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        showAlert('Menu name is required', {
          type: 'warning',
          title: 'Validation Error',
          duration: 3000
        });
        return;
      }
      
      if (!data.price || data.price <= 0) {
        showAlert('Price must be greater than 0', {
          type: 'warning',
          title: 'Validation Error',
          duration: 3000
        });
        return;
      }
      
      // Create a FormData object for all submissions
        const formData = new FormData();
      
      // Add all form fields to the FormData except imageUrl which we'll handle separately
        Object.entries(data).forEach(([key, value]) => {
        if (key !== 'imageUrl' && value !== null && value !== undefined) {
          // Convert price to a number if it's a string
            if (key === 'price' && typeof value === 'string') {
              formData.append(key, String(parseFloat(value)));
            } else {
              formData.append(key, String(value));
            }
          
          // Debug what's being added to FormData
          console.log(`Adding to FormData: ${key} = ${value}`);
          }
        });
      
      // Add required fields for the API
      if (!formData.has('isAvailable')) {
        const status = data.status || 'AVAILABLE';
        formData.append('isAvailable', status === 'AVAILABLE' ? 'true' : 'false');
      }
      
      // Add the image file if available
      if (imageFile) {
        console.log('Adding image file to FormData:', imageFile.name);
        formData.append('image', imageFile);
        }
      
      console.log('Submitting form with FormData');
      onSubmit(formData);
    } catch (error) {
      console.error('Error preparing form data:', error);
      showAlert('Error preparing form data. Please try again.', {
        type: 'warning',
        title: 'Form Error'
      });
    }
  });

  return (
    <motion.form
      onSubmit={submitHandler}
      className="flex flex-col h-full bg-white rounded-lg shadow-xl border border-gray-100 max-w-lg mx-auto"
      noValidate
      encType="multipart/form-data"
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center mb-6 p-6 pb-2 border-b border-gray-100 relative">
        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white mr-4 shadow-sm">
          <FaClipboardCheck size={22} />
        </div>
          <div>
          <h3 className="text-lg font-semibold text-gray-800">
              {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>
        </div>
        <button
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold focus:outline-none"
          onClick={onCancel}
          aria-label="Close menu form"
        >
          &times;
        </button>
      </div>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <p className="text-sm">{error}</p>
        </div>
          )}
        {/* Form fields grid */}
        <div className="grid grid-cols-1 gap-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Menu Name *
            </label>
            <input
              id="name"
              type="text"
              className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              {...register('name', { required: 'Menu name is required' })}
            />
              {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
      </div>

      {/* Status field */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
          className="w-full p-2 border border-gray-300 rounded-md"
              {...register('status')}
            >
              <option value="AVAILABLE">Available</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (IDR) *
            </label>
              <input
                id="price"
                type="number"
                min="0"
                step="1000"
          className={`w-full p-2 border rounded-md ${
            errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                {...register('price', { 
                  required: 'Price is required',
                  min: { value: 0, message: 'Price must be positive' },
                  valueAsNumber: true,
                })}
              />
              {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              id="category"
              type="text"
          className="w-full p-2 border border-gray-300 rounded-md"
              {...register('category')}
            />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              rows={3}
          className="w-full p-2 border border-gray-300 rounded-md"
          {...register('description')}
        ></textarea>
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
        
              <input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
          className="w-full p-2 border border-gray-300 rounded-md"
                onChange={handleImageChange}
              />
        
        <p className="text-xs text-gray-500 mt-1">
          Upload a new image (max size: 5MB)
            </p>
            
        {/* Hidden field to store the imageUrl */}
        <input type="hidden" {...register('imageUrl')} />
            
        {/* Show current image preview */}
              {previewUrl && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
                    <img
                      src={previewUrl}
                      alt="Menu preview"
              className="w-40 h-40 object-cover rounded-md border border-gray-300" 
                    />
                  </div>
        )}
                  </div>
        </div>
      </div>
      {/* Footer */}
      <div className="flex flex-row justify-end gap-3 p-6 pt-4 border-t border-gray-100 bg-white">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditing ? 'Update Menu' : 'Add Menu'}
        </Button>
      </div>
    </motion.form>
  );
};

export default MenuForm; 