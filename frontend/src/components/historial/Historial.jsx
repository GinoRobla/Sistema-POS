// ===== COMPONENTE HISTORIAL DE VENTAS =====
// Este componente muestra todas las ventas realizadas con filtros y detalles

import React, { useState, useEffect, useCallback } from 'react'
import './Historial.css'
import { useApi } from '../../hooks/useApi'
import { useDateFilter } from '../../hooks/useDateFilter'
import { obtenerVentas, obtenerProductos, formatearDinero, formatearFechaHora, contarProductos } from '../../utils'
import DateFilter from '../common/DateFilter'
import '../common/DateFilter.css'

export const Historial = () => {
    // 1. ESTADOS PRINCIPALES
    const [productos, setProductos] = useState([])   // Lista de productos para mostrar en el modal
    const [ventas, setVentas] = useState([])           // Lista de todas las ventas
    const [ventasFiltradas, setVentasFiltradas] = useState([]) // Ventas después de filtrar

    // 2. ESTADOS PARA PAGINACIÓN
    const [paginaActual, setPaginaActual] = useState(1) // Página actual
    const ventasPorPagina = 10                          // Cantidad de ventas por página

    // 3. ESTADOS PARA EL MODAL DE DETALLES
    const [mostrarModal, setMostrarModal] = useState(false)    // Si se muestra el modal
    const [ventaSeleccionada, setVentaSeleccionada] = useState(null) // Venta del modal

    // 4. HOOK PARA FILTRADO POR FECHAS
    const dateFilter = useDateFilter()

    // 5. HOOK PARA MANEJAR LLAMADAS AL BACKEND
    const { cargando, error, ejecutarPeticion, limpiarError } = useApi()

    // 4. FUNCIÓN PARA CARGAR TODAS LAS VENTAS DESDE EL BACKEND
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
        } catch (error) {
            setVentas([])
            setVentasFiltradas([])
            setProductos([])
        }
    }

    // 5. FUNCIÓN PARA LIMPIAR FILTROS
    const limpiarFiltros = () => {
        dateFilter.limpiarFiltros()
        setVentasFiltradas(ventas) // Mostrar todas las ventas
    }

    // 6. FUNCIÓN PARA ABRIR EL MODAL DE DETALLES
    const verDetalles = (venta) => {
        // Clonar la venta y agregar nombre y código a cada item si faltan
        const ventaConNombres = {
            ...venta,
            items: venta.items.map(item => {
                const prod = productos.find(p => p.id === item.productId);
                return {
                    ...item,
                    productName: item.productName || item.name || (prod ? prod.name : 'Producto sin nombre'),
                    barcode: item.barcode || (prod ? prod.barcode : '')
                };
            })
        };
        setVentaSeleccionada(ventaConNombres);
        setMostrarModal(true);
    }

    // 7. FUNCIÓN PARA CERRAR EL MODAL
    const cerrarModal = () => {
        setMostrarModal(false)
        setVentaSeleccionada(null)
    }

    // 8. FUNCIÓN PARA FILTRAR LAS VENTAS POR FECHAS
    const filtrarPorFecha = useCallback(() => {
        const ventasFiltradas = dateFilter.filtrarPorFecha(ventas)
        setVentasFiltradas(ventasFiltradas)

        // Resetear a la primera página cuando se aplican filtros
        setPaginaActual(1)
    }, [dateFilter.fechaDesde, dateFilter.fechaHasta, ventas, dateFilter.filtrarPorFecha])

    // 9. CALCULAR VENTAS PARA LA PÁGINA ACTUAL
    const calcularVentasPaginadas = () => {
        const indiceInicio = (paginaActual - 1) * ventasPorPagina
        const indiceFin = indiceInicio + ventasPorPagina
        return ventasFiltradas.slice(indiceInicio, indiceFin)
    }

    // 10. CALCULAR TOTAL DE PÁGINAS
    const totalPaginas = Math.ceil(ventasFiltradas.length / ventasPorPagina)

    // 11. FUNCIÓN PARA CAMBIAR DE PÁGINA
    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina)
        }
    }

    // 9. CARGAR VENTAS AL INICIAR EL COMPONENTE
    useEffect(() => {
        cargarVentasYProductos()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // 10. FILTRAR CUANDO CAMBIEN LAS FECHAS
    useEffect(() => {
        filtrarPorFecha()
    }, [dateFilter.fechaDesde, dateFilter.fechaHasta, ventas, filtrarPorFecha])

    return (
        <div className="historial-container">
            {/* 14. TÍTULO DE LA PÁGINA */}
            <div className="historial-header">
                <h1>Historial de Ventas</h1>
                <p>Consulta todas las ventas realizadas</p>
            </div>
            <div className="header-separator"></div>

            {/* 15. FILTROS POR FECHA */}
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
                        className="btn-limpiar"
                        onClick={limpiarFiltros}
                        disabled={!dateFilter.hayFiltrosActivos}
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {/* 16. MOSTRAR ERRORES */}
            {error && (
                <div className="error-mensaje">
                    {error}
                </div>
            )}

            {/* 17. MOSTRAR CARGANDO */}
            {cargando && (
                <div className="cargando">
                    Cargando ventas...
                </div>
            )}

            {/* 18. LISTA DE VENTAS */}
            {!cargando && !error && (
                <>
                    <div className="ventas-lista">
                        {ventasFiltradas.length === 0 ? (
                            <div className="sin-ventas">
                                No hay ventas para mostrar
                            </div>
                        ) : (
                            calcularVentasPaginadas().map(venta => (
                                <div key={venta.id} className="venta-card">
                                    <div className="venta-info">
                                        <div className="venta-fecha">
                                            {formatearFechaHora(venta.createdAt)}
                                        </div>
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
                                        className="btn-detalles"
                                        onClick={() => verDetalles(venta)}
                                    >
                                        Ver Detalles
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 19. PAGINACIÓN */}
                    {ventasFiltradas.length > 0 && totalPaginas > 1 && (
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
                </>
            )}

            {/* 20. MODAL DE DETALLES */}
            {mostrarModal && ventaSeleccionada && (
                <div className="modal-overlay" onClick={cerrarModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {/* Encabezado del modal */}
                        <div className="modal-header">
                            <h2>Detalles de la Venta</h2>
                            <button className="btn-cerrar" onClick={cerrarModal}>
                                x
                            </button>
                        </div>

                        {/* Información general de la venta */}
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

                        {/* Lista de productos comprados */}
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
                                                Código: {item.barcode || 'Sin código'}
                                            </div>
                                        </div>
                                        <div className="producto-detalles">
                                            <div className="producto-cantidad">
                                                Cantidad: {item.quantity}
                                            </div>
                                            <div className="producto-precio">
                                                Precio: {formatearDinero(item.price)}
                                            </div>
                                            <div className="producto-subtotal">
                                                Subtotal: {formatearDinero(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botón para cerrar */}
                        <div className="modal-footer">
                            <button className="btn-cerrar-modal" onClick={cerrarModal}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
