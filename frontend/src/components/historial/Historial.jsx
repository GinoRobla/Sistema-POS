import React, { useEffect, useRef, useState } from 'react'
import './Historial.css'
import { useApi } from '../../hooks/useApi'
import { useDateFilter } from '../../hooks/useDateFilter'
import { obtenerVentas, obtenerProductos, formatearDinero, formatearFechaHora, contarProductos } from '../../utils'
import DateFilter from '../common/DateFilter'
import Modal from '../common/Modal'
import TicketVenta from '../sales/TicketVenta'
import '../common/DateFilter.css'

export const Historial = () => {
    const [productos, setProductos] = useState([])
    const [ventas, setVentas] = useState([])
    const [ventasFiltradas, setVentasFiltradas] = useState([])
    const [paginaActual, setPaginaActual] = useState(1)
    const [mostrarModal, setMostrarModal] = useState(false)
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null)

    const ventasPorPagina = 10
    const dateFilter = useDateFilter()
    const { cargando, error, ejecutarPeticion, limpiarError } = useApi()
    const ticketRef = useRef(null)

    const cargarVentasYProductos = async () => {
        limpiarError()

        try {
            const [datosVentas, datosProductos] = await Promise.all([
                ejecutarPeticion(() => obtenerVentas()),
                ejecutarPeticion(() => obtenerProductos())
            ])

            setVentas(datosVentas)
            setVentasFiltradas(datosVentas)
            setProductos(datosProductos)
        } catch {
            setVentas([])
            setVentasFiltradas([])
            setProductos([])
        }
    }

    const limpiarFiltros = () => {
        dateFilter.limpiarFiltros()
        setVentasFiltradas(ventas)
    }

    const verDetalles = (venta) => {
        const ventaConNombres = {
            ...venta,
            items: venta.items.map((item) => {
                const producto = productos.find((prod) => prod.id === item.productId)

                return {
                    ...item,
                    productName: item.productName || item.name || (producto ? producto.name : 'Producto sin nombre'),
                    barcode: item.barcode || (producto ? producto.barcode : '')
                }
            })
        }

        setVentaSeleccionada(ventaConNombres)
        setMostrarModal(true)
    }

    const cerrarModal = () => {
        setMostrarModal(false)
        setVentaSeleccionada(null)
    }

    const imprimirTicket = () => {
        if (!ticketRef.current) return
        const printWindow = window.open('', '', 'width=400,height=600')
        printWindow.document.write(`
            <html>
            <head>
                <title>Ticket de Venta</title>
                <style>
                    @page {
                        size: 80mm auto;
                        margin: 10mm 5mm;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: #fff;
                    }
                    .ticket-venta {
                        width: 100%;
                        max-width: 280px;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 13px;
                        color: #222;
                        background: #fff;
                        padding: 10px 0;
                    }
                    .ticket-header {
                        text-align: center;
                        margin-bottom: 8px;
                    }
                    .ticket-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 2px;
                    }
                    .ticket-fecha {
                        font-size: 11px;
                        margin-bottom: 6px;
                    }
                    .ticket-linea {
                        border-top: 1px dashed #888;
                        margin: 8px 0;
                    }
                    .ticket-producto {
                        margin-bottom: 6px;
                    }
                    .ticket-producto-nombre {
                        font-weight: bold;
                    }
                    .ticket-producto-detalle {
                        display: flex;
                        justify-content: space-between;
                    }
                    .ticket-total {
                        font-size: 14px;
                        font-weight: bold;
                        text-align: right;
                        margin-top: 10px;
                    }
                    .ticket-footer {
                        text-align: center;
                        font-size: 11px;
                        margin-top: 10px;
                    }
                </style>
            </head>
            <body>${ticketRef.current.innerHTML}</body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        printWindow.onafterprint = () => printWindow.close()
        printWindow.print()
    }

    const calcularVentasPaginadas = () => {
        const indiceInicio = (paginaActual - 1) * ventasPorPagina
        const indiceFin = indiceInicio + ventasPorPagina
        return ventasFiltradas.slice(indiceInicio, indiceFin)
    }

    const totalPaginas = Math.ceil(ventasFiltradas.length / ventasPorPagina)

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina)
        }
    }

    useEffect(() => {
        cargarVentasYProductos()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const ventasEnRango = dateFilter.filtrarPorFecha(ventas)
        setVentasFiltradas(ventasEnRango)
        setPaginaActual(1)
    }, [dateFilter.fechaDesde, dateFilter.fechaHasta, ventas]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="historial-container">
            <div className="historial-header page-header">
                <h1 className="page-title">Historial de Ventas</h1>
            
            </div>
            <div className="header-separator"></div>

            <div className="filtros-container">
                <div className="filtros-fechas">
                    <DateFilter
                        fechaDesde={dateFilter.fechaDesde}
                        fechaHasta={dateFilter.fechaHasta}
                        onFechaDesdeChange={dateFilter.setFechaDesde}
                        onFechaHastaChange={dateFilter.setFechaHasta}
                        onLimpiar={null}
                        showButtons={false}
                        className="historial-date-filter"
                        layout="horizontal"
                    />
                </div>

                <div className="filtros-acciones">
                    <button
                        type="button"
                        className="btn-limpiar"
                        onClick={limpiarFiltros}
                        disabled={!dateFilter.hayFiltrosActivos}
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {error && <div className="feedback-panel feedback-panel-danger">{error}</div>}

            {cargando && <div className="feedback-panel">Cargando ventas...</div>}

            {!cargando && !error && (
                <>
                    <div className="ventas-lista">
                        {ventasFiltradas.length === 0 ? (
                            <div className="feedback-panel feedback-panel-empty">No hay ventas para mostrar</div>
                        ) : (
                            calcularVentasPaginadas().map((venta) => (
                                <div key={venta.id} className="venta-card">
                                    <div className="venta-info">
                                        <div className="venta-fecha">{formatearFechaHora(venta.createdAt)}</div>
                                        <div className="venta-datos">
                                            <span className="venta-productos">
                                                {contarProductos(venta.items)} productos
                                            </span>
                                            <span className="venta-total">
                                                {formatearDinero(venta.total)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-detalles"
                                        onClick={() => verDetalles(venta)}
                                    >
                                        Ver Detalles
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {ventasFiltradas.length > 0 && totalPaginas > 1 && (
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
                </>
            )}

            <Modal
                isOpen={mostrarModal && !!ventaSeleccionada}
                onClose={cerrarModal}
                title="Detalles de la Venta"
                size="lg"
            >
                {ventaSeleccionada && (
                    <>
                        <div className="modal-info-general">
                            <div className="info-item">
                                <strong>Fecha y Hora:</strong> {formatearFechaHora(ventaSeleccionada.createdAt)}
                            </div>
                            <div className="info-item">
                                <strong>Total de Productos:</strong> {contarProductos(ventaSeleccionada.items)}
                            </div>
                            <div className="info-item total-venta">
                                <strong>Total de la Venta:</strong> {formatearDinero(ventaSeleccionada.total)}
                            </div>
                        </div>

                        <div className="modal-productos">
                            <h3>Productos Comprados:</h3>
                            <div className="productos-lista">
                                {ventaSeleccionada.items.map((item, index) => (
                                    <div key={index} className="producto-item">
                                        <div className="producto-info">
                                            <div className="producto-nombre">
                                                {item.productName || item.name || 'Producto sin nombre'}
                                            </div>
                                            <div className="producto-codigo">
                                                Codigo: {item.barcode || 'Sin codigo'}
                                            </div>
                                        </div>
                                        <div className="producto-detalles">
                                            <div className="producto-cantidad">Cantidad: {item.quantity}</div>
                                            <div className="producto-precio">Precio: {formatearDinero(item.price)}</div>
                                            <div className="producto-subtotal">
                                                Subtotal: {formatearDinero(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'none' }}>
                            <TicketVenta
                                ref={ticketRef}
                                venta={{
                                    createdAt: ventaSeleccionada.createdAt,
                                    total: ventaSeleccionada.total,
                                    productos: ventaSeleccionada.items.map((item) => ({
                                        name: item.productName || item.name || 'Producto sin nombre',
                                        quantity: item.quantity,
                                        price: item.price
                                    }))
                                }}
                            />
                        </div>

                        <div className="ui-modal-actions">
                            <button
                                type="button"
                                className="ui-modal-button ui-modal-button-secondary"
                                onClick={imprimirTicket}
                            >
                                Imprimir Ticket
                            </button>
                            <button
                                type="button"
                                className="ui-modal-button ui-modal-button-primary"
                                onClick={cerrarModal}
                            >
                                Cerrar
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    )
}
