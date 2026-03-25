import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	// Configuración para Electron
	base: './', // Usa rutas relativas para que funcione en Electron
	build: {
		outDir: '../dist', // Construir en la raíz del proyecto
		emptyOutDir: true
	}
})
