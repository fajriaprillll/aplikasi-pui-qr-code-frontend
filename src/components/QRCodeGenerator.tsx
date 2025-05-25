import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import Button from './Button';
import { motion } from 'framer-motion';
import { FaPrint, FaDownload, FaQrcode } from 'react-icons/fa';

interface QRCodeGeneratorProps {
  tableId: number;
  tableName: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ tableId, tableName }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
              }
              .container {
                max-width: 400px;
                margin: 0 auto;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              }
              h2 {
                margin-bottom: 20px;
                color: #ef4444;
                font-size: 24px;
              }
              .qr-code {
                margin: 20px 0;
                padding: 15px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                display: inline-block;
              }
              p {
                margin-top: 20px;
                color: #666;
                font-size: 14px;
              }
              .logo {
                margin-bottom: 15px;
                font-weight: bold;
                color: #ef4444;
                font-size: 18px;
              }
              .instructions {
                font-size: 16px;
                margin-top: 25px;
                padding: 10px;
                background-color: #f9fafb;
                border-radius: 8px;
              }
              @media print {
                .container {
                  box-shadow: none;
                  border: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">QR Food Order</div>
              <h2>Table ${tableName}</h2>
              <div class="qr-code">
                <img src="data:image/svg+xml;charset=utf-8,${encodedSvg}" width="200" height="200" />
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
          canvas.width = img.width + 40; // Add padding
          canvas.height = img.height + 40;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setError('Could not create canvas context');
            setIsLoading(false);
            return;
          }
          
          // Create a white background with padding
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the QR code in the center
          ctx.drawImage(img, 20, 20);
          
          // Add table info
          ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#ef4444';
          ctx.textAlign = 'center';
          ctx.fillText(`Table ${tableName}`, canvas.width / 2, canvas.height - 10);
          
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `qr-table-${tableId}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setIsLoading(false);
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

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <FaQrcode className="text-red-500 dark:text-red-400 text-xl" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">QR Code for Table {tableName}</h3>
      </div>
      
      <motion.div 
        className="flex justify-center my-6 bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner" 
        id="qr-code"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {error ? (
          <div className="text-red-500 dark:text-red-400 text-center p-4">
            <p>Error: {error}</p>
            <button 
              onClick={() => setError(null)} 
              className="mt-2 text-sm underline"
            >
              Try Again
            </button>
          </div>
        ) : (
          <QRCode 
            value={qrCodeUrl} 
            size={200} 
            bgColor="#FFFFFF"
            fgColor="#000000"
            level="H"
          />
        )}
      </motion.div>
      
      <motion.p 
        className="text-sm text-center mb-6 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded-md overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {qrCodeUrl}
      </motion.p>
      
      <div className="flex gap-3">
        <Button
          variant="primary"
          className="flex-1"
          onClick={handlePrint}
          isLoading={isLoading}
          iconLeft={<FaPrint />}
        >
          Print
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={handleDownload}
          isLoading={isLoading}
          iconLeft={<FaDownload />}
        >
          Download
        </Button>
      </div>
      
      {error && (
        <motion.div 
          className="mt-4 text-sm text-red-500 dark:text-red-400 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};

export default QRCodeGenerator; 