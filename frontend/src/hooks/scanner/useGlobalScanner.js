// Hook personalizado para manejo global de scanner sin autofocus
import { useState, useEffect, useRef, useCallback } from 'react'

export const useGlobalScanner = (onScan, options = {}) => {
    const {
        minLength = 8,
        timeout = 100,
        enabled = true,
        preventOnModal = true
    } = options

    const [isScanning, setIsScanning] = useState(false)
    const bufferRef = useRef('')
    const timerRef = useRef(null)
    const lastKeypressRef = useRef(0)

    // Función para determinar si el scanner está activo
    const isScannerActive = useCallback(() => {
        if (!enabled) return false
        
        // Si preventOnModal está activado, verificar que no haya modales abiertos
        if (preventOnModal) {
            const modals = document.querySelectorAll('.modal-overlay')
            if (modals.length > 0) return false
        }
        
        // Verificar que no hay inputs o textareas enfocados (excepto inputs de solo lectura)
        const activeElement = document.activeElement
        if (activeElement && 
            (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') &&
            !activeElement.readOnly &&
            activeElement.type !== 'button' &&
            activeElement.type !== 'submit') {
            return false
        }
        
        return true
    }, [enabled, preventOnModal])

    // Función para manejar las teclas presionadas
    const handleKeyPress = useCallback((event) => {
        if (!isScannerActive()) return

        const now = Date.now()
        const timeDiff = now - lastKeypressRef.current

        // Si es una tecla de control, ignorar
        if (event.ctrlKey || event.altKey || event.metaKey) return
        
        // Si es una tecla especial que no queremos capturar
        if (['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock', 'Pause', 'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(event.key)) {
            return
        }

        lastKeypressRef.current = now

        // Si la diferencia de tiempo es muy grande, reiniciar el buffer
        if (timeDiff > timeout * 3) {
            bufferRef.current = ''
        }

        // Si es Enter y tenemos contenido en el buffer
        if (event.key === 'Enter') {
            if (bufferRef.current.length >= minLength) {
                // Prevenir el comportamiento por defecto del Enter
                event.preventDefault()
                event.stopPropagation()
                
                const scannedCode = bufferRef.current
                bufferRef.current = ''
                setIsScanning(false)
                
                // Llamar la función callback con el código escaneado
                onScan(scannedCode)
            }
            return
        }

        // Si es Escape, limpiar el buffer
        if (event.key === 'Escape') {
            bufferRef.current = ''
            setIsScanning(false)
            return
        }

        // Solo agregar caracteres imprimibles al buffer
        if (event.key.length === 1) {
            // Prevenir el comportamiento por defecto solo si estamos construyendo un código
            if (bufferRef.current.length > 0 || /[0-9]/.test(event.key)) {
                event.preventDefault()
                event.stopPropagation()
            }
            
            bufferRef.current += event.key
            setIsScanning(true)

            // Reiniciar el timer
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }

            // Si el buffer alcanza una longitud considerable, auto-procesar
            if (bufferRef.current.length >= 13) {
                timerRef.current = setTimeout(() => {
                    if (bufferRef.current.length >= minLength) {
                        const scannedCode = bufferRef.current
                        bufferRef.current = ''
                        setIsScanning(false)
                        onScan(scannedCode)
                    } else {
                        bufferRef.current = ''
                        setIsScanning(false)
                    }
                }, timeout)
            } else {
                // Timer para limpiar el buffer si no se completa el escaneo
                timerRef.current = setTimeout(() => {
                    bufferRef.current = ''
                    setIsScanning(false)
                }, timeout * 10)
            }
        }
    }, [isScannerActive, onScan, minLength, timeout])

    // Efecto para agregar/remover el listener de teclas
    useEffect(() => {
        if (!enabled) return

        // Agregar el listener a nivel documento con capture para interceptar antes
        document.addEventListener('keydown', handleKeyPress, true)

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyPress, true)
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [enabled, handleKeyPress])

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [])

    // Función para limpiar manualmente el buffer
    const clearBuffer = useCallback(() => {
        bufferRef.current = ''
        setIsScanning(false)
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }, [])

    return {
        isScanning,
        currentBuffer: bufferRef.current,
        clearBuffer
    }
}