import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion } from 'framer-motion';
import { FaUtensils, FaQrcode, FaArrowRight, FaShoppingBag, FaHeart, FaClipboardCheck } from 'react-icons/fa';
import { Parallax } from 'react-parallax';
import { useAuthStore } from '../store/authStore';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

// Format currency function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const HomePage: React.FC = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Verify authentication status when component mounts
    const verifyAuth = async () => {
      await checkAuth();
    };
    
    verifyAuth();
  }, [checkAuth]);

  return (
    <Layout>
      {/* Hero Section */}
      <Parallax
        bgImage="/images/homepage.webp"
        strength={300}
        bgImageStyle={{ opacity: 0.65 }}
        className="relative"
      >
        <div className="relative bg-gradient-to-r from-black/70 to-black/40 min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl w-full h-full flex flex-col justify-center">
            <div className="py-20 sm:py-32">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="max-w-xl"
              >
                <motion.div variants={fadeInUp} className="mb-4">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Welcome to
                  </span>
                </motion.div>

                <motion.h1
                  variants={fadeInUp}
                  className="text-4xl md:text-6xl font-bold text-white mb-4 font-display leading-tight text-shadow"
                >
                  Kedai Matmoen
                </motion.h1>

                <motion.p
                  variants={fadeInUp}
                  className="text-xl text-gray-100 mb-8 max-w-lg"
                >
                  Delicious Indonesian cuisine made with fresh ingredients and authentic recipes. Scan, order, and enjoy!
                </motion.p>

                <motion.div
                  variants={fadeInUp}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  {!isAuthenticated && (
                    <Link
                      to="/admin/login"
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 border border-white/30 group"
                    >
                      <span>Admin Login</span>
                      <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}

                  <Link
                    to="/order"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg transform transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group"
                  >
                    <FaQrcode className="text-xl group-hover:scale-110 transition-transform" />
                    <span>Scan & Order Now</span>
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* Stats or info boxes */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center mb-2">
                  <div className="bg-primary-500/20 rounded-full p-2 mr-3">
                    <FaUtensils className="text-primary-400 text-lg" />
                  </div>
                  <h3 className="font-semibold text-white">Fresh Ingredients</h3>
                </div>
                <p className="text-white/80 text-sm">We use only the freshest ingredients for all our dishes</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center mb-2">
                  <div className="bg-primary-500/20 rounded-full p-2 mr-3">
                    <FaQrcode className="text-primary-400 text-lg" />
                  </div>
                  <h3 className="font-semibold text-white">Easy Ordering</h3>
                </div>
                <p className="text-white/80 text-sm">Scan, select and pay - all from your table</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center mb-2">
                  <div className="bg-primary-500/20 rounded-full p-2 mr-3">
                    <FaHeart className="text-primary-400 text-lg" />
                  </div>
                  <h3 className="font-semibold text-white">Customer Favorite</h3>
                </div>
                <p className="text-white/80 text-sm">Join our community of satisfied customers</p>
              </div>
            </motion.div>
          </div>
        </div>
      </Parallax>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-gray-900 dark:text-white font-display mb-3"
            >
              How It Works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              Ordering at Kedai Matmoen is easy and convenient with our QR code system
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300"
            >
              <div className="absolute -right-4 -top-4 bg-primary-100 dark:bg-primary-900/30 rounded-full w-24 h-24 flex items-center justify-center font-bold text-2xl text-primary-500 opacity-30">
                1
              </div>
              <div className="bg-primary-50 dark:bg-primary-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <FaQrcode className="text-2xl text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">Scan QR Code</h3>
              <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                Scan the QR code on your table to access our digital menu
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300"
            >
              <div className="absolute -right-4 -top-4 bg-primary-100 dark:bg-primary-900/30 rounded-full w-24 h-24 flex items-center justify-center font-bold text-2xl text-primary-500 opacity-30">
                2
              </div>
              <div className="bg-primary-50 dark:bg-primary-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <FaShoppingBag className="text-2xl text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">Place Your Order</h3>
              <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                Browse our menu and add your favorite items to your cart
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 relative overflow-hidden group hover:-translate-y-2 transition-all duration-300"
            >
              <div className="absolute -right-4 -top-4 bg-primary-100 dark:bg-primary-900/30 rounded-full w-24 h-24 flex items-center justify-center font-bold text-2xl text-primary-500 opacity-30">
                3
              </div>
              <div className="bg-primary-50 dark:bg-primary-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <FaClipboardCheck className="text-2xl text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">Enjoy Your Meal</h3>
              <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                We'll prepare your food and serve it fresh to your table
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold mb-4 font-display"
            >
              Ready to Experience Kedai Matmoen?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-white/90 mb-8 text-lg"
            >
              Visit us today and enjoy the convenience of our QR ordering system with delicious Indonesian cuisine
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >

            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage; 