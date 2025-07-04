import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import Button from './Button';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPrint, FaDownload, FaQrcode, FaLink, FaCopy } from 'react-icons/fa';

interface QRCodeGeneratorProps {
  tableId: number;
  tableName: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ tableId, tableName }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // Get the current base URL (without any path)
      const url = new URL(window.location.href);
      // We want the base URL - protocol + hostname + port (if any)
      const base = `${url.protocol}//${url.host}`;
      setBaseUrl(base);
    } catch (err) {
      setError('Error generating QR code URL');
      console.error('Error setting base URL:', err);
    }
  }, []);

  const qrCodeUrl = `${baseUrl}/order?table=${tableId}`;
  
  const handlePrint = () => {
    setIsLoading(true);
    setError(null);
    setShowSuccess(null);
    
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setError('Could not open print window. Please check your popup blocker settings.');
        setIsLoading(false);
        return;
      }
      
      const svg = document.getElementById('qr-code')?.getElementsByTagName('svg')[0];
      if (!svg) {
        setError('Could not find QR code to print');
        setIsLoading(false);
        return;
      }
      
      const svgData = svg.outerHTML;
      const encodedSvg = encodeURIComponent(svgData);
      
      const html = `
        <html>
          <head>
            <title>QR Code for Table ${tableName}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                padding: 20px;
                color: #333;
                background-color: #f5f5f5;
              }
              .container {
                max-width: 400px;
                margin: 0 auto;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                background-color: white;
              }
              h2 {
                margin-bottom: 20px;
                color: #ef4444;
                font-size: 28px;
                font-weight: 700;
              }
              .qr-code {
                margin: 25px 0;
                padding: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.03);
                display: inline-block;
              }
              p {
                margin-top: 20px;
                color: #666;
                font-size: 16px;
              }
              .logo {
                margin-bottom: 20px;
                font-weight: bold;
                color: #ef4444;
                font-size: 20px;
              }
              .instructions {
                font-size: 18px;
                margin-top: 25px;
                padding: 15px;
                background-color: #f9fafb;
                border-radius: 12px;
                font-weight: 500;
              }
              @media print {
                .container {
                  box-shadow: none;
                  border: none;
                }
                body {
                  background-color: white;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo" style="display: flex; align-items: center; gap: 10px; justify-content: center;">
                <img src="/images/logo/download.jpg" alt="Kedai Matmoen Logo" style="height: 40px; width: auto; border-radius: 4px;" />
                <span style="color: #ef4444; font-weight: bold;">Kedai Matmoen</span>
              </div>
              <h2>Table ${tableName}</h2>
              <div class="qr-code">
                <img src="data:image/svg+xml;charset=utf-8,${encodedSvg}" width="250" height="250" />
              </div>
              <p class="instructions">Scan to order food</p>
              <p>${qrCodeUrl}</p>
            </div>
          </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        setIsLoading(false);
        setShowSuccess('QR code sent to printer!');
        setTimeout(() => setShowSuccess(null), 3000);
      }, 500);
    } catch (err) {
      setError('Error printing QR code');
      console.error('Error during print:', err);
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    setIsLoading(true);
    setError(null);
    setShowSuccess(null);
    
    try {
      const canvas = document.createElement('canvas');
      const svg = document.getElementById('qr-code')?.querySelector('svg');
      if (!svg) {
        setError('Could not find QR code to download');
        setIsLoading(false);
        return;
      }
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create a larger canvas with more padding for better appearance
          canvas.width = img.width + 80; 
          canvas.height = img.height + 120;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setError('Could not create canvas context');
            setIsLoading(false);
            return;
          }
          
          // Create a white background with padding
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add a subtle border
          ctx.strokeStyle = '#f0f0f0';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
          
          // Draw the QR code in the center
          ctx.drawImage(img, 40, 30);
          
          // Add restaurant name
          ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#ef4444';
          ctx.textAlign = 'center';
          ctx.fillText('Kedai Matmoen', canvas.width / 2, 25);
          
          // Add table info
          ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#333333';
          ctx.textAlign = 'center';
          ctx.fillText(`Table ${tableName}`, canvas.width / 2, canvas.height - 50);
          
          // Add scan instruction
          ctx.font = '16px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#666666';
          ctx.fillText('Scan to order food', canvas.width / 2, canvas.height - 25);
          
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `qr-table-${tableId}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setIsLoading(false);
          setShowSuccess('QR code downloaded successfully!');
          setTimeout(() => setShowSuccess(null), 3000);
        } catch (err) {
          setError('Error generating download');
          console.error('Error in canvas operations:', err);
          setIsLoading(false);
        }
      };
      
      img.onerror = () => {
        setError('Error loading QR code image');
        setIsLoading(false);
      };
      
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
    } catch (err) {
      setError('Error downloading QR code');
      console.error('Error during download:', err);
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(qrCodeUrl);
      setShowSuccess('URL copied to clipboard!');
      setTimeout(() => setShowSuccess(null), 3000);
    } catch (err) {
      setError('Failed to copy URL');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring" as const,
        stiffness: 300,
        damping: 24
      }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95
    }
  };

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700 w-full max-w-md mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
        <motion.div
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full"
        >
          <FaQrcode className="text-red-500 dark:text-red-400 text-xl" />
        </motion.div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">QR Code for Table {tableName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Scan to order food</p>
        </div>
      </motion.div>
      
      <motion.div 
        className="flex justify-center my-6 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner" 
        id="qr-code"
        variants={itemVariants}
        whileHover={{ scale: 1.02, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div 
              key="error"
              className="text-red-500 dark:text-red-400 text-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p>Error: {error}</p>
              <motion.button 
                onClick={() => setError(null)} 
                className="mt-2 text-sm underline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="qrcode"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <QRCode 
                value={qrCodeUrl} 
                size={250} 
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="H"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <motion.div variants={itemVariants} className="text-center mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaLink size={14} className="text-gray-500 dark:text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">URL for this table:</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate hover:text-clip bg-white dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
          {qrCodeUrl}
        </p>
        <motion.button
          onClick={copyToClipboard}
          className="text-xs text-primary-500 dark:text-primary-400 flex items-center gap-1 mx-auto mt-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaCopy size={12} /> Copy URL
        </motion.button>
      </motion.div>
      
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-2 rounded-lg mb-4 text-center text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {showSuccess}
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        className="flex flex-col sm:flex-row gap-3 justify-center"
        variants={itemVariants}
      >
        <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants} className="flex-1">
          <Button
            variant="primary"
            onClick={handlePrint}
            isLoading={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-base"
            iconLeft={<FaPrint />}
          >
            Print
          </Button>
        </motion.div>
        
        <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants} className="flex-1">
          <Button
            variant="secondary"
            onClick={handleDownload}
            isLoading={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-base"
            iconLeft={<FaDownload />}
          >
            Download
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default QRCodeGenerator; 