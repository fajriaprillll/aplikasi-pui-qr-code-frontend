import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { testAPI, quickTest } from './utils/apiTest.ts'

// Check API connectivity on startup
console.log('Frontend app starting...');

// Try to access .env variables
console.log('Environment:', import.meta.env.MODE);
console.log('Running on URL:', window.location.href);
console.log('API URL env var:', import.meta.env.VITE_API_URL || 'not set');

// Set initial connection status
let isConnected = false;

// Expose the test API utility for debugging
if (typeof window !== 'undefined') {
  (window as any).testAPI = testAPI;
  (window as any).quickTest = quickTest;
  console.log('API testing utilities available. Run "testAPI()" or "quickTest()" in console.');
  
  // Test connection immediately
  quickTest().then(connected => {
    isConnected = connected;
    if (connected) {
      console.log('✅ Backend is connected and ready!');
    } else {
      console.warn('⚠️ Could not connect to backend. Use testAPI() to troubleshoot.');
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
