import { useState, useCallback, useMemo } from 'react'

// Hook reutilizable para filtrado por fechas
export const useDateFilter = (options = {}) => {
    const {
        onValidationError = null, // Función para manejar errores de validación
        allowFutureDates = false  // Permitir fechas futuras
    } = options

    // Estados
    const [fechaDesde, setFechaDesde] = useState('')
    const [fechaHasta, setFechaHasta] = useState('')

    // Validar rango de fechas
    const validarFechas = useCallback(() => {
        const errores = []

        if (!fechaDesde && !fechaHasta) {
            return { valido: true, errores: [] }
        }

        const hoy = new Date().toISOString().split('T')[0]

        // Validar que fechaDesde no sea posterior a fechaHasta
        if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
            errores.push({
                tipo: 'error',
                titulo: 'Error de validación',
                mensaje: 'La fecha "Desde" no puede ser posterior a la fecha "Hasta".'
            })
        }

        // Validar fechas futuras si no están permitidas
        if (!allowFutureDates) {
            if (fechaDesde && fechaDesde > hoy) {
                errores.push({
                    tipo: 'warning',
                    titulo: 'Advertencia',
                    mensaje: 'La fecha "Desde" es una fecha futura. Los resultados pueden estar incompletos.'
                })
            }
            if (fechaHasta && fechaHasta > hoy) {
                errores.push({
                    tipo: 'warning',
                    titulo: 'Advertencia',
                    mensaje: 'La fecha "Hasta" es una fecha futura. Los resultados pueden estar incompletos.'
                })
            }
        }

        const valido = errores.filter(e => e.tipo === 'error').length === 0

        // Llamar callback de errores si existe
        if (!valido && onValidationError) {
            errores.forEach(error => onValidationError(error))
        }

        return { valido, errores }
    }, [fechaDesde, fechaHasta, allowFutureDates, onValidationError])

    // Convertir fecha string a Date object (inicio del día)
    const convertirFechaInicio = useCallback((fechaStr) => {
        if (!fechaStr) return null
        const partes = fechaStr.split('-')
        if (partes.length !== 3) return null
        return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 0, 0, 0, 0)
    }, [])

    // Convertir fecha string a Date object (final del día)
    const convertirFechaFin = useCallback((fechaStr) => {
        if (!fechaStr) return null
        const partes = fechaStr.split('-')
        if (partes.length !== 3) return null
        return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 23, 59, 59, 999)
    }, [])

    // Filtrar array de objetos por fecha
    const filtrarPorFecha = useCallback((items, fechaField = 'createdAt') => {
        if (!fechaDesde && !fechaHasta) return items

        const desde = convertirFechaInicio(fechaDesde)
        const hasta = convertirFechaFin(fechaHasta)

        return items.filter(item => {
            const fechaItem = new Date(item[fechaField])
            
            if (desde && hasta) {
                return fechaItem >= desde && fechaItem <= hasta
            } else if (desde) {
                return fechaItem >= desde
            } else if (hasta) {
                return fechaItem <= hasta
            }
            return true
        })
    }, [fechaDesde, fechaHasta, convertirFechaInicio, convertirFechaFin])

    // Preparar fechas para envío al backend
    const prepararFechasParaAPI = useCallback(() => {
        const { valido } = validarFechas()
        if (!valido) return null

        let fechaDesdeFinal = fechaDesde && fechaDesde !== '' ? fechaDesde : undefined
        let fechaHastaFinal = fechaHasta && fechaHasta !== '' ? fechaHasta : undefined
        
        // Convertir fechaHasta al final del día para la API
        if (fechaHastaFinal) {
            const partes = fechaHastaFinal.split('-')
            if (partes.length === 3) {
                const hasta = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]), 23, 59, 59, 999)
                fechaHastaFinal = hasta.toISOString()
            }
        }

        return {
            fechaDesde: fechaDesdeFinal,
            fechaHasta: fechaHastaFinal,
            valido: fechaDesdeFinal && fechaDesdeFinal.length === 10
        }
    }, [fechaDesde, fechaHasta, validarFechas])

    // Limpiar filtros
    const limpiarFiltros = useCallback(() => {
        setFechaDesde('')
        setFechaHasta('')
    }, [])

    // Generar texto descriptivo del rango
    const textoRango = useMemo(() => {
        if (fechaDesde && fechaHasta) {
            return `del ${fechaDesde} al ${fechaHasta}`
        } else if (fechaDesde) {
            return `desde ${fechaDesde}`
        } else if (fechaHasta) {
            return `hasta ${fechaHasta}`
        }
        return ''
    }, [fechaDesde, fechaHasta])

    // Verificar si hay filtros activos
    const hayFiltrosActivos = useMemo(() => {
        return fechaDesde !== '' || fechaHasta !== ''
    }, [fechaDesde, fechaHasta])

    return {
        // Estados
        fechaDesde,
        fechaHasta,
        setFechaDesde,
        setFechaHasta,
        
        // Funciones
        validarFechas,
        filtrarPorFecha,
        prepararFechasParaAPI,
        limpiarFiltros,
        
        // Valores computados
        textoRango,
        hayFiltrosActivos
    }
}