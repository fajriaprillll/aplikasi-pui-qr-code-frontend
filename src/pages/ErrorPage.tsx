import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaHome, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store';

interface ErrorPageProps {
  title?: string;
  message?: string;
  code?: number;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  title = 'Page Not Found',
  message = 'The page you are looking for does not exist or has been moved.',
  code = 404
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const goBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4 py-12">
      <motion.div 
        className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="bg-red-100 p-4 rounded-full mb-6">
            <FaExclamationTriangle className="text-red-500 text-4xl" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {title}
          </h1>
          
          <div className="text-gray-600 mb-8">
            <p className="mb-2">{message}</p>
            <p className="text-sm text-gray-500">Error Code: {code}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button
              onClick={goBack}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors w-full"
            >
              <FaArrowLeft />
              Go Back
            </button>
            
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-full"
            >
              <FaHome />
              Home Page
            </Link>
          </div>
          
          {!isAuthenticated && (
            <Link
              to="/admin/login"
              className="flex items-center justify-center gap-2 mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors w-full"
            >
              <FaSignInAlt />
              Login
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ErrorPage; 