import React from 'react'

// Componente reutilizable para filtros de fecha
const DateFilter = ({ 
    fechaDesde, 
    fechaHasta, 
    onFechaDesdeChange, 
    onFechaHastaChange,
    onLimpiar,
    onBuscar,
    showButtons = true,
    showClearButton = true,
    className = '',
    layout = 'horizontal' // 'horizontal' o 'vertical'
}) => {
    return (
        <div className={`date-filter-component ${className}`}>
            <div className={`date-inputs ${layout === 'vertical' ? 'vertical' : 'horizontal'}`}>
                <div className="input-group">
                    <label>Desde:</label>
                    <input
                        type="date"
                        value={fechaDesde}
                        min="2020-01-01"
                        max="2030-12-31"
                        onChange={(e) => onFechaDesdeChange(e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label>Hasta:</label>
                    <input
                        type="date"
                        value={fechaHasta}
                        min="2020-01-01"
                        max="2030-12-31"
                        onChange={(e) => onFechaHastaChange(e.target.value)}
                    />
                </div>
            </div>
            {showButtons && (
                <div className="date-buttons">
                    {onBuscar && (
                        <button 
                            onClick={onBuscar}
                            className="search-btn"
                            disabled={!fechaDesde && !fechaHasta}
                        >
                            Buscar
                        </button>
                    )}
                    {showClearButton && onLimpiar && (fechaDesde || fechaHasta) && (
                        <button 
                            onClick={onLimpiar}
                            className="clear-btn"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default DateFilter