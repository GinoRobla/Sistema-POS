// ===== UTILIDADES GENERALES =====
// Funciones útiles que se usan en toda la aplicación

// 1. FORMATEAR DINERO EN PESOS ARGENTINOS
export const formatearDinero = (cantidad) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(cantidad)
}

// 2. VALIDAR CÓDIGOS DE BARRAS
export const validarCodigoBarras = (codigo) => {
    // Verificar que no esté vacío y que solo tenga números
    if (!codigo || typeof codigo !== 'string') {
        return false
    }
    
    // Limpiar espacios y verificar que tenga entre 8 y 13 dígitos
    const codigoLimpio = codigo.trim()
    return /^\d{8,13}$/.test(codigoLimpio)
}

// 3. FORMATEAR FECHA Y HORA 
export const formatearFechaHora = (fecha) => {
    const fechaObj = new Date(fecha)
    
    // Fecha en formato español
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES')
    
    // Hora sin segundos
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
