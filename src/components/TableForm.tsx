import React from 'react';
import { useForm } from 'react-hook-form';
import { TableStatus } from '../types';
import type { Table } from '../types';
import Button from './Button';

interface TableFormProps {
  initialData?: Table;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

const TableForm: React.FC<TableFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  error
}) => {
  const isEditing = !!initialData;

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
  } = useForm<Omit<Table, 'id'>>({
    defaultValues: initialData || {
      name: '',
      capacity: 4,
      status: TableStatus.AVAILABLE,
    },
  });

  const submitHandler = handleSubmit((data) => {
    // Make sure the capacity is a number
    const formattedData = {
      ...data,
      capacity: Number(data.capacity)
    };
    onSubmit(formattedData);
  });

  return (
    <form onSubmit={submitHandler} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Table Name/Number *
        </label>
        <input
          id="name"
          type="text"
          className={`w-full p-2 border rounded-md ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          {...register('name', { 
            required: 'Table name is required',
            validate: value => value.trim() !== '' || 'Table name cannot be empty'
          })}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
          Capacity *
        </label>
        <input
          id="capacity"
          type="number"
          min="1"
          className={`w-full p-2 border rounded-md ${
            errors.capacity ? 'border-red-500' : 'border-gray-300'
          }`}
          {...register('capacity', { 
            required: 'Capacity is required',
            min: { value: 1, message: 'Capacity must be at least 1' },
            valueAsNumber: true,
          })}
        />
        {errors.capacity && (
          <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          className="w-full p-2 border border-gray-300 rounded-md"
          {...register('status')}
        >
          <option value={TableStatus.AVAILABLE}>Available</option>
          <option value={TableStatus.OCCUPIED}>Occupied</option>
          <option value={TableStatus.RESERVED}>Reserved</option>
        </select>
      </div>

      <div className="flex gap-3 pt-4">
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
        >
          {isEditing ? 'Update Table' : 'Add Table'}
        </Button>
      </div>
    </form>
  );
};

export default TableForm; 