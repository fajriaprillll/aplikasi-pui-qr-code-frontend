import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaUserPlus, FaExclamationCircle, FaUserCog, FaCheck } from 'react-icons/fa';

interface RegisterFormData {
  username: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
}

const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, registerUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form validation and handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: '',
      password: '',
      name: '',
      role: 'STAFF',
    },
  });

  // Check if user is authenticated and admin
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      console.log('StaffManagementPage - Registering new user:', data.username);
      const success = await registerUser(data);

      if (success) {
        console.log('StaffManagementPage - Registration successful');
        setSuccessMessage(`Successfully registered ${data.name} as ${data.role.toLowerCase()}`);
        // Reset form
        reset();
      } else {
        console.log('StaffManagementPage - Registration failed');
        setError('Failed to register user. Username may already exist.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg text-blue-600 flex items-center justify-center mr-4">
                <FaUserCog size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
                <p className="text-gray-500">Register new staff members for the system</p>
              </div>
            </div>

            {error && (
              <motion.div 
                className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                role="alert"
              >
                <FaExclamationCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6 flex items-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                role="alert"
              >
                <FaCheck className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm">{successMessage}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaUser />
                  </div>
                  <input
                    id="name"
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200`}
                    {...register('name', { required: 'Full name is required' })}
                    placeholder="Enter staff member's full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <FaExclamationCircle className="mr-1.5" size={12} />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaUser />
                  </div>
                  <input
                    id="username"
                    type="text"
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.username ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200`}
                    {...register('username', { 
                      required: 'Username is required',
                      minLength: { value: 3, message: 'Username must be at least 3 characters' } 
                    })}
                    placeholder="Enter login username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <FaExclamationCircle className="mr-1.5" size={12} />
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaLock />
                  </div>
                  <input
                    id="password"
                    type="password"
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200`}
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' } 
                    })}
                    placeholder="Enter secure password"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center">
                    <FaExclamationCircle className="mr-1.5" size={12} />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Role
                </label>
                <select
                  id="role"
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200"
                  {...register('role')}
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  className="py-3 text-base font-medium shadow-md bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center"
                >
                  <FaUserPlus className="mr-2" />
                  {isLoading ? 'Registering...' : 'Register New Staff'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default StaffManagementPage; 