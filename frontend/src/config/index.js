// Configuración centralizada de la aplicación

export const config = {
    api: {
        // Usa la variable de entorno VITE_API_URL o por defecto http://localhost:3001
        baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001'
    },
    app: {
        name: import.meta.env.VITE_APP_NAME || 'Sistema ventas',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0'
    },
    dev: {
        mode: import.meta.env.VITE_DEV_MODE === 'true' || false
    }
}

// Helper para logs en desarrollo
export const devLog = (...args) => {
    if (config.dev.mode) {
        console.log('[DEV]', ...args)
    }
}