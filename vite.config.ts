
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // "base: './'" es el truco clave.
  // Permite que la app funcione si la abres desde un dominio (web) 
  // O si la abres desde un archivo local (electron .exe)
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
