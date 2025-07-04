import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow all hosts including local network access
    host: '0.0.0.0',
    // Allow specific ngrok host as well as any other potential ngrok hosts
    cors: true,
    hmr: {
      // Enable HMR for all connections
      clientPort: 443
    },
    // Add this to allow any host
    allowedHosts: true,
    // Open browser automatically
    open: true,
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
