import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';

const SimpleMenuPage: React.FC = () => {
  console.log('SimpleMenuPage - Component rendering');
  
  return (
    <Layout>
      <div className="w-full p-8 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Simple Menu Management</h1>
          <p className="mb-8">This is a simplified version of the menu page for testing.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">Menu Item {item}</h3>
                <p className="text-gray-600 mb-4">This is a sample menu item for testing purposes.</p>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-medium">$10.99</span>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-between">
            <Link 
              to="/admin/test" 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Go to Test Page
            </Link>
            <Link 
              to="/admin/tables" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Tables
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SimpleMenuPage; 