import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import Layout from '../components/Layout';
import Button from '../components/Button';
import { motion } from 'framer-motion';
import { FaUtensils, FaMobileAlt, FaQrcode, FaShoppingCart, FaClipboardCheck, FaChartLine, FaUsers, FaStar, FaQuoteLeft, FaCoffee } from 'react-icons/fa';

const HomePage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuthStore();
  
  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-br from-white via-gray-50 to-kedai-red/10 pb-20">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-kedai-red opacity-5 rounded-b-[30%] h-[55vh]"></div>
          
          <div className="container mx-auto px-4 pt-12 pb-20 flex flex-col md:flex-row items-center">
            <motion.div 
              className="md:w-1/2 text-center md:text-left mb-10 md:mb-0 z-10"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.h1 
                className="text-5xl sm:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-kedai-red to-kedai-black drop-shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Smart QR Food Ordering
              </motion.h1>
              
              <motion.p 
                className="text-xl sm:text-2xl text-gray-700 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                Streamline your dining experience at Kedai Matmoen with our contactless ordering system.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                {isAdmin && isAuthenticated ? (
                  <Link to="/admin/menu" className="w-full sm:w-auto">
                    <Button variant="primary" className="w-full sm:w-auto text-lg py-4 px-8 rounded-xl bg-gradient-to-r from-kedai-red to-kedai-red/80 shadow-lg hover:scale-105 hover:shadow-kedai-red/50 transition-all duration-300">
                      Go to Admin Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/admin/login" className="w-full sm:w-auto">
                    <Button variant="primary" className="w-full sm:w-auto text-lg py-4 px-8 rounded-xl bg-gradient-to-r from-kedai-red to-kedai-red/80 shadow-lg hover:scale-105 hover:shadow-kedai-red/50 transition-all duration-300">
                      Admin Login
                    </Button>
                  </Link>
                )}
                <Link to="/order?table=1" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full sm:w-auto text-lg py-4 px-8 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 text-kedai-red shadow-lg hover:scale-105 hover:shadow-kedai-red/30 transition-all duration-300">
                    Order Now
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="md:w-1/2 relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <div className="relative mx-auto w-full max-w-md">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-40 h-40 bg-kedai-red opacity-20 rounded-full"></div>
                <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-32 h-32 bg-kedai-red opacity-10 rounded-full"></div>
                
                <motion.div 
                  className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white"
                  whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                  transition={{ duration: 0.5 }}
                >
                  <img 
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80" 
                    alt="QR code ordering system" 
                    className="w-full rounded-lg"
                  />
                  
                  <motion.div 
                    className="absolute top-4 left-4 bg-white py-2 px-3 rounded-full shadow-md flex items-center"
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  >
                    <FaQrcode className="text-kedai-red mr-2" />
                    <span className="text-gray-800 font-medium text-sm">Scan to Order</span>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="container mx-auto px-4 -mt-8">
          <motion.div 
            className="bg-white rounded-2xl shadow-xl p-8 mb-16 max-w-5xl mx-auto"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-kedai-red/10 rounded-full flex items-center justify-center mb-4">
                  <FaUtensils className="text-kedai-red text-xl" />
                </div>
                <p className="text-4xl font-bold text-gray-800 mb-2">30%</p>
                <p className="text-gray-600">Faster Service</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-kedai-red/10 rounded-full flex items-center justify-center mb-4">
                  <FaUsers className="text-kedai-red text-xl" />
                </div>
                <p className="text-4xl font-bold text-gray-800 mb-2">500+</p>
                <p className="text-gray-600">Happy Customers</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-kedai-red/10 rounded-full flex items-center justify-center mb-4">
                  <FaChartLine className="text-kedai-red text-xl" />
                </div>
                <p className="text-4xl font-bold text-gray-800 mb-2">24%</p>
                <p className="text-gray-600">Revenue Increase</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 mb-20">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold mb-4 text-kedai-red inline-block"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              How It Works
              <div className="h-1 bg-gradient-to-r from-kedai-red to-kedai-red/50 mt-2 rounded-full"></div>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {[{
              step: 1,
              title: 'Scan QR Code',
              desc: 'Use your smartphone to scan the QR code at your table',
              icon: <FaQrcode className="w-10 h-10 text-kedai-red" />,
              delay: 0
            }, {
              step: 2,
              title: 'Select Items',
              desc: 'Browse the menu and add items to your cart',
              icon: <FaShoppingCart className="w-10 h-10 text-kedai-red" />,
              delay: 0.2
            }, {
              step: 3,
              title: 'Place Order',
              desc: 'Submit your order and wait for your food to arrive',
              icon: <FaClipboardCheck className="w-10 h-10 text-kedai-red" />,
              delay: 0.4
            }].map((item) => (
              <motion.div 
                key={item.step} 
                className="flex flex-col items-center text-center w-full bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:shadow-kedai-red/20 transform transition-all duration-300 hover:-translate-y-2"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: item.delay }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
              >
                <motion.div 
                  className="bg-gradient-to-br from-kedai-red to-kedai-red/80 w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg"
                  whileHover={{ rotate: 5 }}
                >
                  {item.icon}
                </motion.div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">{item.title}</h3>
                <p className="text-gray-600 text-lg">{item.desc}</p>
                <div className="w-16 h-16 rounded-full bg-kedai-red/10 flex items-center justify-center mt-6 font-bold text-2xl text-kedai-red">
                  {item.step}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-gradient-to-br from-kedai-red/5 to-kedai-red/10 rounded-t-[50px] mb-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4 text-kedai-red inline-block"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                What Our Customers Say
                <div className="h-1 bg-gradient-to-r from-kedai-red to-kedai-red/50 mt-2 rounded-full"></div>
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Regular Customer",
                  text: "I love ordering at Kedai Matmoen with the QR system! It's so convenient and the food is always delicious. No more waiting for servers to take my order.",
                  stars: 5,
                  delay: 0
                },
                {
                  name: "Michael Chen",
                  role: "Food Enthusiast",
                  text: "The interface is intuitive and makes dining at Kedai Matmoen so much more convenient. Their menu selection is fantastic and ordering is a breeze!",
                  stars: 5,
                  delay: 0.2
                },
                {
                  name: "Emily Williams",
                  role: "First-time Visitor",
                  text: "I was impressed by how easy it was to order on my first visit to Kedai Matmoen. The QR ordering system is simple and the staff is very friendly.",
                  stars: 4,
                  delay: 0.4
                }
              ].map((testimonial, idx) => (
                <motion.div 
                  key={idx}
                  className="bg-white p-8 rounded-2xl shadow-lg"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: testimonial.delay }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    y: -10,
                    boxShadow: "0 25px 50px -12px rgba(226, 12, 12, 0.15)"
                  }}
                >
                  <FaQuoteLeft className="text-kedai-red/20 text-4xl mb-4" />
                  <p className="text-gray-600 mb-6 italic">{testimonial.text}</p>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-12 h-12 bg-kedai-red/10 rounded-full flex items-center justify-center text-kedai-red">
                        <FaCoffee />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{testimonial.name}</h4>
                      <p className="text-kedai-red/80">{testimonial.role}</p>
                      <div className="flex mt-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={`text-sm ${i < testimonial.stars ? 'text-kedai-red' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 mb-20">
          <motion.div 
            className="bg-gradient-to-r from-kedai-red to-kedai-black rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="absolute top-0 right-0 opacity-10">
              <img src="/images/logo/download.jpg" alt="Kedai Matmoen Logo" className="w-64 h-64 -mt-20 -mr-20 rounded-full" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Ready to Experience Kedai Matmoen?</h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto relative z-10">Visit us today and enjoy our delicious menu with the convenience of QR code ordering.</p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10"
            >
              <Link to="/order?table=1" className="inline-block bg-white text-kedai-red font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-kedai-red/30 transition-all duration-300">
                Order Now
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </Layout>
  );
};

export default HomePage; 