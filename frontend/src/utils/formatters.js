// ===== UTILIDADES GENERALES =====
// Funciones utiles que se usan en toda la aplicacion

// 1. FORMATEAR DINERO EN PESOS ARGENTINOS
export const formatearDinero = (cantidad) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(cantidad)
}

// 2. NORMALIZAR Y VALIDAR CODIGOS DE BARRAS
export const normalizarCodigoBarras = (codigo) => {
    if (codigo == null) {
        return ''
    }

    const codigoLimpio = String(codigo).trim().replace(/\s+/g, '')

    if (!/^\d+$/.test(codigoLimpio)) {
        return codigoLimpio
    }

    return codigoLimpio.slice(0, 13)
}

export const validarCodigoBarras = (codigo) => {
    if (!codigo || typeof codigo !== 'string') {
        return false
    }

    const codigoLimpio = normalizarCodigoBarras(codigo)
    return /^\d{8,13}$/.test(codigoLimpio)
}

// 3. FORMATEAR FECHA Y HORA
export const formatearFechaHora = (fecha) => {
    const fechaObj = new Date(fecha)

    const fechaFormateada = fechaObj.toLocaleDateString('es-ES')
    const horaFormateada = fechaObj.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    })

    return `${fechaFormateada} - ${horaFormateada}`
}

// 4. CONTAR PRODUCTOS TOTALES EN UNA LISTA
export const contarProductos = (productos) => {
    return productos.reduce((total, producto) => {
        return total + producto.quantity
    }, 0)
}
