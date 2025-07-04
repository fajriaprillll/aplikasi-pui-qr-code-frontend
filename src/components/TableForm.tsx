import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TableStatus } from '../types';
import type { Table } from '../types';
import Button from './Button';
import { motion } from 'framer-motion';
import { FaUser, FaChair, FaTag, FaExclamationCircle } from 'react-icons/fa';

interface TableFormProps {
  initialData?: Table;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

type FormField = 'name' | 'capacity' | 'status';

const TableForm: React.FC<TableFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  error
}) => {
  const isEditing = !!initialData;
  const [focused, setFocused] = useState<FormField | null>(null);

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch,
  } = useForm<Omit<Table, 'id'>>({
    defaultValues: initialData || {
      name: '',
      capacity: 4,
      status: TableStatus.AVAILABLE,
    },
  });

  // Watch form values for animations
  const watchedName = watch('name');
  const watchedCapacity = watch('capacity');
  const watchedStatus = watch('status');

  const submitHandler = handleSubmit((data) => {
    // Make sure the capacity is a number
    const formattedData = {
      ...data,
      capacity: Number(data.capacity)
    };
    onSubmit(formattedData);
  });

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.3,
        ease: "easeOut" as const
      }
    }
  };

  // Custom register with focus/blur handling
  const registerWithFocus = (name: FormField, options = {}) => {
    return {
      ...register(name, options),
      onFocus: () => setFocused(name),
      onBlur: () => setFocused(null)
    };
  };

  // Get status label and color
  const getStatusInfo = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return { 
          label: 'Available',
          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          icon: <FaChair className="mr-1.5" size={12} />
        };
      case TableStatus.OCCUPIED:
        return { 
          label: 'Occupied',
          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          icon: <FaUser className="mr-1.5" size={12} />
        };
      case TableStatus.RESERVED:
        return { 
          label: 'Reserved',
          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          icon: <FaChair className="mr-1.5" size={12} />
        };
      default:
        return { 
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
          icon: null
        };
    }
  };

  const currentStatus = watchedStatus ? getStatusInfo(watchedStatus as TableStatus) : getStatusInfo(TableStatus.AVAILABLE);

  // Generate capacity options from 1 to 20
  const capacityOptions = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <motion.form 
      initial="hidden"
      animate="visible"
      variants={formVariants}
      onSubmit={submitHandler} 
      className="space-y-6 w-full max-w-md mx-auto"
    >
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm mb-6" 
          role="alert"
        >
          <div className="flex">
            <div className="py-1">
              <FaExclamationCircle className="w-6 h-6 mr-4 text-red-500" />
            </div>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </motion.div>
      )}
      
      <motion.div variants={itemVariants} className="relative">
        <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${focused === 'name' ? 'text-primary-500' : ''}`}>
          <FaTag />
        </div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Table Name/Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="name"
            type="text"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:shadow-md ${
              focused === 'name' ? 'border-primary-500 ring-primary-200' : 'border-gray-300'
            } ${errors.name ? 'border-red-500 bg-red-50' : ''}`}
            {...registerWithFocus('name', { 
              required: 'Table name is required',
              validate: (value: string) => value.trim() !== '' || 'Table name cannot be empty'
            })}
          />
        </div>
        {errors.name && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 flex items-center"
          >
            <FaExclamationCircle className="w-4 h-4 mr-1" />
            {errors.name.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="relative">
        <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${focused === 'capacity' ? 'text-primary-500' : ''}`}>
          <FaUser />
        </div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
          Capacity <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="capacity"
            type="number"
            min="1"
            className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:shadow-md ${
              focused === 'capacity' ? 'border-primary-500 ring-primary-200' : 'border-gray-300'
            } ${errors.capacity ? 'border-red-500 bg-red-50' : ''}`}
            {...registerWithFocus('capacity', { 
              required: 'Capacity is required',
              min: { value: 1, message: 'Capacity must be at least 1' },
              valueAsNumber: true,
            })}
          />
        </div>
        {errors.capacity && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 flex items-center"
          >
            <FaExclamationCircle className="w-4 h-4 mr-1" />
            {errors.capacity.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="relative">
        <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${focused === 'status' ? 'text-primary-500' : ''}`}>
          <FaChair />
        </div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <div className="relative">
          <select
            id="status"
            className={`appearance-none w-full pl-10 pr-12 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:shadow-md ${
              focused === 'status' ? 'border-primary-500 ring-primary-200' : 'border-gray-300'
            }`}
            {...registerWithFocus('status')}
          >
            <option value={TableStatus.AVAILABLE}>Available</option>
            <option value={TableStatus.OCCUPIED}>Occupied</option>
            <option value={TableStatus.RESERVED}>Reserved</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${currentStatus.color}`}
        >
          {currentStatus.icon}
          {currentStatus.label}
        </motion.div>
      </motion.div>

      <motion.div 
        variants={itemVariants}
        className="flex gap-4 pt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
      >
        <Button
          type="button"
          variant="secondary"
          className="flex-1 py-3 transition-all duration-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-base"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1 py-3 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg rounded-xl text-base"
          isLoading={isSubmitting}
        >
          {isEditing ? 'Update Table' : 'Add Table'}
        </Button>
      </motion.div>
    </motion.form>
  );
};

export default TableForm; 