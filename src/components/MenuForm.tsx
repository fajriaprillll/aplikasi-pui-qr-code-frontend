import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { Menu, MenuCustomizationOption } from '../types';
import Button from './Button';
import { getImageCopyInstructions } from '../utils/copyImageHelper';
import { FaPlus, FaMinus, FaTimes } from 'react-icons/fa';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const isEditing = !!initialData;

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    control,
    reset,
    watch,
  } = useForm<Omit<Menu, 'id'>>({
    defaultValues: initialData || {
      name: '',
      price: 0,
      description: '',
      image: '',
      category: '',
      status: 'AVAILABLE',
      customizationOptions: [],
    },
  });
  
  // Use field array for managing customization options
  const { fields: customizationFields, append: appendCustomization, remove: removeCustomization } = 
    useFieldArray({
      control,
      name: 'customizationOptions'
  });

  // Set form values if initialData is provided
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      if (initialData.image) {
        // For existing images, display the preview
        setPreviewUrl(initialData.image);
      }
    }
  }, [initialData, reset]);

  // Handle image upload preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Limit file size to 5MB
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Image file size must be less than 5MB');
      return;
    }

    // Store the selected file for later use
    setImageFile(file);
    setImageFileName(file.name);

    // Create a preview URL
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      
      // For local images, we'll use a relative path format that points to the public folder
      // The image will be stored in public/images/menu/[filename]
      const localImagePath = `images/menu/${file.name}`;
      setValue('image', localImagePath);
      console.log('File selected for local storage:', file.name, 'Path:', localImagePath);
    };
    reader.readAsDataURL(file);
  };

  // Add a new customization option
  const addCustomizationOption = () => {
    const newOption: MenuCustomizationOption = {
      id: `option-${Date.now()}`,
      name: '',
      type: 'select',
      required: false,
      options: [
        {
          id: `option-item-${Date.now()}`,
          name: '',
          price: 0
        }
      ]
    };
    
    appendCustomization(newOption);
  };
  
  // Add a new option to a customization group
  const addCustomizationItem = (optionIndex: number) => {
    const currentOptions = watch(`customizationOptions.${optionIndex}.options`) || [];
    
    setValue(`customizationOptions.${optionIndex}.options`, [
      ...currentOptions,
      {
        id: `option-item-${Date.now()}`,
        name: '',
        price: 0
      }
    ]);
  };
  
  // Remove an option item
  const removeCustomizationItem = (optionIndex: number, itemIndex: number) => {
    const currentOptions = watch(`customizationOptions.${optionIndex}.options`) || [];
    
    setValue(
      `customizationOptions.${optionIndex}.options`,
      currentOptions.filter((_, i) => i !== itemIndex)
    );
  };

  const submitHandler = handleSubmit((data) => {
    console.log('Form submitted with data:', data);
    
    try {
      // Create a FormData object if there's an image file
      if (imageFile) {
        console.log('Creating FormData with image file:', imageFile.name);
        
        // IMPORTANT: For local image approach
        // 1. The image path is already set to `images/menu/${filename}` 
        // 2. After submitting the form, you need to manually copy the file to
        //    the public/images/menu folder for the image to appear
        console.log('IMPORTANT: After form submission, manually copy this file to public/images/menu/');
        console.log('File to copy:', imageFile.name);
        
        const formData = new FormData();
        
        // Add all form fields to the FormData
        Object.entries(data).forEach(([key, value]) => {
          // Skip image field, we'll add the file separately
          if (key !== 'image') {
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
        
        // For local approach, we'll still include the image file for the backend,
        // but we'll use the relative path in the form data
        formData.append('image', data.image);
        
        // Add the actual file with a different field name for the backend
        // This way the backend can store it if needed
        formData.append('imageFile', imageFile);
        
        // Add debugging info
        formData.append('filename_debug', imageFile.name);
        formData.append('filetype_debug', imageFile.type);
        formData.append('filesize_debug', String(imageFile.size));
        
        console.log('FormData created with file:', imageFile.name, imageFile.type, imageFile.size);
        console.log('Local image path to use:', data.image);
        
        // Show guidance to the user about copying the file
        alert(`Please manually copy the image "${imageFile.name}" to the public/images/menu/ folder after submitting.`);
        
        // Submit the FormData
        onSubmit(formData);
      } else if (isEditing && previewUrl && !data.image.includes('://')) {
        // Handle case where we're editing but user didn't change the image
        // and the image value isn't a full URL (suggesting we need to preserve it)
        console.log('Editing menu without changing image');
        
        // If the image is from backend, we keep the existing image path
        if (initialData?.image) {
          data.image = initialData.image;
        }
        
        // Submit regular data
        onSubmit(data);
      } else {
        console.log('Submitting regular data (no image)');
        // Transform price to number explicitly
        if (typeof data.price === 'string') {
          data.price = parseFloat(data.price);
        }
        
        // No image file, just submit the regular data
        onSubmit(data);
      }
    } catch (error) {
      console.error('Error preparing form data:', error);
    }
  });

  return (
    <form onSubmit={submitHandler} className="space-y-4" noValidate encType="multipart/form-data">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Menu Name *
        </label>
        <input
          id="name"
          type="text"
          className={`w-full p-2 border rounded-md ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
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
          className={`w-full p-2 border rounded-md ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          {...register('description', { required: 'Description is required' })}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Customization Options Section */}
      <div className="border-t pt-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Customization Options</h3>
          <Button 
            type="button"
            variant="secondary"
            onClick={addCustomizationOption}
            className="flex items-center gap-1 text-sm"
          >
            <FaPlus size={12} /> Add Option
          </Button>
        </div>
        
        {customizationFields.length === 0 && (
          <p className="text-sm text-gray-500 italic">No customization options added. Examples: Spice level, Portion size, Toppings</p>
        )}
        
        {customizationFields.map((field, index) => (
          <div key={field.id} className="mb-6 p-4 border rounded-md bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Option Group #{index + 1}</h4>
              <Button
                type="button"
                variant="danger"
                onClick={() => removeCustomization(index)}
                className="text-sm py-1 px-2"
              >
                <FaTimes size={12} /> Remove
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Spice Level"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  {...register(`customizationOptions.${index}.name`, {
                    required: 'Name is required',
                  })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option ID
                </label>
                <input
                  type="text"
                  placeholder="e.g., spice-level"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  {...register(`customizationOptions.${index}.id`, {
                    required: 'ID is required',
                  })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selection Type
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  {...register(`customizationOptions.${index}.type`)}
                >
                  <option value="select">Dropdown Menu</option>
                  <option value="radio">Radio Buttons (Choose One)</option>
                  <option value="checkbox">Checkboxes (Multiple)</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`required-${index}`}
                  className="h-4 w-4 text-red-600 rounded mr-2"
                  {...register(`customizationOptions.${index}.required`)}
                />
                <label htmlFor={`required-${index}`} className="text-sm font-medium text-gray-700">
                  Is this selection required?
                </label>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-sm font-medium text-gray-700">Selection Options</h5>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addCustomizationItem(index)}
                  className="text-xs py-1 px-2"
                >
                  <FaPlus size={10} /> Add Choice
                </Button>
              </div>
              
              {watch(`customizationOptions.${index}.options`)?.map((option, optionIndex) => (
                <div key={option.id} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Option name"
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                    {...register(`customizationOptions.${index}.options.${optionIndex}.name`, {
                      required: 'Name required',
                    })}
                  />
                  <input
                    type="text"
                    placeholder="ID"
                    className="w-24 p-2 border border-gray-300 rounded-md text-sm"
                    {...register(`customizationOptions.${index}.options.${optionIndex}.id`, {
                      required: 'ID required',
                    })}
                  />
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-1">+Rp</span>
                    <input
                      type="number"
                      placeholder="Extra price"
                      className="w-20 p-2 border border-gray-300 rounded-md text-sm"
                      {...register(`customizationOptions.${index}.options.${optionIndex}.price`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => removeCustomizationItem(index, optionIndex)}
                    className="text-xs py-1 px-2"
                    disabled={watch(`customizationOptions.${index}.options`)?.length <= 1}
                  >
                    <FaMinus size={10} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
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
        <p className="mt-1 text-xs text-gray-500">
          Accepted formats: JPEG, PNG, GIF, WEBP. Max size: 5MB
        </p>
        
        {/* Hidden field to store the image filename */}
        <input type="hidden" {...register('image')} />
        
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
        
        {/* Show local image instructions */}
        {imageFileName && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-1">Local Image Instructions</h4>
            <div className="text-xs whitespace-pre-line text-blue-700 font-mono">
              {getImageCopyInstructions(imageFileName)}
            </div>
            <div className="mt-3 border-t border-blue-100 pt-3 flex flex-col gap-2">
              <p className="text-xs text-blue-700">
                <strong>⚠️ PENTING:</strong> Setelah menyimpan menu, Anda perlu menyalin file gambar ke folder public/images/menu/ agar gambar dapat ditampilkan.
              </p>
              
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-blue-800">Nama file yang akan digunakan:</p>
                <code className="bg-white text-blue-800 px-2 py-1 rounded text-xs border border-blue-100">
                  {imageFileName}
                </code>
              </div>
              
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-blue-800">Path lengkap yang akan disimpan:</p>
                <code className="bg-white text-blue-800 px-2 py-1 rounded text-xs border border-blue-100 break-all">
                  images/menu/{imageFileName}
                </code>
              </div>
              
              <p className="text-xs text-blue-700 mt-1">
                Jika gambar tidak muncul setelah menyimpan menu, pastikan:
              </p>
              <ol className="text-xs text-blue-700 list-decimal pl-5 space-y-1">
                <li>File gambar disalin ke folder public/images/menu/</li>
                <li>Nama file sama persis dengan yang ditampilkan di atas (termasuk ekstensi)</li>
                <li>Browser di-refresh (Ctrl+F5) untuk menghapus cache</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Please wait...' : (isEditing ? 'Update Menu' : 'Add Menu')}
        </Button>
      </div>
    </form>
  );
};

export default MenuForm; 