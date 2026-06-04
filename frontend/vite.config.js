import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/user': 'http://localhost:5000',
      '/echo': 'http://localhost:5000',
      '/conversation': 'http://localhost:5000',
      '/message': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
    },
  },
})
