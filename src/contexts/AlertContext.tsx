import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import CustomAlert from '../components/CustomAlert';

type AlertType = 'info' | 'warning' | 'success';

interface AlertContextType {
  showAlert: (message: string, options?: {
    type?: AlertType;
    duration?: number;
    title?: string;
  }) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AlertType>('info');
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState<string | undefined>(undefined);

  const showAlert = (message: string, options?: {
    type?: AlertType;
    duration?: number;
    title?: string;
  }) => {
    setMessage(message);
    setType(options?.type || 'info');
    setDuration(options?.duration || 0);
    setTitle(options?.title);
    setIsOpen(true);
  };

  const hideAlert = () => {
    setIsOpen(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        isOpen={isOpen}
        onClose={hideAlert}
        message={message}
        type={type}
        duration={duration}
        title={title}
      />
    </AlertContext.Provider>
  );
};

export default AlertContext; 