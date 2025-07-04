import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaLock, FaUserPlus, FaExclamationCircle, FaUserCog, 
  FaCheck, FaSearch, FaUserEdit, FaTrash, FaFilter, FaEye, FaTimes, 
  FaIdCard, FaCalendarAlt, FaClock, FaSync, FaCheckCircle
} from 'react-icons/fa';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import Modal from '../../components/Modal';
import api from '../../api/axios';

// Import the User interface from the same location it's defined
// in the auth store
interface User {
  id: number;
  username: string;
  name?: string;
  role: 'ADMIN' | 'STAFF';
  createdAt?: string;
  updatedAt?: string;
}

interface RegisterFormData {
  username: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
}

// SafeStaffManagement wrapper component
const SafeStaffManagement: React.FC = () => {
  const [error, setError] = useState<Error | null>(null);
  
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-bold mb-2">Error Loading Staff Management</h2>
            <p className="mb-2">{error.message}</p>
            <p className="text-sm">{error.stack}</p>
            <button
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      </Layout>
    );
  }
  
  try {
    return <StaffManagementPage />;
  } catch (err) {
    console.error("Error rendering StaffManagementPage:", err);
    setError(err as Error);
    return null;
  }
};

const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    isAdmin, 
    registerUser, 
    users, 
    getUsers, 
    isLoadingUsers,
    usersError,
    updateUser,
    deleteUser
  } = useAuthStore();
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'STAFF'>('ALL');
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    username: '',
    name: '',
    role: 'STAFF',
    password: ''
  });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: number, name: string}>({id: 0, name: ''});
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } else {
      // Load users when authenticated as admin
      getUsers();
    }
  }, [isAuthenticated, isAdmin, navigate, getUsers]);

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
        
        // Close register form after success
        setTimeout(() => {
          setShowRegisterForm(false);
        }, 2000);
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

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });
  
  // Format date to readable string
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  // Format time to readable string
  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05 
      } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 400, damping: 30 }
    }
  };
  
  const formVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: 20 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: { 
        type: "spring" as const, 
        stiffness: 500, 
        damping: 30 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10,
      transition: { 
        duration: 0.2 
      }
    }
  };

  // Function to fetch user details
  const fetchUserDetails = async (userId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Make API call to get user details
      const response = await api.get(`/auth/users/${userId}`);
      
      if (response.status === 200 && response.data) {
        setSelectedUser(response.data);
        setShowUserDetailsModal(true);
        return response.data;
      } else {
        setError('Failed to fetch user details');
        return null;
      }
    } catch (err) {
      setError('An error occurred while fetching user details.');
      console.error('Fetch user details error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to open user details modal
  const handleViewUserDetails = async (user: User) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the fetch user details API to get the most up-to-date information
      const response = await api.get(`/auth/users/${user.id}`);
      
      if (response.status === 200 && response.data) {
        setSelectedUser(response.data);
        setShowUserDetailsModal(true);
      } else {
        setError('Failed to fetch user details');
        
        // Fall back to using the basic information we already have
        setSelectedUser(user);
        setShowUserDetailsModal(true);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Error fetching user details');
      
      // Fall back to using the basic information we already have
      setSelectedUser(user);
      setShowUserDetailsModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to open edit user modal
  const handleEditUser = async (user: User) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the latest user data before editing
      const response = await api.get(`/auth/users/${user.id}`);
      
      if (response.status === 200 && response.data) {
        const userData = response.data;
        setSelectedUser(userData);
        setEditUserForm({
          username: userData.username,
          name: userData.name || '',
          role: userData.role,
          password: '' // Empty password means it won't be updated
        });
      } else {
        // Fall back to the data we already have
        setSelectedUser(user);
        setEditUserForm({
          username: user.username,
          name: user.name || '',
          role: user.role,
          password: ''
        });
      }
    } catch (err) {
      console.error('Error fetching user details for edit:', err);
      
      // Fall back to the data we already have
      setSelectedUser(user);
      setEditUserForm({
        username: user.username,
        name: user.name || '',
        role: user.role,
        password: ''
      });
    } finally {
      setIsLoading(false);
      setShowEditUserModal(true);
    }
  };

  // Function to handle user update
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Only include password if it's not empty
      const updateData: any = {
        username: editUserForm.username,
        name: editUserForm.name,
        role: editUserForm.role
      };
      
      if (editUserForm.password) {
        updateData.password = editUserForm.password;
      }
      
      // Make the API call to update the user
      const response = await api.put(`/auth/users/${selectedUser.id}`, updateData);
      
      if (response.status === 200) {
        // Update the users list by replacing the updated user
        const updatedUsers = users.map(user => 
          user.id === selectedUser.id ? response.data : user
        );
        
        // Update the local state
        useAuthStore.setState({ users: updatedUsers });
        
        setSuccessMessage(`User ${editUserForm.name || editUserForm.username} has been updated successfully`);
        setShowEditUserModal(false);
        
        // Show success message temporarily
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError('Failed to update user. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while updating the user.');
      console.error('Update user error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to confirm delete user
  const confirmDeleteUser = (userId: number, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteConfirmation(true);
  };

  // Function to handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      // Make the API call to delete the user
      const response = await api.delete(`/auth/users/${userToDelete.id}`);
      
      if (response.status === 200) {
        // Update the users list by filtering out the deleted user
        const updatedUsers = users.filter(user => user.id !== userToDelete.id);
        
        // Update the local state
        useAuthStore.setState({ users: updatedUsers });
        
        setSuccessMessage(`User ${userToDelete.name} has been deleted successfully`);
        setShowDeleteConfirmation(false);
        
        // Show success message temporarily
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError('Failed to delete user. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while deleting the user.');
      console.error('Delete user error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="flex items-center mb-4 lg:mb-0">
              <div className="w-12 h-12 bg-primary-100 rounded-lg text-primary-500 flex items-center justify-center mr-4">
                <FaUserCog size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
                <p className="text-gray-500">Manage staff members and administrators</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={() => setShowRegisterForm(!showRegisterForm)}
                className="flex items-center gap-2 px-4 py-2.5 shadow-md"
              >
                {showRegisterForm ? (
                  <>
                    <FaTimes size={16} />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <FaUserPlus size={16} />
                    <span>Add New Staff</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Search and Filter */}
          <motion.div
            className="bg-white rounded-xl shadow-md p-5 border border-gray-100 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaSearch size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or username..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="text-gray-500 flex items-center">
                  <FaFilter className="mr-2" size={14} />
                  <span className="text-sm font-medium mr-2">Role:</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant={roleFilter === "ALL" ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setRoleFilter("ALL")}
                    className={`text-xs px-3 py-1.5 ${roleFilter === "ALL" ? "shadow-sm" : ""}`}
                  >
                    All
                  </Button>
                  <Button
                    variant={roleFilter === "ADMIN" ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setRoleFilter("ADMIN")}
                    className={`text-xs px-3 py-1.5 ${roleFilter === "ADMIN" ? "shadow-sm" : ""}`}
                  >
                    Admin
                  </Button>
                  <Button
                    variant={roleFilter === "STAFF" ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setRoleFilter("STAFF")}
                    className={`text-xs px-3 py-1.5 ${roleFilter === "STAFF" ? "shadow-sm" : ""}`}
                  >
                    Staff
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Registration Form */}
          <AnimatePresence>
            {showRegisterForm && (
              <motion.div
                className="bg-white rounded-xl shadow-md p-6 md:p-8 border border-gray-100 mb-6"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <FaUserPlus className="mr-2 text-primary-500" />
                    Register New User
                  </h2>
                  <button 
                    onClick={() => setShowRegisterForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={18} />
                  </button>
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

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                        className={`w-full pl-10 pr-4 py-2.5 border ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200`}
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
                        className={`w-full pl-10 pr-4 py-2.5 border ${
                          errors.username ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200`}
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
                        className={`w-full pl-10 pr-4 py-2.5 border ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200`}
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
                      className="w-full py-2.5 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
                      {...register('role')}
                    >
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 pt-3">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      isLoading={isLoading}
                      className="py-2.5 text-base font-medium shadow-md flex items-center justify-center"
                    >
                      <FaUserPlus className="mr-2" />
                      {isLoading ? 'Registering...' : 'Register New User'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Success Message - Improved positioning and animation */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                className="fixed top-24 sm:top-20 right-0 left-0 mx-auto w-4/5 max-w-md bg-white rounded-lg shadow-xl z-50 border border-green-200 overflow-hidden"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25 
                }}
              >
                <div className="bg-green-500 h-1.5 w-full"></div>
                <div className="p-4 flex items-center gap-3">
                  <span className="bg-green-100 text-green-600 p-2 rounded-full flex-shrink-0">
                    <FaCheckCircle size={20} />
                  </span>
                  <span className="font-medium text-gray-800">{successMessage}</span>
                </div>
                <motion.div 
                  className="h-1 bg-green-500"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Error Message - Added for consistency */}
          <AnimatePresence>
            {error && !showEditUserModal && !showRegisterForm && (
              <motion.div
                className="fixed top-24 sm:top-20 right-0 left-0 mx-auto w-4/5 max-w-md bg-white rounded-lg shadow-xl z-50 border border-red-200 overflow-hidden"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25 
                }}
              >
                <div className="bg-red-500 h-1.5 w-full"></div>
                <div className="p-4 flex items-center gap-3">
                  <span className="bg-red-100 text-red-600 p-2 rounded-full flex-shrink-0">
                    <FaExclamationCircle size={20} />
                  </span>
                  <span className="font-medium text-gray-800">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Details Modal - With improved animations and styling */}
          <AnimatePresence>
            {showUserDetailsModal && selectedUser && (
              <motion.div 
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUserDetailsModal(false)}
              >
                <motion.div 
                  className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                      <FaUser className="mr-2 text-primary-500" />
                      User Details
                    </h3>
                    <motion.button 
                      onClick={() => setShowUserDetailsModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaTimes size={18} />
                    </motion.button>
                  </div>

                  <motion.div 
                    className="user-details space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center mb-6">
                      <motion.div 
                        className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-4"
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <FaUser size={24} />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {selectedUser.name || selectedUser.username}
                        </h3>
                        <span className={`mt-1 px-3 py-1 rounded-full text-xs font-medium inline-block ${
                          selectedUser.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedUser.role}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="detail-row flex">
                        <span className="label w-1/3 text-gray-500">Username:</span>
                        <span className="value w-2/3 font-medium">{selectedUser.username}</span>
                      </div>
                      <div className="detail-row flex">
                        <span className="label w-1/3 text-gray-500">User ID:</span>
                        <span className="value w-2/3 font-medium">{selectedUser.id}</span>
                      </div>
                      <div className="detail-row flex">
                        <span className="label w-1/3 text-gray-500">Created:</span>
                        <span className="value w-2/3">
                          {formatDate(selectedUser.createdAt)} at {formatTime(selectedUser.createdAt)}
                        </span>
                      </div>
                      {selectedUser.updatedAt && (
                        <div className="detail-row flex">
                          <span className="label w-1/3 text-gray-500">Last Updated:</span>
                          <span className="value w-2/3">
                            {formatDate(selectedUser.updatedAt)} at {formatTime(selectedUser.updatedAt)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end mt-6">
                      <motion.button
                        className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                        onClick={() => setShowUserDetailsModal(false)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        Close
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit User Modal - With improved animations and styling */}
          <AnimatePresence>
            {showEditUserModal && selectedUser && (
              <motion.div 
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditUserModal(false)}
              >
                <motion.div 
                  className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl"
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                      <FaUserEdit className="mr-2 text-blue-500" />
                      Edit User
                    </h3>
                    <motion.button 
                      onClick={() => setShowEditUserModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaTimes size={18} />
                    </motion.button>
                  </div>

                  {error && (
                    <motion.div 
                      className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <FaExclamationCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </motion.div>
                  )}

                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <FaUser />
                        </div>
                        <input
                          id="edit-name"
                          type="text"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
                          value={editUserForm.name}
                          onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})}
                          placeholder="Enter staff member's full name"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <FaUser />
                        </div>
                        <input
                          id="edit-username"
                          type="text"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
                          value={editUserForm.username}
                          onChange={(e) => setEditUserForm({...editUserForm, username: e.target.value})}
                          placeholder="Enter login username"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password (Leave blank to keep unchanged)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <FaLock />
                        </div>
                        <input
                          id="edit-password"
                          type="password"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200"
                          value={editUserForm.password}
                          onChange={(e) => setEditUserForm({...editUserForm, password: e.target.value})}
                          placeholder="Enter new password or leave blank"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Role
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <FaUserCog />
                        </div>
                        <select
                          id="edit-role"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all duration-200 appearance-none"
                          value={editUserForm.role}
                          onChange={(e) => setEditUserForm({...editUserForm, role: e.target.value as 'ADMIN' | 'STAFF'})}
                        >
                          <option value="STAFF">Staff</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.button
                      className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                      onClick={() => setShowEditUserModal(false)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      onClick={handleUpdateUser}
                      disabled={isSubmitting}
                      whileHover={!isSubmitting ? { scale: 1.03 } : {}}
                      whileTap={!isSubmitting ? { scale: 0.97 } : {}}
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div 
                            className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <FaUserEdit size={16} />
                          <span>Update User</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Dialog - With improved animations and styling */}
          <AnimatePresence>
            {showDeleteConfirmation && (
              <motion.div 
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteConfirmation(false)}
              >
                <motion.div 
                  className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <FaTrash className="mr-2 text-red-500" />
                      Confirm Delete
                    </h3>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-red-50 rounded-lg p-4 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-red-800">
                      Are you sure you want to delete user "{userToDelete.name}"?
                    </p>
                    <p className="text-red-600 text-sm mt-2 font-semibold">
                      This action cannot be undone.
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className="flex justify-end gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.button
                      className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                      onClick={() => setShowDeleteConfirmation(false)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                      onClick={handleDeleteUser}
                      disabled={isDeleting}
                      whileHover={!isDeleting ? { scale: 1.03 } : {}}
                      whileTap={!isDeleting ? { scale: 0.97 } : {}}
                    >
                      {isDeleting ? (
                        <>
                          <motion.div 
                            className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <FaTrash size={16} />
                          <span>Delete User</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Staff List */}
          {isLoadingUsers ? (
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-gray-500">Loading staff data...</p>
            </div>
          ) : usersError ? (
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 flex flex-col items-center justify-center h-64 text-center">
              <div className="bg-red-100 p-3 rounded-full text-red-500 mb-3">
                <FaExclamationCircle size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Failed to Load Users</h3>
              <p className="text-gray-500 mb-4">{usersError}</p>
              <Button
                variant="primary"
                onClick={() => getUsers()}
                size="sm"
              >
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100 flex flex-col items-center justify-center h-64 text-center">
              <div className="bg-yellow-100 p-3 rounded-full text-yellow-500 mb-3">
                <FaUserCog size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Staff Members Found</h3>
              <p className="text-gray-500 mb-4">Click "Add New Staff" to create your first staff member.</p>
              <Button
                variant="primary"
                onClick={() => setShowRegisterForm(true)}
                className="flex items-center gap-2"
              >
                <FaUserPlus size={16} />
                <span>Add New Staff</span>
              </Button>
            </div>
          ) : (
            <motion.div
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No users match your search criteria
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <motion.tr 
                          key={user.id} 
                          variants={itemVariants}
                          whileHover={{ backgroundColor: "#f9fafb" }}
                          className="group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-3">
                                <FaUser />
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">
                                  {user.name || '[No name provided]'}
                                </div>
                                <div className="text-xs flex items-center text-gray-500">
                                  <FaIdCard className="mr-1" size={10} />
                                  ID: {user.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                              user.role === 'ADMIN' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center">
                                <FaCalendarAlt className="mr-1.5 text-gray-400" size={12} />
                                {formatDate(user.createdAt)}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <FaClock className="mr-1" size={10} />
                                {formatTime(user.createdAt)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <button 
                                className="p-1.5 rounded-full hover:bg-gray-100"
                                title="View details"
                                onClick={() => handleViewUserDetails(user)}
                              >
                                <FaEye className="text-gray-500 hover:text-gray-700" size={16} />
                              </button>
                              <button 
                                className="p-1.5 rounded-full hover:bg-gray-100"
                                title="Edit user"
                                onClick={() => handleEditUser(user)}
                              >
                                <FaUserEdit className="text-blue-500 hover:text-blue-600" size={16} />
                              </button>
                              <button 
                                className="p-1.5 rounded-full hover:bg-gray-100"
                                title="Delete user"
                                onClick={() => confirmDeleteUser(user.id, user.name || user.username)}
                              >
                                <FaTrash className="text-red-500 hover:text-red-600" size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
                <div className="text-sm">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => getUsers()}
                    className="flex items-center gap-1.5"
                  >
                    <FaSync size={12} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default SafeStaffManagement; 