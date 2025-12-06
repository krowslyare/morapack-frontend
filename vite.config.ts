import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // Aumentar timeout para operaciones largas (algoritmo ALNS puede tardar 30-90 min)
        timeout: 5400000, // 90 minutos (igual que apiLongRunning en client.ts)
        proxyTimeout: 5400000,
      },
    },
  },
})
