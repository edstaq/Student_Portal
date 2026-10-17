import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Student_Portal/',
  server: {
    host: true,      // expose on all network interfaces (LAN / mobile)
    port: 5173,
    strictPort: false,
  },
})
