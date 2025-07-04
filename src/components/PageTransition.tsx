import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variant, Variants } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown';
  duration?: number;
  delay?: number;
}

/**
 * Enhanced PageTransition component for animating page transitions
 * Wrap your page content with this component to add smooth entry animations
 */
const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className = '',
  variant = 'fade',
  duration = 0.5,
  delay = 0
}) => {
  const getVariants = (): Variants => {
    switch (variant) {
      case 'slide':
        return {
          initial: { opacity: 0, x: 15 },
          animate: { 
            opacity: 1, 
            x: 0,
            transition: {
              duration: duration,
              ease: "easeOut" as const,
              delay: delay,
              when: "beforeChildren" as const,
              staggerChildren: 0.12
            }
          },
          exit: { 
            opacity: 0, 
            x: -15,
            transition: {
              duration: duration * 0.8,
              ease: "easeOut" as const
            }
          }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { 
            opacity: 1, 
            scale: 1,
            transition: {
              duration: duration,
              ease: "easeOut" as const,
              delay: delay,
              when: "beforeChildren" as const,
              staggerChildren: 0.12
            }
          },
          exit: { 
            opacity: 0, 
            scale: 1.05,
            transition: {
              duration: duration * 0.8,
              ease: "easeOut" as const
            }
          }
        };
      case 'slideUp':
        return {
          initial: { opacity: 0, y: 30 },
          animate: { 
            opacity: 1, 
            y: 0,
            transition: {
              duration: duration,
              ease: "easeOut" as const,
              delay: delay,
              when: "beforeChildren" as const,
              staggerChildren: 0.12
            }
          },
          exit: { 
            opacity: 0, 
            y: -30,
            transition: {
              duration: duration * 0.8,
              ease: "easeOut" as const
            }
          }
        };
      case 'slideDown':
        return {
          initial: { opacity: 0, y: -30 },
          animate: { 
            opacity: 1, 
            y: 0,
            transition: {
              duration: duration,
              ease: "easeOut" as const,
              delay: delay,
              when: "beforeChildren" as const,
              staggerChildren: 0.12
            }
          },
          exit: { 
            opacity: 0, 
            y: 30,
            transition: {
              duration: duration * 0.8,
              ease: "easeOut" as const
            }
          }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { 
            opacity: 1,
            transition: {
              duration: duration,
              ease: "easeInOut" as const,
              delay: delay,
              when: "beforeChildren" as const,
              staggerChildren: 0.12
            }
          },
          exit: { 
            opacity: 0,
            transition: {
              duration: duration * 0.8,
              ease: "easeInOut" as const
            }
          }
        };
    }
  };

  return (
    <motion.div
      className={`will-change-transform ${className}`}
      variants={getVariants()}
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
  className = '',
  variant = 'fade',
  duration = 0.4,
  delay = 0
}) => {
  const getChildVariants = (): Variants => {
    switch (variant) {
      case 'slide':
        return {
          initial: { opacity: 0, x: 15 },
          animate: { 
            opacity: 1, 
            x: 0,
            transition: {
              duration: duration,
              ease: "easeOut" as const,
              delay: delay
            }
          }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.92, y: 10 },
          animate: { 
            opacity: 1, 
            scale: 1,
            y: 0,
            transition: {
              duration: duration * 1.2,
              ease: "easeOut" as const,
              delay: delay,
              type: "spring" as const,
              stiffness: 300,
              damping: 20,
              mass: 0.8
            }
          },
          whileHover: {
            y: -8,
            scale: 1.02,
            transition: {
              duration: 0.35,
              ease: "easeOut" as const
            }
          }
        };
      case 'slideUp':
        return {
          initial: { opacity: 0, y: 20 },
          animate: { 
            opacity: 1, 
            y: 0,
            transition: {
              duration: duration,
              ease: "easeOut" as const,
              delay: delay
            }
          }
        };
      case 'slideDown':
        return {
          initial: { opacity: 0, y: -20 },
          animate: { 
            opacity: 1, 
            y: 0,
            transition: {
              duration: duration,
              ease: "easeOut" as const,
              delay: delay
            }
          }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { 
            opacity: 1,
            transition: {
              duration: duration,
              ease: "easeInOut" as const,
              delay: delay
            }
          }
        };
    }
  };

  return (
    <motion.div
      className={`will-change-transform ${className}`}
      variants={getChildVariants()}
      whileHover={variant === 'scale' ? {
        y: -8,
        scale: 1.02,
        transition: {
          duration: 0.35,
          ease: "easeOut" as const
        }
      } : undefined}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition; 