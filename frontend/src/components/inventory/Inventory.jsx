// ===== COMPONENTE INVENTARIO  =====
// Este componente muestra una lista de productos con funciones básicas:
// - Ver todos los productos en tarjetas
// - Buscar productos por nombre
// - Agregar nuevos productos
// - Editar productos existentes
// - Eliminar productos

import React, { useState, useEffect, useRef } from 'react'
import { obtenerProductos, actualizarProducto, eliminarProducto, crearProducto, formatearDinero, validarCodigoBarras } from '../../utils'
import { useApi } from '../../hooks/useApi'
import { useGlobalScanner } from '../../hooks/scanner'
import './Inventory.css'

export const Inventory = () => {
    // HOOK API
    const { cargando, ejecutarPeticion } = useApi()

    // ESTADOS PRINCIPALES DEL COMPONENTE
    const [productos, setProductos] = useState([]) // Lista completa de productos
    const [textoBusqueda, setTextoBusqueda] = useState('') // Texto del buscador
    const [mostrarFormulario, setMostrarFormulario] = useState(false) // Si mostramos el formulario
    const [editando, setEditando] = useState(null) // Producto que estamos editando (null = nuevo producto)
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false) // Modal de confirmación para eliminar
    const [productoAEliminar, setProductoAEliminar] = useState(null) // Producto que se va a eliminar
    const [paginaActual, setPaginaActual] = useState(1) // Página actual para la paginación
    const productosPorPagina = 12 // Cuántos productos mostrar por página

    // ESTADO PARA EL MODAL DE ERRORES
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' // 'info', 'error', 'success', 'warning'
    })

    // REFERENCIA PARA EL CAMPO DE BÚSQUEDA (para auto-focus)
    const campoBusquedaRef = useRef(null)
    const esBorradoAutomatico = useRef(false) // Para distinguir entre borrado automático y manual

    // ESTADO PARA MANTENER EL FILTRO ACTIVO (separado del campo de texto)
    const [filtroActivo, setFiltroActivo] = useState('') // Este mantiene el filtro aunque se borre el campo

    // Estado del formulario - aquí guardamos lo que escribe el usuario
    const [nuevoProducto, setNuevoProducto] = useState({
        name: '',
        price: '',
        stock: '',
        barcode: '',
        image: ''
    })

    // CARGAR PRODUCTOS CUANDO SE ABRE EL COMPONENTE
    useEffect(() => {
        const cargarProductos = async () => {
            try {
                await ejecutarPeticion(async () => {
                    const data = await obtenerProductos()
                    setProductos(data)
                })
            } catch {
                mostrarModal(
                    'Error al cargar productos',
                    'No se pudieron cargar los productos. Por favor, verifica tu conexión e intenta nuevamente.',
                    'error'
                )
            }
        }
        cargarProductos()
    }, [ejecutarPeticion])

    // Ya no necesitamos auto-focus, usamos el scanner global

    // SCANNER GLOBAL PARA DETECCIÓN AUTOMÁTICA
    const manejarCodigoEscaneado = (codigo) => {
        console.log('Código escaneado en inventario:', codigo)
        // Aplicar filtro inmediatamente cuando se escanea
        setFiltroActivo(codigo)
        // Limpiar el campo de búsqueda manual
        setTextoBusqueda('')
    }
    
    const { isScanning } = useGlobalScanner(manejarCodigoEscaneado, {
        minLength: 8,
        timeout: 100,
        enabled: !mostrarFormulario && !mostrarConfirmacion, // Solo activo cuando no hay modales
        preventOnModal: true
    })

    // AUTO-CLEAR PARA CÓDIGOS DE BARRAS DEL CAMPO MANUAL
    // Detecta códigos escaneados en el campo manual
    useEffect(() => {
        // Si es un código de barras (8+ dígitos numéricos), aplicar filtro y programar auto-borrado
        if (textoBusqueda.length >= 8 && /^[0-9]+$/.test(textoBusqueda)) {
            // APLICAR EL FILTRO INMEDIATAMENTE
            setFiltroActivo(textoBusqueda)

            // LUEGO BORRAR EL CAMPO (pero mantener el filtro)
            const timer = setTimeout(() => {
                esBorradoAutomatico.current = true // Marcar que es borrado automático
                setTextoBusqueda('')
                // Resetear la bandera después de un momento
                setTimeout(() => {
                    esBorradoAutomatico.current = false
                }, 100)
            }, 100) // Se borra después de 0.1 segundos

            return () => clearTimeout(timer)
        }
        // Si no es un código de barras, actualizar filtro inmediatamente
        else if (textoBusqueda !== '') {
            setFiltroActivo(textoBusqueda)
        }
    }, [textoBusqueda])

    // FUNCIÓN PARA MANEJAR CAMBIOS EN EL CAMPO DE BÚSQUEDA
    // Detecta cuando el usuario escribe manualmente
    const manejarCambioBusqueda = (e) => {
        const nuevoTexto = e.target.value
        setTextoBusqueda(nuevoTexto)

        // Solo limpiar filtro si NO es un borrado automático
        if (nuevoTexto === '' && !esBorradoAutomatico.current) {
            setFiltroActivo('')
        }
    }

    // FUNCIÓN PARA MANEJAR PRESIONES DE TECLA
    // Maneja Enter para buscar manualmente si es necesario
    const manejarTeclaPresionada = (e) => {
        if (e.key === 'Enter') {
            // Si hay texto en el campo, aplicar filtro inmediatamente
            if (textoBusqueda.trim()) {
                setFiltroActivo(textoBusqueda)
            }
        }
    }

    // RESETEAR PÁGINA CUANDO CAMBIA EL FILTRO ACTIVO
    // Cuando cambia el filtro activo (no el campo de texto), volvemos a la primera página
    useEffect(() => {
        setPaginaActual(1)
    }, [filtroActivo])

    // FILTRAR PRODUCTOS SEGÚN EL FILTRO ACTIVO (no el campo de texto)
    // Usa el filtro que se mantiene aunque se borre el campo
    const productosFiltrados = productos.filter(producto => {
        // Si no hay filtro activo, mostrar todos
        if (!filtroActivo.trim()) return true

        // Filtrar según el filtro activo guardado
        return producto.name.toLowerCase().includes(filtroActivo.toLowerCase()) ||
            producto.barcode?.includes(filtroActivo)
    })

    // LÓGICA DE PAGINACIÓN
    // Calculamos qué productos mostrar en la página actual
    const indiceInicio = (paginaActual - 1) * productosPorPagina
    const indiceFin = indiceInicio + productosPorPagina
    const productosEnPagina = productosFiltrados.slice(indiceInicio, indiceFin)
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina)

    // FUNCIÓN PARA CAMBIAR DE PÁGINA
    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina)
        }
    }

    // FUNCIONES PARA EL MODAL DE ERRORES
    const mostrarModal = (title, message, type = 'info') => {
        setModal({
            isOpen: true,
            title,
            message,
            type
        })
    }

    const cerrarModal = () => {
        setModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info'
        })
    }

    // FUNCIÓN PARA MANEJAR CAMBIOS EN EL FORMULARIO
    // Cuando el usuario escribe en cualquier campo del formulario
    const manejarCambio = (e) => {
        const { name, value } = e.target
        setNuevoProducto(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // FUNCIÓN PARA GUARDAR UN PRODUCTO (NUEVO O EDITADO)
    const guardarProducto = async (e) => {
        e.preventDefault()

        // Validaciones básicas
        if (!nuevoProducto.name.trim()) {
            mostrarModal(
                'Error de validación',
                'El nombre del producto es obligatorio.',
                'error'
            )
            return
        }

        if (!nuevoProducto.price || parseFloat(nuevoProducto.price) <= 0) {
            mostrarModal(
                'Error de validación',
                'El precio debe ser un número mayor a 0.',
                'error'
            )
            return
        }

        if (!nuevoProducto.stock || parseInt(nuevoProducto.stock) < 0) {
            mostrarModal(
                'Error de validación',
                'El stock debe ser un número igual o mayor a 0.',
                'error'
            )
            return
        }

        // Validar código de barras si se proporciona
        if (nuevoProducto.barcode && !validarCodigoBarras(nuevoProducto.barcode)) {
            mostrarModal(
                'Error de validación',
                'El código de barras ingresado no es válido. Por favor, verifica que tenga el formato correcto.',
                'error'
            )
            return
        }

        await ejecutarPeticion(async () => {
            const datosProducto = {
                ...nuevoProducto,
                price: parseFloat(nuevoProducto.price),
                stock: parseInt(nuevoProducto.stock)
            }

            try {
                if (editando) {
                    await actualizarProducto(editando.id, datosProducto)
                    mostrarModal(
                        'Producto actualizado',
                        `El producto "${datosProducto.name}" se ha actualizado correctamente.`,
                        'success'
                    )
                } else {
                    await crearProducto(datosProducto)
                    mostrarModal(
                        'Producto creado',
                        `El producto "${datosProducto.name}" se ha creado correctamente.`,
                        'success'
                    )
                }

                cerrarFormulario()
                const productosActualizados = await obtenerProductos()
                setProductos(productosActualizados)
            } catch {
                mostrarModal(
                    'Error al guardar producto',
                    editando ? 
                        'No se pudo actualizar el producto. Por favor, intenta nuevamente.' :
                        'No se pudo crear el producto. Por favor, intenta nuevamente.',
                    'error'
                )
            }
        })
    }

    // FUNCIÓN PARA ABRIR EL FORMULARIO EN MODO EDICIÓN
    const editarProducto = (producto) => {
        setEditando(producto)
        setNuevoProducto({
            name: producto.name,
            price: producto.price.toString(),
            stock: producto.stock.toString(),
            barcode: producto.barcode || '',
            image: producto.image || ''
        })
        setMostrarFormulario(true)
    }

    // FUNCIÓN PARA ELIMINAR UN PRODUCTO
    const eliminarProductoHandler = async (id) => {
        // En lugar de usar alert, abrimos el modal de confirmación
        const producto = productos.find(p => p.id === id)
        setProductoAEliminar(producto)
        setMostrarConfirmacion(true)
    }

    // FUNCIÓN PARA CONFIRMAR LA ELIMINACIÓN
    const confirmarEliminacion = async () => {
        await ejecutarPeticion(async () => {
            try {
                await eliminarProducto(productoAEliminar.id)
                const productosActualizados = await obtenerProductos()
                setProductos(productosActualizados)
                setMostrarConfirmacion(false)
                
                mostrarModal(
                    'Producto eliminado',
                    `El producto "${productoAEliminar.name}" se ha eliminado correctamente.`,
                    'success'
                )
                
                setProductoAEliminar(null)
            } catch {
                mostrarModal(
                    'Error al eliminar producto',
                    'No se pudo eliminar el producto. Por favor, intenta nuevamente.',
                    'error'
                )
                setMostrarConfirmacion(false)
                setProductoAEliminar(null)
            }
        })
    }

    // FUNCIÓN PARA CANCELAR LA ELIMINACIÓN
    const cancelarEliminacion = () => {
        setMostrarConfirmacion(false)
        setProductoAEliminar(null)
    }

    // FUNCIÓN PARA CERRAR EL FORMULARIO Y LIMPIAR TODO
    const cerrarFormulario = () => {
        setMostrarFormulario(false)
        setEditando(null)
        setNuevoProducto({
            name: '',
            price: '',
            stock: '',
            barcode: '',
            image: ''
        })
    }

    // AQUÍ RENDERIZAMOS TODO LO QUE VE EL USUARIO
    return (
        <div className="inventory">
            {/* TÍTULO DE LA PÁGINA */}
            <div className="inventory-header">
                <h2>Inventario de Productos</h2>
                <p>Gestiona todos los productos de tu tienda</p>
            </div>
            <div className="header-separator"></div>

            {/* BUSCADOR Y BOTÓN PARA AGREGAR */}
            <div className="search-section">

                <input
                    ref={campoBusquedaRef}
                    type="text"
                    placeholder="Buscar productos o escanear código..."
                    value={textoBusqueda}
                    onChange={manejarCambioBusqueda}
                    onKeyDown={manejarTeclaPresionada}
                    className="barcode-input"
                />

                <button
                    className="btn-nuevo"
                    onClick={() => setMostrarFormulario(true)}
                    disabled={cargando}
                >
                    {cargando ? 'Cargando...' : 'Nuevo Producto'}
                </button>
                
                {/* Botón para limpiar filtros */}
                {filtroActivo && (
                    <button
                        className="btn-clear-filter"
                        onClick={() => {
                            setFiltroActivo('')
                            setTextoBusqueda('')
                        }}
                        style={{
                            padding: '12px 20px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Limpiar Filtro
                    </button>
                )}
            </div>

            {/* INDICADORES DE ESTADO */}
            {cargando && (
                <div className="loading-indicator">
                    <p>Cargando productos...</p>
                </div>
            )}

            {/* INDICADOR DE ESCANEADO */}
            {isScanning && (
                <div className="notification info" style={{textAlign: 'center', padding: '10px', background: '#e3f2fd', color: '#1976d2', borderRadius: '8px', margin: '10px 0'}}>
                    Escaneando código...
                </div>
            )}

            {/* FORMULARIO PARA AGREGAR/EDITAR (solo se muestra cuando mostrarFormulario es true) */}
            {mostrarFormulario && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        <form onSubmit={guardarProducto} className="product-form">
                            <div className="form-group">
                                <label>Nombre:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={nuevoProducto.name}
                                    onChange={manejarCambio}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Precio:</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="price"
                                    value={nuevoProducto.price}
                                    onChange={manejarCambio}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Stock:</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={nuevoProducto.stock}
                                    onChange={manejarCambio}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Código de Barras:</label>
                                <input
                                    type="text"
                                    name="barcode"
                                    value={nuevoProducto.barcode}
                                    onChange={manejarCambio}
                                />
                            </div>
                            <div className="form-group">
                                <label>URL de Imagen:</label>
                                <input
                                    type="url"
                                    name="image"
                                    value={nuevoProducto.image}
                                    onChange={manejarCambio}
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-guardar">
                                    Guardar
                                </button>
                                <button type="button" onClick={cerrarFormulario} className="btn-cancelar">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
            {mostrarConfirmacion && (
                <div className="modal-overlay">
                    <div className="modal-content modal-confirmacion">
                        <h3>Confirmar Eliminación</h3>
                        <p>¿Estás seguro de que quieres eliminar el producto <strong>"{productoAEliminar?.name}"</strong>?</p>
                        <p className="advertencia">Esta acción no se puede deshacer.</p>
                        <div className="form-actions">
                            <button
                                className="btn-confirmar"
                                onClick={confirmarEliminacion}
                            >
                                Eliminar
                            </button>
                            <button
                                className="btn-cancelar"
                                onClick={cancelarEliminacion}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LISTA DE PRODUCTOS EN TARJETAS */}
            <div className="products-grid">
                {productosEnPagina.map(producto => (
                    <div key={producto.id} className="product-card">
                        {/* Imagen del producto */}
                        <div className="product-image">
                            {producto.image ? (
                                <img
                                    src={producto.image}
                                    alt={producto.name}
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                        e.target.nextSibling.style.display = 'flex'
                                    }}
                                />
                            ) : null}
                            <div className="product-image-placeholder" style={{display: producto.image ? 'none' : 'flex'}}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <path d="m21 15-5-5L5 21"/>
                                </svg>
                            </div>
                        </div>

                        {/* Información del producto */}
                        <div className="product-content">
                            <h3>{producto.name}</h3>
                            <p><strong>Precio:</strong> {formatearDinero(producto.price)}</p>
                            <p><strong>Stock:</strong> {producto.stock} unidades</p>
                            {producto.barcode && <p><strong>Código:</strong> {producto.barcode}</p>}

                            {/* Botones de acción */}
                            <div className="product-actions">
                                <button
                                    onClick={() => editarProducto(producto)}
                                    className="btn-edit"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => eliminarProductoHandler(producto.id)}
                                    className="btn-delete"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* CONTROLES DE PAGINACIÓN */}
            {totalPaginas > 1 && (
                <div className="paginacion">
                    <button
                        className="btn-pagina"
                        onClick={() => cambiarPagina(paginaActual - 1)}
                        disabled={paginaActual === 1}
                    >
                        Anterior
                    </button>

                    <span className="info-pagina">
                        Página {paginaActual} de {totalPaginas}
                    </span>

                    <button
                        className="btn-pagina"
                        onClick={() => cambiarPagina(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {/* MENSAJE CUANDO NO HAY PRODUCTOS */}
            {productosFiltrados.length === 0 && (
                <div className="no-products">
                    {filtroActivo ?
                        `No se encontraron productos que coincidan con "${filtroActivo}"` :
                        'No hay productos en el inventario. ¡Agrega tu primer producto!'
                    }
                </div>
            )}

            {/* MODAL PERSONALIZADO PARA ERRORES */}
            {modal.isOpen && (
                <div className="modal-overlay">
                    <div className={`modal-content modal-${modal.type}`}> 
                        <div className="modal-header">
                            <h3>{modal.title}</h3>
                            <button className="modal-close" onClick={cerrarModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>{modal.message}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-ok" onClick={cerrarModal}>
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
