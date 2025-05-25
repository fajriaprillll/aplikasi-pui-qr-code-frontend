import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import Layout from '../../components/Layout';

const TestPage: React.FC = () => {
  console.log('TestPage - Component rendering');
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuthStore();
  
  console.log('TestPage - Auth state:', { isAuthenticated, isAdmin });
  
  useEffect(() => {
    console.log('TestPage - Checking authentication:', { isAuthenticated, isAdmin });
    if (!isAuthenticated || !isAdmin) {
      console.log('TestPage - User not authenticated or not admin, redirecting to login');
      navigate('/admin/login');
    } else {
      console.log('TestPage - User is authenticated and admin');
    }
  }, [isAuthenticated, isAdmin, navigate]);
  
  console.log('TestPage - Before rendering Layout');
  
  return (
    <Layout>
      <div className="w-full p-8 bg-gradient-to-b from-blue-50 via-white to-white">
        <h1 className="text-3xl font-bold mb-4">Test Page</h1>
        <p className="mb-4">This is a simple test page to check rendering issues.</p>
        <p className="mb-4">Authentication status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</p>
        <p className="mb-4">Admin status: {isAdmin ? 'Admin' : 'Not admin'}</p>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            console.log('TestPage - Navigating back to login');
            navigate('/admin/login');
          }}
        >
          Go to Login
        </button>
      </div>
    </Layout>
  );
};

export default TestPage; 