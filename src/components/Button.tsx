import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends Omit<React.ComponentProps<typeof motion.button>, 'children'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'light' | 'dark';
  fullWidth?: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  fullWidth = false,
  isLoading = false,
  disabled,
  size = 'md',
  iconLeft,
  iconRight,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size];
  
  const baseClasses = `${sizeClasses} rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform relative overflow-hidden whitespace-nowrap`;
  
  const variantClasses = {
    primary: `bg-gradient-to-r from-kedai-red to-kedai-red/80 text-white shadow-md shadow-kedai-red/20 dark:shadow-kedai-red/30
      hover:from-kedai-red hover:to-kedai-red/90 hover:shadow-lg hover:shadow-kedai-red/30 dark:hover:shadow-kedai-red/40 focus:ring-kedai-red/30 dark:focus:ring-kedai-red/70`,
    
    secondary: `bg-white dark:bg-gray-800 border border-kedai-red/30 dark:border-kedai-red/40 text-kedai-red dark:text-kedai-red shadow-sm
      hover:bg-kedai-red/10 dark:hover:bg-gray-700 hover:text-kedai-red dark:hover:text-kedai-red hover:shadow-md hover:shadow-kedai-red/10 dark:hover:shadow-kedai-red/20 focus:ring-kedai-red/20 dark:focus:ring-kedai-red/40`,
    
    danger: `bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-300/50 dark:shadow-red-900/30
      hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-400/50 dark:hover:shadow-red-900/40 focus:ring-red-400 dark:focus:ring-red-800`,
    
    success: `bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-200/50 dark:shadow-green-900/30
      hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:shadow-green-300/50 dark:hover:shadow-green-900/40 focus:ring-green-300 dark:focus:ring-green-800`,
    
    light: `bg-white/90 dark:bg-gray-700/90 text-kedai-red dark:text-white border border-gray-200 dark:border-gray-600 shadow-sm
      hover:bg-white hover:shadow-md dark:hover:bg-gray-600 focus:ring-gray-200 dark:focus:ring-gray-700`,
    
    dark: `bg-kedai-black dark:bg-kedai-black text-white shadow-md shadow-kedai-black/30 dark:shadow-black/30
      hover:bg-kedai-black/90 dark:hover:bg-black hover:shadow-lg hover:shadow-kedai-black/30 dark:hover:shadow-black/40 focus:ring-kedai-black/50 dark:focus:ring-gray-800`,
  }[variant];
  
  const widthClass = fullWidth ? 'w-full' : '';
  const isDisabled = isLoading || disabled;
  const disabledClass = isDisabled ? 'opacity-70 cursor-not-allowed' : '';
  
  // Ripple effect animation
  const buttonAnimation = {
    tap: {
      scale: isDisabled ? 1 : 0.97,
      transition: { duration: 0.1 }
    },
    hover: {
      scale: isDisabled ? 1 : 1.03,
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <motion.button
      className={`${baseClasses} ${variantClasses} ${widthClass} ${disabledClass} ${className} will-change-transform`}
      disabled={isDisabled}
      whileHover={buttonAnimation.hover}
      whileTap={buttonAnimation.tap}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      aria-busy={isLoading}
      {...props}
    >
      {/* Button content with improved layout */}
      <span className="relative flex items-center justify-center gap-1 truncate">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <motion.svg 
              className="h-4 w-4 mr-1" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
              animate={{ rotate: 360 }}
              transition={{ 
                repeat: Infinity, 
                duration: 1,
                ease: "linear"
              }}
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </motion.svg>
            <span className="truncate">Loading</span>
          </div>
        ) : (
          <>
            {iconLeft && <span className="flex items-center flex-shrink-0">{iconLeft}</span>}
            <span className="truncate">{children}</span>
            {iconRight && <span className="flex items-center flex-shrink-0">{iconRight}</span>}
          </>
        )}
      </span>
      
      {/* Subtle hover effect overlay */}
      {!isDisabled && (
        <motion.span 
          className="absolute inset-0 bg-white rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  );
};

export default Button; 