import { useState } from 'react'

// 1. HOOK PARA MANEJAR EL CARRITO DE VENTAS
// Este hook maneja todo lo relacionado con el carrito: agregar, quitar, calcular totales
export const useCart = (mostrarError) => {
    // 2. ESTADO DEL CARRITO (lista de productos seleccionados)
    const [carrito, setCarrito] = useState([])

    // 3. FUNCIÓN PARA AGREGAR UN PRODUCTO AL CARRITO
    const agregarProducto = (producto) => {
        setCarrito(carritoAnterior => {
            // Buscar si el producto ya está en el carrito
            const productoExistente = carritoAnterior.find(item => item.id === producto.id)
            
            if (productoExistente) {
                // Si ya existe, verificar stock antes de incrementar cantidad
                if (productoExistente.quantity < producto.stock) {
                    return carritoAnterior.map(item =>
                        item.id === producto.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    )
                } else {
                    mostrarError?.(`No hay más stock para ${producto.name}`)
                    return carritoAnterior
                }
            } else {
                // Si no existe, verificar que tenga stock disponible
                if (producto.stock > 0) {
                    return [...carritoAnterior, {
                        id: Date.now() + Math.random(),
                        ...producto,
                        quantity: 1
                    }]
                } else {
                    mostrarError?.(`${producto.name} está sin stock`)
                    return carritoAnterior
                }
            }
        })
    }

    // 4. FUNCIÓN PARA CAMBIAR LA CANTIDAD DE UN PRODUCTO
    const cambiarCantidad = (idProducto, nuevaCantidad) => {
        // Si la cantidad es 0 o menor, eliminar el producto
        if (nuevaCantidad <= 0) {
            quitarProducto(idProducto)
            return
        }

        setCarrito(carritoAnterior =>
            carritoAnterior.map(item => {
                if (item.id === idProducto) {
                    const cantidadMaxima = item.stock
                    const cantidadValida = Math.min(nuevaCantidad, cantidadMaxima)
                    
                    // Mostrar error si intenta agregar más del stock disponible
                    if (nuevaCantidad > cantidadMaxima) {
                        mostrarError?.(`Máximo disponible: ${cantidadMaxima}`)
                    }
                    
                    return { ...item, quantity: cantidadValida }
                }
                return item
            })
        )
    }

    // 5. FUNCIÓN PARA QUITAR UN PRODUCTO DEL CARRITO
    const quitarProducto = (idProducto) => {
        setCarrito(carritoAnterior => 
            carritoAnterior.filter(item => item.id !== idProducto)
        )
    }

    // 6. FUNCIÓN PARA VACIAR TODO EL CARRITO
    const vaciarCarrito = () => {
        setCarrito([])
    }

    // 7. CALCULAR EL TOTAL A PAGAR
    const total = carrito.reduce((suma, item) => suma + (item.price * item.quantity), 0)

    // 8. CALCULAR TOTAL DE PRODUCTOS EN EL CARRITO
    const totalProductos = carrito.reduce((suma, item) => suma + item.quantity, 0)

    // 9. DEVOLVER TODAS LAS FUNCIONES Y DATOS DEL CARRITO
    return {
        carrito,           // Lista de productos en el carrito
        agregarProducto,   // Función para agregar productos
        cambiarCantidad,   // Función para cambiar cantidades
        quitarProducto,    // Función para quitar productos
        vaciarCarrito,     // Función para vaciar el carrito
        total,             // Total a pagar
        totalProductos     // Cantidad total de productos
    }
}
