import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Serve from root domain on Vercel / local, or allow override for GitHub Pages
  base: process.env.VITE_BASE_PATH || (process.env.GITHUB_PAGES ? '/Student_Portal/' : '/'),
  server: {
    host: true,      // expose on all network interfaces (LAN / mobile)
    port: 5173,
    strictPort: false,
  },
})
