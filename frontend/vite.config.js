import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,  // Port number for the development server
    host: true,  // Allow access from other devices on the network
    open: true    // Automatically open browser when server starts
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios']
  }
})