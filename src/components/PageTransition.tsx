import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageTransition component for animating page transitions
 * Wrap your page content with this component to add smooth entry animations
 */
const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className = '' 
}) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 15
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
        when: "beforeChildren",
        staggerChildren: 0.12
      }
    },
    exit: {
      opacity: 0,
      y: -15,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  return (
    <motion.div
      className={`will-change-transform ${className}`}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

/**
 * Child component that can be used for staggered animations within a page
 */
export const ChildAnimation: React.FC<PageTransitionProps> = ({ 
  children, 
  className = '' 
}) => {
  const childVariants = {
    initial: { 
      opacity: 0, 
      y: 15 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  };

  return (
    <motion.div
      className={`will-change-transform ${className}`}
      variants={childVariants}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition; 