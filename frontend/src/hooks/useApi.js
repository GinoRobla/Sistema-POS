// ===== HOOK PARA MANEJAR LLAMADAS AL BACKEND =====
// Hook simple para manejar carga, errores y peticiones

import { useState, useCallback } from 'react'

export const useApi = () => {
    // 1. ESTADOS SIMPLES
    const [cargando, setCargando] = useState(false)    // Si está cargando
    const [error, setError] = useState('')             // Mensaje de error
    const [datos, setDatos] = useState(null)           // Datos de la respuesta

    // 2. FUNCIÓN PARA EJECUTAR CUALQUIER PETICIÓN
    const ejecutarPeticion = useCallback(async (funcionApi) => {
        setCargando(true)
        setError('')
        
        try {
            const resultado = await funcionApi()
            setDatos(resultado)
            setCargando(false)
            return resultado
        } catch (err) {
            setError(err.message || 'Error al conectar con el servidor')
            setCargando(false)
            throw err
        }
    }, [])

    // 3. FUNCIÓN PARA LIMPIAR ERRORES
    const limpiarError = useCallback(() => setError(''), [])

    // 4. DEVOLVER TODO LO QUE NECESITA EL COMPONENTE
    return {
        datos,
        cargando,
        error,
        ejecutarPeticion,
        limpiarError
    }
}
