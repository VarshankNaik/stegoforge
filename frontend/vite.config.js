import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Proxy API calls to FastAPI backend
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      // Proxy WebSocket connections
      '/ws': {
        target: 'ws://backend:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
