import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store';
import Button from '../../components/Button';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaHome, FaExclamationCircle, FaUserPlus } from 'react-icons/fa';

interface LoginFormData {
  username: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Check if there's a valid token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      console.log('LoginPage - Verifying existing auth');
      const isValid = await checkAuth();
      if (isValid) {
        console.log('LoginPage - Token is valid, redirecting');
        navigate('/admin/menu');
      }
    };
    
    verifyAuth();
  }, [checkAuth, navigate]);

  useEffect(() => {
    console.log('LoginPage - Auth state changed:', { isAuthenticated, isAdmin });
    if (isAuthenticated && isAdmin) {
      console.log('LoginPage - User is authenticated and admin, navigating to /admin/menu');
      navigate('/admin/menu');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('LoginPage - Attempting login with:', data.username);
      const success = await login(data.username, data.password);

      console.log('LoginPage - Login result:', success);
      if (success) {
        console.log('LoginPage - Login successful, navigating to /admin/menu');
        navigate('/admin/menu');
      } else {
        console.log('LoginPage - Login failed');
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout noHeaderFooter>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4 relative overflow-hidden text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-200 rounded-full -mt-32 -mr-32 opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200 rounded-full -mb-32 -ml-32 opacity-20"></div>
        
        {/* Animated dots */}
        {[...Array(6)].map((_, index) => (
          <motion.div
            key={index}
            className="absolute bg-red-400 rounded-full opacity-10"
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
        
        {/* Back to Home button */}
        <motion.div
          className="fixed top-6 left-6 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
        <Link
          to="/"
            className="flex items-center justify-center px-4 py-2.5 bg-white hover:bg-red-50 transition-colors rounded-lg shadow-md text-red-600 border border-red-100 group"
          >
            <FaHome className="mr-2 group-hover:scale-110 transition-transform" />
            <span>Back to Home</span>
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
                className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-md"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <FaUser className="text-white text-2xl" />
              </motion.div>
              <motion.h1 
                className="text-3xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Admin Login
              </motion.h1>
              <motion.p 
                className="text-gray-500 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Sign in to access the administrative dashboard
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
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
                    } rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-500 transition-all duration-200`}
                {...register('username', { required: 'Username is required' })}
                    placeholder="Enter your username"
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
                transition={{ delay: 0.6 }}
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
                    } rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-500 transition-all duration-200`}
                {...register('password', { required: 'Password is required' })}
                    placeholder="Enter your password"
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
                transition={{ delay: 0.7 }}
                className="pt-2"
              >
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
                  className="py-3 text-base font-medium shadow-md bg-gradient-to-r from-red-500 to-red-600"
            >
                  {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
              </motion.div>
          </form>

            <motion.div 
              className="mt-8 pt-5 border-t border-gray-100"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-3">
                  Need to register a new account?
                </p>
                <button 
                  onClick={() => navigate('/admin/register')}
                  className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                >
                  <FaUserPlus className="mr-2" />
                  Register New Account
                </button>
                <p className="text-xs text-gray-400 mt-3">
                  Note: Only admins can register new users
                </p>
            </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default LoginPage;
