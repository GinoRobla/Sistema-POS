import React, { useEffect, useRef, useState } from 'react'
import {
    obtenerProductos,
    actualizarProducto,
    eliminarProducto,
    crearProducto,
    formatearDinero,
    normalizarCodigoBarras,
    validarCodigoBarras
} from '../../utils'
import { useApi } from '../../hooks/useApi'
import { useGlobalScanner } from '../../hooks/scanner'
import Modal, { ConfirmationModal } from '../common/Modal'
import './Inventory.css'

const INVENTORY_VIEW_STORAGE_KEY = 'inventory-view-mode'

export const Inventory = () => {
    const { cargando, ejecutarPeticion } = useApi()
    const [productos, setProductos] = useState([])
    const [textoBusqueda, setTextoBusqueda] = useState('')
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [editando, setEditando] = useState(null)
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
    const [productoAEliminar, setProductoAEliminar] = useState(null)
    const [paginaActual, setPaginaActual] = useState(1)
    const [filtroActivo, setFiltroActivo] = useState('')
    const [viewMode, setViewMode] = useState(() => {
        const vistaGuardada = window.localStorage.getItem(INVENTORY_VIEW_STORAGE_KEY)
        return vistaGuardada === 'table' ? 'table' : 'grid'
    })
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    })
    const [nuevoProducto, setNuevoProducto] = useState({
        name: '',
        price: '',
        stock: '',
        barcode: '',
        image: ''
    })

    const productosPorPagina = 12
    const campoBusquedaRef = useRef(null)
    const esBorradoAutomatico = useRef(false)

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
                    'No se pudieron cargar los productos. Por favor, verifica tu conexion e intenta nuevamente.',
                    'error'
                )
            }
        }

        cargarProductos()
    }, [ejecutarPeticion])

    useEffect(() => {
        window.localStorage.setItem(INVENTORY_VIEW_STORAGE_KEY, viewMode)
    }, [viewMode])

    const manejarCodigoEscaneado = (codigo) => {
        setFiltroActivo(normalizarCodigoBarras(codigo))
        setTextoBusqueda('')
    }

    const { isScanning } = useGlobalScanner(manejarCodigoEscaneado, {
        minLength: 8,
        timeout: 100,
        enabled: !mostrarFormulario && !mostrarConfirmacion,
        preventOnModal: true
    })

    useEffect(() => {
        const codigoNormalizado = normalizarCodigoBarras(textoBusqueda)

        if (codigoNormalizado.length >= 8 && /^\d+$/.test(codigoNormalizado)) {
            setFiltroActivo(codigoNormalizado)

            const timer = setTimeout(() => {
                esBorradoAutomatico.current = true
                setTextoBusqueda('')

                setTimeout(() => {
                    esBorradoAutomatico.current = false
                }, 100)
            }, 100)

            return () => clearTimeout(timer)
        }

        if (textoBusqueda !== '') {
            setFiltroActivo(textoBusqueda)
        }
    }, [textoBusqueda])

    const manejarCambioBusqueda = (event) => {
        const nuevoTexto = event.target.value
        const nuevoTextoNormalizado = /^\d+\s*$/.test(nuevoTexto.trim()) || nuevoTexto.trim() === ''
            ? normalizarCodigoBarras(nuevoTexto)
            : nuevoTexto
        setTextoBusqueda(nuevoTextoNormalizado)

        if (nuevoTextoNormalizado === '' && !esBorradoAutomatico.current) {
            setFiltroActivo('')
        }
    }

    const manejarTeclaPresionada = (event) => {
        const codigoNormalizado = normalizarCodigoBarras(textoBusqueda)

        if (event.key === 'Enter' && textoBusqueda.trim()) {
            setFiltroActivo(/^\d+$/.test(codigoNormalizado) ? codigoNormalizado : textoBusqueda)
        }
    }

    useEffect(() => {
        setPaginaActual(1)
    }, [filtroActivo])

    const productosFiltrados = productos.filter((producto) => {
        if (!filtroActivo.trim()) return true

        return (
            producto.name.toLowerCase().includes(filtroActivo.toLowerCase()) ||
            producto.barcode?.includes(filtroActivo)
        )
    })

    const indiceInicio = (paginaActual - 1) * productosPorPagina
    const indiceFin = indiceInicio + productosPorPagina
    const productosEnPagina = productosFiltrados.slice(indiceInicio, indiceFin)
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina)

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina)
        }
    }

    const manejarCambio = (event) => {
        const { name, value } = event.target
        setNuevoProducto((prev) => ({
            ...prev,
            [name]: value
        }))
    }

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

    const guardarProducto = async (event) => {
        event.preventDefault()

        if (!nuevoProducto.name.trim()) {
            mostrarModal('Error de validacion', 'El nombre del producto es obligatorio.', 'error')
            return
        }

        if (!nuevoProducto.price || parseFloat(nuevoProducto.price) <= 0) {
            mostrarModal('Error de validacion', 'El precio debe ser un numero mayor a 0.', 'error')
            return
        }

        if (!nuevoProducto.stock || parseInt(nuevoProducto.stock, 10) < 0) {
            mostrarModal('Error de validacion', 'El stock debe ser un numero igual o mayor a 0.', 'error')
            return
        }

        if (nuevoProducto.barcode && !validarCodigoBarras(nuevoProducto.barcode)) {
            mostrarModal(
                'Error de validacion',
                'El codigo de barras ingresado no es valido. Por favor, verifica el formato.',
                'error'
            )
            return
        }

        await ejecutarPeticion(async () => {
            const datosProducto = {
                ...nuevoProducto,
                price: parseFloat(nuevoProducto.price),
                stock: parseInt(nuevoProducto.stock, 10)
            }

            try {
                if (editando) {
                    await actualizarProducto(editando.id, datosProducto)
                    mostrarModal(
                        'Producto actualizado',
                        `El producto "${datosProducto.name}" se actualizo correctamente.`,
                        'success'
                    )
                } else {
                    await crearProducto(datosProducto)
                    mostrarModal(
                        'Producto creado',
                        `El producto "${datosProducto.name}" se creo correctamente.`,
                        'success'
                    )
                }

                cerrarFormulario()
                const productosActualizados = await obtenerProductos()
                setProductos(productosActualizados)
            } catch {
                mostrarModal(
                    'Error al guardar producto',
                    editando
                        ? 'No se pudo actualizar el producto. Por favor, intenta nuevamente.'
                        : 'No se pudo crear el producto. Por favor, intenta nuevamente.',
                    'error'
                )
            }
        })
    }

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

    const eliminarProductoHandler = (id) => {
        const producto = productos.find((item) => item.id === id)
        setProductoAEliminar(producto)
        setMostrarConfirmacion(true)
    }

    const confirmarEliminacion = async () => {
        await ejecutarPeticion(async () => {
            try {
                await eliminarProducto(productoAEliminar.id)
                const productosActualizados = await obtenerProductos()
                setProductos(productosActualizados)
                setMostrarConfirmacion(false)

                mostrarModal(
                    'Producto eliminado',
                    `El producto "${productoAEliminar.name}" se elimino correctamente.`,
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

    const cancelarEliminacion = () => {
        setMostrarConfirmacion(false)
        setProductoAEliminar(null)
    }

    return (
        <div className="inventory">
            <div className="inventory-header page-header">
                <h2 className="page-title">Inventario de Productos</h2>
                
            </div>
            <div className="header-separator"></div>

            <div className="search-section">
                <input
                    ref={campoBusquedaRef}
                    type="text"
                    placeholder="Buscar productos o escanear codigo..."
                    value={textoBusqueda}
                    onChange={manejarCambioBusqueda}
                    onKeyDown={manejarTeclaPresionada}
                    className="barcode-input"
                />

                <button
                    type="button"
                    className="btn-nuevo"
                    onClick={() => setMostrarFormulario(true)}
                    disabled={cargando}
                >
                    {cargando ? 'Cargando...' : 'Nuevo Producto'}
                </button>

                <div className="view-toggle">
                    <button
                        type="button"
                        className={`btn-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Vista de tarjetas"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={`btn-toggle ${viewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Vista de tabla"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18" />
                            <path d="M3 12h18" />
                            <path d="M3 18h18" />
                        </svg>
                    </button>
                </div>

                {filtroActivo && (
                    <button
                        type="button"
                        className="btn-clear-filter"
                        onClick={() => {
                            setFiltroActivo('')
                            setTextoBusqueda('')
                        }}
                    >
                        Limpiar Filtro
                    </button>
                )}
            </div>

            {cargando && (
                <div className="feedback-panel">
                    <p>Cargando productos...</p>
                </div>
            )}

            {isScanning && (
                <div className="feedback-panel feedback-panel-info">
                    Escaneando codigo...
                </div>
            )}

            <Modal
                isOpen={mostrarFormulario}
                onClose={cerrarFormulario}
                title={editando ? 'Editar Producto' : 'Nuevo Producto'}
                size="md"
            >
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
                        <label>Codigo de Barras:</label>
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
            </Modal>

            <ConfirmationModal
                isOpen={mostrarConfirmacion}
                onClose={cancelarEliminacion}
                onConfirm={confirmarEliminacion}
                title="Confirmar eliminacion"
                message={`Estas seguro de que quieres eliminar el producto "${productoAEliminar?.name || ''}"?`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

            {viewMode === 'grid' ? (
                <div className="products-grid">
                    {productosEnPagina.map((producto) => (
                        <div key={producto.id} className="product-card">
                            <div className="product-image">
                                {producto.image ? (
                                    <img
                                        src={producto.image}
                                        alt={producto.name}
                                        onError={(event) => {
                                            event.target.style.display = 'none'
                                            event.target.nextSibling.style.display = 'flex'
                                        }}
                                    />
                                ) : null}
                                <div className="product-image-placeholder" style={{ display: producto.image ? 'none' : 'flex' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <path d="m21 15-5-5L5 21" />
                                    </svg>
                                    <span>Sin imagen</span>
                                </div>
                            </div>

                            <div className="product-content">
                                <h3>{producto.name}</h3>
                                <div className="product-meta">
                                    <div className="product-meta-item">
                                        <span className="product-meta-label">Precio</span>
                                        <strong className="product-meta-value">{formatearDinero(producto.price)}</strong>
                                    </div>
                                    <div className="product-meta-item">
                                        <span className="product-meta-label">Stock</span>
                                        <strong className="product-meta-value">{producto.stock} unidades</strong>
                                    </div>
                                </div>

                                <p className={`product-code ${!producto.barcode ? 'product-code-empty' : ''}`}>
                                    {producto.barcode ? `Codigo: ${producto.barcode}` : 'Sin codigo de barras'}
                                </p>

                                <div className="product-actions">
                                    <button
                                        type="button"
                                        onClick={() => editarProducto(producto)}
                                        className="btn-edit"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
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
            ) : (
                <div className="products-table-container">
                    <table className="products-table">
                        <thead>
                            <tr>
                                <th>Imagen</th>
                                <th>Nombre</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Codigo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productosEnPagina.map((producto) => (
                                <tr key={producto.id}>
                                    <td className="table-image-cell">
                                        <div className="table-product-image">
                                            {producto.image ? (
                                                <img
                                                    src={producto.image}
                                                    alt={producto.name}
                                                    onError={(event) => {
                                                        event.target.style.display = 'none'
                                                        event.target.nextSibling.style.display = 'flex'
                                                    }}
                                                />
                                            ) : null}
                                            <div className="table-product-image-placeholder" style={{ display: producto.image ? 'none' : 'flex' }}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <path d="m21 15-5-5L5 21" />
                                                </svg>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{producto.name}</td>
                                    <td>{formatearDinero(producto.price)}</td>
                                    <td>{producto.stock} unidades</td>
                                    <td>{producto.barcode || '-'}</td>
                                    <td>
                                        <div className="table-product-actions">
                                            <button
                                                type="button"
                                                onClick={() => editarProducto(producto)}
                                                className="btn-edit"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => eliminarProductoHandler(producto.id)}
                                                className="btn-delete"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPaginas > 1 && (
                <div className="paginacion">
                    <button
                        type="button"
                        className="btn-pagina"
                        onClick={() => cambiarPagina(paginaActual - 1)}
                        disabled={paginaActual === 1}
                    >
                        Anterior
                    </button>

                    <span className="info-pagina">
                        Pagina {paginaActual} de {totalPaginas}
                    </span>

                    <button
                        type="button"
                        className="btn-pagina"
                        onClick={() => cambiarPagina(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {productosFiltrados.length === 0 && (
                <div className="feedback-panel feedback-panel-empty">
                    {filtroActivo
                        ? `No se encontraron productos que coincidan con "${filtroActivo}"`
                        : 'No hay productos en el inventario. Agrega tu primer producto.'}
                </div>
            )}

            <Modal
                isOpen={modal.isOpen}
                onClose={cerrarModal}
                title={modal.title}
                type={modal.type}
                size="sm"
            >
                <p className="ui-modal-text">{modal.message}</p>
                <div className="ui-modal-actions">
                    <button type="button" className="ui-modal-button ui-modal-button-primary" onClick={cerrarModal}>
                        Aceptar
                    </button>
                </div>
            </Modal>
        </div>
    )
}
