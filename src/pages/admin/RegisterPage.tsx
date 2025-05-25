import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store';
import Button from '../../components/Button';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaHome, FaExclamationCircle, FaUserPlus, FaArrowLeft } from 'react-icons/fa';

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser, isAuthenticated, isAdmin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'STAFF',
    },
  });

  // Check if admin is logged in
  // useEffect(() => {
  //   if (!isAuthenticated || !isAdmin) {
  //     navigate('/admin/login');
  //   }
  // }, [isAuthenticated, isAdmin, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Check if passwords match
      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Validate password length
      if (data.password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      console.log('RegisterPage - Registering new user:', data.username);
      const success = await registerUser({
        username: data.username,
        password: data.password,
        name: data.name,
        role: data.role
      });

      if (success) {
        console.log('RegisterPage - Registration successful');
        setSuccess(`Successfully registered ${data.name} as ${data.role.toLowerCase()}`);
        // Reset form
        reset();
      } else {
        console.log('RegisterPage - Registration failed');
        
        // Here we could set more specific errors if we had access to the error details
        // Since the error details are logged in the store, we'll use a generic message
        setError('Registration failed. The username may already be taken or the server encountered an error.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Try to extract more specific error message if available
      let errorMessage = 'An error occurred during registration. Please try again.';
      
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout noHeaderFooter>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center px-4 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full -mt-32 -mr-32 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200 rounded-full -mb-32 -ml-32 opacity-20"></div>
        
        {/* Animated dots */}
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute bg-blue-400 rounded-full opacity-10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 50 + 20}px`,
              height: `${Math.random() * 50 + 20}px`,
            }}
            animate={{
              y: [0, Math.random() * 30 - 15],
              x: [0, Math.random() * 30 - 15],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: Math.random() * 3 + 2,
            }}
          />
        ))}
        
        {/* Back to Login button */}
        <motion.div
          className="fixed top-6 left-6 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link
            to="/admin/login"
            className="flex items-center justify-center px-4 py-2.5 bg-white hover:bg-blue-50 transition-colors rounded-lg shadow-md text-blue-600 border border-blue-100 group"
          >
            <FaArrowLeft className="mr-2 group-hover:scale-110 transition-transform" />
            <span>Back to Login</span>
          </Link>
        </motion.div>
        
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100"
            whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
          >
            <div className="text-center mb-8">
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <FaUserPlus className="text-white text-2xl" />
              </motion.div>
              <motion.h1 
                className="text-3xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Register New User
              </motion.h1>
              <motion.p 
                className="text-gray-500 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Create a new staff or admin account
              </motion.p>
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

            {success && (
              <motion.div 
                className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6 flex items-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                role="alert"
              >
                <FaUserPlus className="text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm">{success}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
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
                    placeholder="Enter full name"
                  />
                </div>
                {errors.name && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1.5 text-sm text-red-600 flex items-center"
                  >
                    <FaExclamationCircle className="mr-1.5" size={12} />
                    {errors.name.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
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
                      minLength: { value: 3, message: 'Username must be at least 3 characters long' }
                    })}
                    placeholder="Enter username"
                  />
                </div>
                {errors.username && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1.5 text-sm text-red-600 flex items-center"
                  >
                    <FaExclamationCircle className="mr-1.5" size={12} />
                    {errors.username.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
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
                      minLength: { value: 6, message: 'Password must be at least 6 characters long' }
                    })}
                    placeholder="Enter password"
                  />
                </div>
                {errors.password && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1.5 text-sm text-red-600 flex items-center"
                  >
                    <FaExclamationCircle className="mr-1.5" size={12} />
                    {errors.password.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaLock />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`w-full pl-10 pr-4 py-3 border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200`}
                    {...register('confirmPassword', { 
                      required: 'Please confirm your password',
                      validate: (value) => value === watch('password') || 'Passwords do not match'
                    })}
                    placeholder="Confirm password"
                  />
                </div>
                {errors.confirmPassword && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-1.5 text-sm text-red-600 flex items-center"
                  >
                    <FaExclamationCircle className="mr-1.5" size={12} />
                    {errors.confirmPassword.message}
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  className="py-3 text-base font-medium shadow-md bg-gradient-to-r from-blue-500 to-blue-600"
                >
                  {isLoading ? 'Registering...' : 'Register User'}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default RegisterPage; 