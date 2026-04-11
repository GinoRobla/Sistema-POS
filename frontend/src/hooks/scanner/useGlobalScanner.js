// Hook personalizado para manejo global de scanner sin autofocus
import { useState, useEffect, useRef, useCallback } from 'react'
import { normalizarCodigoBarras } from '../../utils/formatters'

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

    const emitirCodigoEscaneado = useCallback(() => {
        const scannedCode = normalizarCodigoBarras(bufferRef.current)
        bufferRef.current = ''
        setIsScanning(false)

        if (scannedCode.length >= minLength) {
            onScan(scannedCode)
        }
    }, [minLength, onScan])

    // Funcion para determinar si el scanner esta activo
    const isScannerActive = useCallback(() => {
        if (!enabled) return false

        // Si preventOnModal esta activado, verificar que no haya modales abiertos
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

    // Funcion para manejar las teclas presionadas
    const handleKeyPress = useCallback((event) => {
        if (!isScannerActive()) return

        const now = Date.now()
        const timeDiff = now - lastKeypressRef.current

        if (event.ctrlKey || event.altKey || event.metaKey) return

        if (['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock', 'Pause', 'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(event.key)) {
            return
        }

        lastKeypressRef.current = now

        if (timeDiff > timeout * 3) {
            bufferRef.current = ''
        }

        if (event.key === 'Enter') {
            if (bufferRef.current.length >= minLength) {
                event.preventDefault()
                event.stopPropagation()
                emitirCodigoEscaneado()
            }
            return
        }

        if (event.key === 'Escape') {
            bufferRef.current = ''
            setIsScanning(false)
            return
        }

        if (event.key.length === 1) {
            if (bufferRef.current.length > 0 || /[0-9]/.test(event.key)) {
                event.preventDefault()
                event.stopPropagation()
            }

            bufferRef.current += event.key
            setIsScanning(true)

            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }

            if (bufferRef.current.length >= 13) {
                timerRef.current = setTimeout(() => {
                    if (bufferRef.current.length >= minLength) {
                        emitirCodigoEscaneado()
                    } else {
                        bufferRef.current = ''
                        setIsScanning(false)
                    }
                }, timeout)
            } else {
                timerRef.current = setTimeout(() => {
                    if (bufferRef.current.length >= minLength) {
                        emitirCodigoEscaneado()
                    } else {
                        bufferRef.current = ''
                        setIsScanning(false)
                    }
                }, timeout * 10)
            }
        }
    }, [emitirCodigoEscaneado, isScannerActive, minLength, timeout])

    useEffect(() => {
        if (!enabled) return

        document.addEventListener('keydown', handleKeyPress, true)

        return () => {
            document.removeEventListener('keydown', handleKeyPress, true)
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [enabled, handleKeyPress])

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [])

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
