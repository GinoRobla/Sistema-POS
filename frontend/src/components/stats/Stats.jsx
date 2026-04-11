import { useCallback, useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { useDateFilter } from '../../hooks/useDateFilter'
import {
    obtenerEstadisticas,
    obtenerTopProductos,
    obtenerEstadisticasPorFecha,
    obtenerProductosPocoStock,
    formatearDinero
} from '../../utils'
import DateFilter from '../common/DateFilter'
import Modal from '../common/Modal'
import '../common/DateFilter.css'
import './Stats.css'

export const Stats = () => {
    const [estadisticasRango, setEstadisticasRango] = useState(null)
    const [cargandoAnalisis, setCargandoAnalisis] = useState(false)
    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    })

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

    const dateFilter = useDateFilter({
        onValidationError: (error) => {
            mostrarModal(error.titulo, error.mensaje, error.tipo)
        },
        allowFutureDates: false
    })

    const { datos: estadisticas, cargando: cargandoStats, ejecutarPeticion } = useApi()
    const { datos: topProductos, ejecutarPeticion: ejecutarTop } = useApi()
    const { datos: productosPocoStock, ejecutarPeticion: ejecutarPoco } = useApi()

    const cargarDatos = useCallback(async () => {
        try {
            await ejecutarPeticion(obtenerEstadisticas)

            try {
                await ejecutarTop(obtenerTopProductos)
            } catch {
                mostrarModal('Advertencia', 'No se pudieron cargar los productos mas vendidos.', 'warning')
            }

            try {
                await ejecutarPoco(obtenerProductosPocoStock)
            } catch {
                mostrarModal('Advertencia', 'No se pudieron cargar los productos con poco stock.', 'warning')
            }
        } catch {
            mostrarModal(
                'Error al cargar datos',
                'No se pudieron cargar las estadisticas principales. Por favor, intenta nuevamente.',
                'error'
            )
        }
    }, [ejecutarPeticion, ejecutarPoco, ejecutarTop])

    useEffect(() => {
        const cargarDatosIniciales = async () => {
            try {
                await cargarDatos()
            } catch {
                mostrarModal(
                    'Error de conexion',
                    'No se pudieron cargar las estadisticas. Verifica tu conexion e intenta otra vez.',
                    'error'
                )
            }
        }

        cargarDatosIniciales()
    }, [cargarDatos])

    const analizarPeriodo = async () => {
        setCargandoAnalisis(true)

        try {
            const fechasAPI = dateFilter.prepararFechasParaAPI()

            if (!fechasAPI) {
                setCargandoAnalisis(false)
                return
            }

            if (!dateFilter.hayFiltrosActivos) {
                setEstadisticasRango(null)
                setCargandoAnalisis(false)
                return
            }

            if (fechasAPI.valido) {
                const datos = await obtenerEstadisticasPorFecha(fechasAPI.fechaDesde, fechasAPI.fechaHasta)
                setEstadisticasRango(datos)
            } else if (fechasAPI.fechaHasta) {
                const datos = await obtenerEstadisticasPorFecha(undefined, fechasAPI.fechaHasta)
                setEstadisticasRango(datos)
            } else {
                setEstadisticasRango(null)
            }
        } catch {
            mostrarModal(
                'Error al analizar periodo',
                'No se pudieron obtener las estadisticas del periodo seleccionado. Por favor, intenta nuevamente.',
                'error'
            )
            setEstadisticasRango(null)
        } finally {
            setCargandoAnalisis(false)
        }
    }

    const limpiarFiltros = () => {
        dateFilter.limpiarFiltros()
        setEstadisticasRango(null)
    }

    if (cargandoStats) {
        return <div className="feedback-panel">Cargando estadisticas...</div>
    }

    return (
        <div className="stats-container">
            <div className="header page-header">
                <h1 className="page-title">Estadisticas de Ventas</h1>
               
            </div>
            <div className="header-separator"></div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-content">
                        <h3>Hoy</h3>
                        <div className="stat-value">{formatearDinero(estadisticas?.ingresosDeHoy || 0)}</div>
                        <div className="stat-detail">{estadisticas?.ventasDeHoy || 0} ventas</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <h3>Esta Semana</h3>
                        <div className="stat-value">{formatearDinero(estadisticas?.ingresosSemana || 0)}</div>
                        <div className="stat-detail">{estadisticas?.ventasSemana || 0} ventas</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <h3>Este Mes</h3>
                        <div className="stat-value">{formatearDinero(estadisticas?.ingresosMes || 0)}</div>
                        <div className="stat-detail">
                            {estadisticas?.crecimiento !== undefined && (
                                <>
                                    {estadisticas.crecimiento > 0 ? '+' : ''}
                                    {Math.abs(estadisticas.crecimiento || 0)}% vs mes anterior
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <h3>Total</h3>
                        <div className="stat-value">{formatearDinero(estadisticas?.ingresosTotales || 0)}</div>
                        <div className="stat-detail">{estadisticas?.ventasTotales || 0} ventas totales</div>
                    </div>
                </div>
            </div>

            <div className="date-filter">
                <h2 className="date-filter-title">Analisis por Periodo</h2>
                <div className="date-filter-content">
                    <div className="date-inputs-center">
                        <DateFilter
                            fechaDesde={dateFilter.fechaDesde}
                            fechaHasta={dateFilter.fechaHasta}
                            onFechaDesdeChange={dateFilter.setFechaDesde}
                            onFechaHastaChange={dateFilter.setFechaHasta}
                            onBuscar={analizarPeriodo}
                            onLimpiar={limpiarFiltros}
                            showButtons={false}
                            className="stats-date-filter"
                        />
                    </div>
                    <div className="date-buttons">
                        <button
                            type="button"
                            onClick={analizarPeriodo}
                            className="search-btn"
                            disabled={cargandoAnalisis}
                        >
                            {cargandoAnalisis ? 'Analizando...' : 'Buscar'}
                        </button>
                        <button
                            type="button"
                            onClick={limpiarFiltros}
                            className="clear-btn"
                            disabled={cargandoAnalisis}
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>

                {estadisticasRango && (
                    <div className="range-results">
                        <div className="range-card">
                            <h4>
                                Resultados{dateFilter.textoRango ? ` ${dateFilter.textoRango}` : ' del periodo seleccionado'}
                            </h4>
                            <div className="range-stats">
                                <div className="range-stat">
                                    <span className="label">Total ventas:</span>
                                    <span className="value">{estadisticasRango.ventasEnRango}</span>
                                </div>
                                <div className="range-stat">
                                    <span className="label">Ingresos:</span>
                                    <span className="value">{formatearDinero(estadisticasRango.ingresosEnRango)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="content-columns">
                <div className="column">
                    <div className="section-card">
                        <h2>Top 5 Productos Mas Vendidos</h2>
                        <div className="products-list">
                            {topProductos?.length > 0 ? (
                                topProductos.map((producto, index) => (
                                    <div key={producto.id} className="product-item">
                                        <div className="product-rank">#{index + 1}</div>
                                        <div className="product-info">
                                            <h4>{producto.name}</h4>
                                            <div className="product-stats">
                                                <span>{producto.cantidadVendida} unidades</span>
                                                <span>{formatearDinero(producto.ingresos)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="feedback-panel feedback-panel-empty">No hay datos de productos vendidos</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="column">
                    <div className="section-card">
                        <h2>Productos con Poco Stock</h2>
                        <div className="low-stock-list">
                            {productosPocoStock?.length > 0 ? (
                                productosPocoStock.map((producto) => {
                                    let colorClass = ''

                                    if (producto.stock === 0 || producto.stock === 1) colorClass = 'no-stock'
                                    else if (producto.stock === 2 || producto.stock === 3) colorClass = 'orange-stock'
                                    else if (producto.stock === 4 || producto.stock === 5) colorClass = 'yellow-stock'
                                    else colorClass = 'low'

                                    return (
                                        <div key={producto.id} className={`stock-item ${colorClass}`}>
                                            <div className="stock-info">
                                                <h4>{producto.name}</h4>
                                                <div className="stock-level">
                                                    <span className="stock-label">
                                                        {producto.stock === 0
                                                            ? 'Sin stock disponible'
                                                            : producto.stock === 1
                                                                ? '1 unidad disponible'
                                                                : `${producto.stock} unidades disponibles`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="stock-price">
                                                {formatearDinero(producto.price)}
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="feedback-panel feedback-panel-empty">Todos los productos tienen stock suficiente</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
