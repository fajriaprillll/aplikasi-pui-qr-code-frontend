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
  rounded?: 'default' | 'full' | 'none';
  elevation?: 'flat' | 'raised' | 'floating';
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
  rounded = 'default',
  elevation = 'raised',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size];
  
  const roundedClasses = {
    default: 'rounded',
    full: 'rounded-full',
    none: 'rounded-none',
  }[rounded];
  
  const elevationClasses = {
    flat: '',
    raised: 'shadow-md hover:shadow-lg',
    floating: 'shadow-lg hover:shadow-xl',
  }[elevation];
  
  const baseClasses = `${sizeClasses} ${roundedClasses} ${elevationClasses} font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform relative overflow-hidden whitespace-nowrap`;
  
  const variantClasses = {
    primary: `bg-primary-500 text-white shadow-primary-200/50 dark:shadow-primary-900/30
      hover:bg-primary-600 hover:shadow-primary-300/50 dark:hover:shadow-primary-900/40 focus:ring-primary-300 dark:focus:ring-primary-700`,
    
    secondary: `bg-white dark:bg-gray-800 border border-primary-300 dark:border-primary-700 text-primary-500 dark:text-primary-400 shadow-sm
      hover:bg-primary-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-300 hover:shadow-primary-100/50 dark:hover:shadow-primary-900/20 focus:ring-primary-200 dark:focus:ring-primary-800`,
    
    danger: `bg-red-500 text-white shadow-red-300/50 dark:shadow-red-900/30
      hover:bg-red-600 hover:shadow-red-400/50 dark:hover:shadow-red-900/40 focus:ring-red-400 dark:focus:ring-red-800`,
    
    success: `bg-green-500 text-white shadow-green-200/50 dark:shadow-green-900/30
      hover:bg-green-600 hover:shadow-green-300/50 dark:hover:shadow-green-900/40 focus:ring-green-300 dark:focus:ring-green-800`,
    
    light: `bg-white/90 dark:bg-gray-700/90 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 shadow-sm
      hover:bg-white hover:shadow-md dark:hover:bg-gray-600 focus:ring-gray-200 dark:focus:ring-gray-700`,
    
    dark: `bg-gray-800 dark:bg-gray-900 text-white shadow-gray-300/30 dark:shadow-black/30
      hover:bg-gray-700 dark:hover:bg-black hover:shadow-gray-400/30 dark:hover:shadow-black/40 focus:ring-gray-500 dark:focus:ring-gray-800`,
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
      <span className="relative flex items-center justify-center gap-1.5 truncate">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <motion.svg 
              className="h-4 w-4 mr-1.5" 
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
            {iconLeft && (
              <motion.span 
                className="flex items-center flex-shrink-0"
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {iconLeft}
              </motion.span>
            )}
            <span className="truncate">{children}</span>
            {iconRight && (
              <motion.span 
                className="flex items-center flex-shrink-0"
                initial={{ x: 5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {iconRight}
              </motion.span>
            )}
          </>
        )}
      </span>
      
      {/* Subtle gradient overlay */}
      <span className="absolute inset-0 overflow-hidden rounded-inherit">
        <span className="absolute inset-0 bg-gradient-to-t from-black/5 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
      </span>
      
      {/* Ripple effect overlay */}
      {!isDisabled && (
        <motion.span 
          className="absolute inset-0 bg-white rounded-inherit pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.1 }}
          whileTap={{ 
            opacity: 0.15, 
            scale: 1.5, 
            transition: { duration: 0.5 } 
          }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Subtle shine effect */}
      {!isDisabled && variant !== 'light' && variant !== 'secondary' && (
        <motion.span 
          className="absolute inset-0 overflow-hidden rounded-inherit"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <span 
            className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </motion.span>
      )}
    </motion.button>
  );
};

export default Button; 