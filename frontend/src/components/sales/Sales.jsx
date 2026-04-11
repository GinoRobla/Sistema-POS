import React, { useEffect, useMemo, useRef, useState } from 'react'
import TicketVenta from './TicketVenta'
import { buscarProductoPorCodigo, buscarProductos, crearVenta, formatearDinero, validarCodigoBarras } from '../../utils'
import { useApi } from '../../hooks/useApi'
import { useCart } from '../../hooks/useCart'
import { useGlobalScanner } from '../../hooks/scanner'
import Modal from '../common/Modal'
import './Sales.css'

const getProductInitials = (name = '') => {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')
}

const normalizarBusqueda = (texto = '') => texto.trim().toLowerCase()
const esEntradaNumerica = (texto = '') => /^\d+$/.test(texto.trim())

const obtenerCoincidenciaExacta = (productos, termino) => {
    const terminoNormalizado = normalizarBusqueda(termino)

    const coincidenciasExactas = productos.filter((producto) => {
        const nombreNormalizado = normalizarBusqueda(producto.name)
        const barcode = String(producto.barcode ?? '').trim()

        return nombreNormalizado === terminoNormalizado || barcode === termino.trim()
    })

    return coincidenciasExactas.length === 1 ? coincidenciasExactas[0] : null
}

export const Sales = () => {
    const { cargando, ejecutarPeticion } = useApi()
    const [codigoEscaneado, setCodigoEscaneado] = useState('')
    const [vendiendo, setVendiendo] = useState(false)
    const [mostrarModalVenta, setMostrarModalVenta] = useState(false)
    const [ventaCompletada, setVentaCompletada] = useState(null)
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
    const [sugerencias, setSugerencias] = useState([])
    const [cargandoSugerencias, setCargandoSugerencias] = useState(false)
    const [mostrarModalResultados, setMostrarModalResultados] = useState(false)
    const [resultadosBusqueda, setResultadosBusqueda] = useState([])
    const [terminoBusqueda, setTerminoBusqueda] = useState('')
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    })

    const campoCodigoRef = useRef(null)
    const ticketRef = useRef(null)
    const blurTimeoutRef = useRef(null)
    const sugerenciaRequestRef = useRef(0)

    const mostrarModalPersonalizado = (title, message, type = 'info') => {
        setModal({
            isOpen: true,
            title,
            message,
            type
        })
    }

    const cerrarModalPersonalizado = () => {
        setModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info'
        })
    }

    const mostrarError = (mensaje, esAdvertencia = false) => {
        if (mensaje.includes('sin stock') || mensaje.includes('No hay mas stock')) {
            mostrarModalPersonalizado('Sin stock disponible', mensaje, 'warning')
        } else if (esAdvertencia) {
            mostrarModalPersonalizado('Advertencia', mensaje, 'warning')
        } else {
            mostrarModalPersonalizado('Producto no encontrado', mensaje, 'error')
        }
    }

    const {
        carrito,
        agregarProducto,
        cambiarCantidad,
        quitarProducto,
        vaciarCarrito,
        total,
        totalProductos
    } = useCart(mostrarError)

    const enfocarCampoBusqueda = () => {
        campoCodigoRef.current?.focus()
    }

    const limpiarSugerencias = () => {
        setMostrarSugerencias(false)
        setSugerencias([])
        setCargandoSugerencias(false)
    }

    const cerrarModalResultados = () => {
        setMostrarModalResultados(false)
        setResultadosBusqueda([])
        setTerminoBusqueda('')
        enfocarCampoBusqueda()
    }

    const restablecerBusquedaManual = () => {
        setCodigoEscaneado('')
        limpiarSugerencias()
        cerrarModalResultados()
    }

    const agregarProductoAVenta = (producto) => {
        agregarProducto(producto)
        restablecerBusquedaManual()
    }

    const abrirResultadosBusqueda = (productos, termino) => {
        limpiarSugerencias()
        setResultadosBusqueda(productos)
        setTerminoBusqueda(termino)
        setMostrarModalResultados(true)
    }

    useEffect(() => {
        const termino = codigoEscaneado.trim()

        if (termino.length < 2 || esEntradaNumerica(termino) || validarCodigoBarras(termino)) {
            setMostrarSugerencias(false)
            setCargandoSugerencias(false)
            setSugerencias([])
            return undefined
        }

        const requestId = sugerenciaRequestRef.current + 1
        sugerenciaRequestRef.current = requestId

        const timeoutId = window.setTimeout(async () => {
            setCargandoSugerencias(true)

            try {
                const productos = await buscarProductos(termino)

                if (sugerenciaRequestRef.current !== requestId) return

                setSugerencias(productos.slice(0, 6))
                setMostrarSugerencias(true)
            } catch {
                if (sugerenciaRequestRef.current !== requestId) return

                setSugerencias([])
            } finally {
                if (sugerenciaRequestRef.current === requestId) {
                    setCargandoSugerencias(false)
                }
            }
        }, 250)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [codigoEscaneado])

    useEffect(() => {
        return () => {
            if (blurTimeoutRef.current) {
                window.clearTimeout(blurTimeoutRef.current)
            }
        }
    }, [])

    const manejarCodigoEscaneado = async (codigo) => {
        if (!validarCodigoBarras(codigo)) {
            mostrarModalPersonalizado(
                'Codigo invalido',
                'El codigo escaneado no tiene un formato valido.',
                'error'
            )
            return
        }

        try {
            await ejecutarPeticion(async () => {
                const producto = await buscarProductoPorCodigo(codigo)
                agregarProductoAVenta(producto)
            })
        } catch (error) {
            if (error.message && error.message.includes('404')) {
                mostrarModalPersonalizado(
                    'Producto no encontrado',
                    `No se encontro un producto con el codigo escaneado: ${codigo}`,
                    'error'
                )
            } else {
                mostrarModalPersonalizado(
                    'Error',
                    'Ocurrio un error al buscar el producto. Intenta nuevamente.',
                    'error'
                )
            }
        }
    }

    const { isScanning } = useGlobalScanner(manejarCodigoEscaneado, {
        minLength: 8,
        timeout: 100,
        enabled: true,
        preventOnModal: true
    })

    const buscarProductoManual = async (textoBusqueda) => {
        const termino = textoBusqueda.trim()
        if (!termino) return

        if (esEntradaNumerica(termino) && !validarCodigoBarras(termino)) {
            mostrarModalPersonalizado(
                'Codigo invalido',
                'El codigo ingresado no tiene un formato valido. Por favor, verifica el codigo e intenta nuevamente.',
                'error'
            )
            return
        }

        try {
            await ejecutarPeticion(async () => {
                if (esEntradaNumerica(termino) || validarCodigoBarras(termino)) {
                    const producto = await buscarProductoPorCodigo(termino)
                    agregarProductoAVenta(producto)
                    return producto
                }

                const productos = await buscarProductos(termino)

                if (!productos.length) {
                    throw new Error('SIN_RESULTADOS')
                }

                const coincidenciaExacta = obtenerCoincidenciaExacta(productos, termino)

                if (coincidenciaExacta) {
                    agregarProductoAVenta(coincidenciaExacta)
                    return coincidenciaExacta
                }

                if (productos.length === 1) {
                    agregarProductoAVenta(productos[0])
                    return productos[0]
                }

                abrirResultadosBusqueda(productos, termino)
                return productos
            })
        } catch (error) {
            if (error.message === 'SIN_RESULTADOS') {
                mostrarModalPersonalizado(
                    'Producto no encontrado',
                    `No se encontraron productos con: ${termino}`,
                    'error'
                )
            } else if (error.message && error.message.includes('404')) {
                mostrarModalPersonalizado(
                    'Producto no encontrado',
                    `No se encontro un producto con el codigo ingresado: ${termino}`,
                    'error'
                )
            } else {
                mostrarModalPersonalizado(
                    'Error',
                    'Ocurrio un error al buscar el producto. Intenta nuevamente.',
                    'error'
                )
            }
        }
    }

    const finalizarVenta = async () => {
        if (carrito.length === 0) {
            mostrarModalPersonalizado(
                'Carrito vacio',
                'No puedes finalizar una venta sin productos en el carrito.',
                'warning'
            )
            return
        }

        setVendiendo(true)

        try {
            await ejecutarPeticion(async () => {
                const ventaData = {
                    items: carrito.map((item) => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    total
                }

                const ventaCreada = await crearVenta(ventaData)

                setVentaCompletada({
                    ...ventaCreada,
                    productos: carrito
                })

                vaciarCarrito()
                setMostrarModalVenta(true)
            })
        } catch {
            mostrarModalPersonalizado(
                'Error al procesar venta',
                'No se pudo completar la venta. Por favor, intenta nuevamente.',
                'error'
            )
        }

        setVendiendo(false)
    }

    const manejarCambioCodigo = (event) => {
        setCodigoEscaneado(event.target.value)
    }

    const manejarFocusBusqueda = () => {
        if (blurTimeoutRef.current) {
            window.clearTimeout(blurTimeoutRef.current)
            blurTimeoutRef.current = null
        }

        if (sugerencias.length > 0) {
            setMostrarSugerencias(true)
        }
    }

    const manejarBlurBusqueda = () => {
        blurTimeoutRef.current = window.setTimeout(() => {
            setMostrarSugerencias(false)
        }, 180)
    }

    const manejarEnter = (event) => {
        if (event.key === 'Enter' && codigoEscaneado.trim()) {
            buscarProductoManual(codigoEscaneado.trim())
        }
    }

    const cerrarModalVenta = () => {
        setMostrarModalVenta(false)
        setVentaCompletada(null)
        enfocarCampoBusqueda()
    }

    const imprimirTicket = () => {
        if (!ticketRef.current) return

        const printWindow = window.open('', '', 'width=400,height=600')

        printWindow.document.write('<html><head><title>Ticket de Venta</title>')
        printWindow.document.write('<style>body{font-family:sans-serif;padding:10px;}</style>')
        printWindow.document.write('</head><body>')
        printWindow.document.write(ticketRef.current.innerHTML)
        printWindow.document.write('</body></html>')
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        printWindow.close()
    }

    const codigoValido = validarCodigoBarras(codigoEscaneado.trim())

    const resumenVenta = useMemo(() => {
        return {
            productosUnicos: carrito.length,
            articulosTotales: totalProductos,
            promedioPorArticulo: totalProductos > 0 ? total / totalProductos : 0
        }
    }, [carrito.length, total, totalProductos])

    return (
        <div className="sales-view">
            <div className="sales-header page-header">
                <h1 className="page-title">Punto de Venta</h1>
                {/* <p className="page-subtitle">
                    Escanea productos, confirma rapidamente el carrito y cierra cada venta desde una sola pantalla.
                </p> */}
            </div>

            <div className="sales-dashboard">
                <div className="header-separator"></div>

                <div className="search-section">
                    <input
                        ref={campoCodigoRef}
                        type="text"
                        placeholder="Escaneá el código o ingresá el nombre..."
                        value={codigoEscaneado}
                        onChange={manejarCambioCodigo}
                        onKeyDown={manejarEnter}
                        onFocus={manejarFocusBusqueda}
                        onBlur={manejarBlurBusqueda}
                        className="barcode-input"
                    />
                    <button
                        type="button"
                        className="btn-add-code"
                        onClick={() => buscarProductoManual(codigoEscaneado.trim())}
                        disabled={!codigoEscaneado.trim() || !codigoValido || cargando}
                    >
                        Agregar
                    </button>

                    {mostrarSugerencias && (
                        <div className="sales-suggestions-panel">
                            {cargandoSugerencias ? (
                                <div className="sales-suggestion-state">
                                    Buscando sugerencias...
                                </div>
                            ) : sugerencias.length > 0 ? (
                                sugerencias.map((producto) => (
                                    <button
                                        key={producto.id}
                                        type="button"
                                        className="sales-suggestion-item"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => agregarProductoAVenta(producto)}
                                        disabled={producto.stock <= 0}
                                    >
                                        <div className="sales-suggestion-copy">
                                            <strong>{producto.name}</strong>
                                            <span>
                                                {producto.barcode
                                                    ? `Cod. ${producto.barcode}`
                                                    : 'Sin codigo de barras'}
                                            </span>
                                        </div>
                                        <div className="sales-suggestion-meta">
                                            <strong>{formatearDinero(producto.price)}</strong>
                                            <span className={producto.stock > 0 ? 'is-available' : 'is-out'}>
                                                {producto.stock > 0
                                                    ? `Stock ${producto.stock}`
                                                    : 'Sin stock'}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="sales-suggestion-state">
                                    No hay sugerencias para "{codigoEscaneado.trim()}".
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {cargando && (
                    <div className="feedback-panel feedback-panel-info">
                        Procesando...
                    </div>
                )}

                {isScanning && (
                    <div className="feedback-panel feedback-panel-info">
                        Escaneando codigo...
                    </div>
                )}

                <div className="sales-main-grid">
                    <section className="cart-section content-card">
                        <div className="cart-header">
                            <div>
                                <h2>Carrito de Compras</h2>
                                <p className="cart-subtitle">
                                    {resumenVenta.articulosTotales > 0
                                        ? `${resumenVenta.articulosTotales} articulos listos para cobrar`
                                        : 'Agrega un producto para comenzar la venta'}
                                </p>
                            </div>
                            {carrito.length > 0 && (
                                <button type="button" onClick={vaciarCarrito} className="btn-clear">
                                    Limpiar carrito
                                </button>
                            )}
                        </div>

                        {carrito.length === 0 ? (
                            <div className="empty-cart">
                                <div className="empty-cart-visual">COD</div>
                                <h3>Aun no hay productos cargados</h3>
                                <p>Busca por nombre, escanea un codigo o escribelo manualmente para empezar a cobrar.</p>
                                <div className="empty-cart-steps">
                                    <span>1. Escanea</span>
                                    <span>2. Revisa cantidades</span>
                                    <span>3. Finaliza la venta</span>
                                </div>
                            </div>
                        ) : (
                            <div className="cart-items cart-items-list">
                                <div className="cart-list-header">
                                    <span className="cart-list-heading cart-list-heading-product">Producto</span>
                                    <span className="cart-list-heading">Cantidad</span>
                                    <span className="cart-list-heading">Importe</span>
                                    <span className="cart-list-heading cart-list-heading-action">Quitar</span>
                                </div>
                                {carrito.map((item) => (
                                    <div key={item.id} className="cart-item">
                                        <div className="item-main">
                                            <div className="item-info">
                                                <div className="item-title-row">
                                                    <h3>{item.name}</h3>
                                                </div>
                                                <div className="item-meta item-meta-compact item-meta-list">
                                                    <span className="item-price item-price-compact">{formatearDinero(item.price)} c/u</span>
                                                    <span className="item-meta-divider" aria-hidden="true">|</span>
                                                    <span className="item-stock-text">Stock {item.stock}</span>
                                                    {item.barcode && <span className="item-meta-divider" aria-hidden="true">|</span>}
                                                    {item.barcode && <span className="item-code">Cod. {item.barcode}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="quantity-controls">
                                            <button
                                                type="button"
                                                className="qty-btn"
                                                onClick={() => cambiarCantidad(item.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="quantity">{item.quantity}</span>
                                            <button
                                                type="button"
                                                className="qty-btn"
                                                onClick={() => cambiarCantidad(item.id, item.quantity + 1)}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="item-total-block">
                                            <span className="item-total-label">Subt.</span>
                                            <div className="item-total">{formatearDinero(item.price * item.quantity)}</div>
                                        </div>

                                        <button
                                            type="button"
                                            className="remove-btn"
                                            aria-label={`Quitar ${item.name}`}
                                            onClick={() => quitarProducto(item.id)}
                                        >
                                            x
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className="sales-summary-column">
                        <section className="total-section content-card">
                            <div className="summary-card-header">
                                <h2>Resumen de cobro</h2>
                                <span className="summary-chip">{resumenVenta.productosUnicos} productos</span>
                            </div>

                            <div className="summary-stats">
                                <div className="summary-stat">
                                    <span className="summary-stat-label">Articulos</span>
                                    <strong>{resumenVenta.articulosTotales}</strong>
                                </div>
                                <div className="summary-stat">
                                    <span className="summary-stat-label">Promedio por articulo</span>
                                    <strong>{formatearDinero(resumenVenta.promedioPorArticulo)}</strong>
                                </div>
                            </div>

                            <div className="total-display">
                                <span className="total-label">Total a cobrar</span>
                                <span className="total-amount">{formatearDinero(total)}</span>
                            </div>

                            <button
                                type="button"
                                onClick={finalizarVenta}
                                disabled={vendiendo || carrito.length === 0}
                                className="btn-finalize"
                            >
                                {vendiendo ? 'Procesando...' : 'Finalizar Venta'}
                            </button>
                        </section>

                        <section className="cashier-tips content-card">
                            <h3>Flujo recomendado</h3>
                            <ul className="cashier-tips-list">
                                <li>Escanea primero todos los productos seguidos.</li>
                                <li>Ajusta cantidades antes de confirmar el cobro.</li>
                                <li>Imprime el ticket solo si el cliente lo necesita.</li>
                            </ul>
                        </section>
                    </aside>
                </div>
            </div>

            <Modal
                isOpen={mostrarModalVenta && !!ventaCompletada}
                onClose={cerrarModalVenta}
                title="Venta completada"
                size="sm"
                onClickOutside={false}
                contentClassName="sales-ticket-modal-content"
            >
                {ventaCompletada && (
                    <div className="modal-ticket-container">
                        <TicketVenta venta={ventaCompletada} ref={ticketRef} />
                        <div className="modal-footer-ticket">
                            <button type="button" className="btn-imprimir-ticket" onClick={imprimirTicket}>
                                Imprimir ticket
                            </button>
                            <button type="button" className="btn-cerrar-modal" onClick={cerrarModalVenta}>
                                Continuar vendiendo
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={mostrarModalResultados}
                onClose={cerrarModalResultados}
                title="Selecciona un producto"
                size="lg"
                contentClassName="sales-results-modal-content"
            >
                <div className="sales-results-modal-header">
                    <p>
                        Se encontraron {resultadosBusqueda.length} productos para <strong>{terminoBusqueda}</strong>.
                    </p>
                    <span>Elige cual quieres agregar al carrito.</span>
                </div>

                <div className="sales-results-list">
                    {resultadosBusqueda.map((producto) => (
                        <button
                            key={producto.id}
                            type="button"
                            className="sales-result-card"
                            onClick={() => agregarProductoAVenta(producto)}
                            disabled={producto.stock <= 0}
                        >
                            <div className="sales-result-leading">
                                <div className="sales-result-avatar">
                                    {getProductInitials(producto.name)}
                                </div>
                                <div className="sales-result-copy">
                                    <strong>{producto.name}</strong>
                                    <span>{producto.barcode ? `Codigo: ${producto.barcode}` : 'Sin codigo de barras'}</span>
                                </div>
                            </div>

                            <div className="sales-result-meta">
                                <strong>{formatearDinero(producto.price)}</strong>
                                <span className={producto.stock > 0 ? 'is-available' : 'is-out'}>
                                    {producto.stock > 0 ? `Stock ${producto.stock}` : 'Sin stock'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </Modal>

            <Modal
                isOpen={modal.isOpen}
                onClose={cerrarModalPersonalizado}
                title={modal.title}
                type={modal.type}
                size="sm"
            >
                <div className="modal-message">{modal.message}</div>
                <div className="ui-modal-actions">
                    <button
                        type="button"
                        className="ui-modal-button ui-modal-button-primary"
                        onClick={cerrarModalPersonalizado}
                    >
                        Aceptar
                    </button>
                </div>
            </Modal>
        </div>
    )
}
