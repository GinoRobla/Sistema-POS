import React, { forwardRef } from 'react';
import { formatearDinero, formatearFechaHora } from '../../utils';
import './TicketVenta.css';

// Componente para mostrar el ticket de venta (simple y profesional)
const TicketVenta = forwardRef(({ venta }, ref) => {
    if (!venta) return null;
    return (
        <div ref={ref} className="ticket-venta">
            <div className="ticket-header">
                <div className="ticket-title">Ticket de Venta</div>
                <div className="ticket-fecha">{formatearFechaHora(venta.createdAt)}</div>
            </div>
            <div className="ticket-linea" />
            <div>
                {venta.productos.map((producto, idx) => (
                    <div key={idx} className="ticket-producto">
                        <div className="ticket-producto-nombre">{producto.name}</div>
                        <div className="ticket-producto-detalle">
                            <span>Cant: {producto.quantity} x {formatearDinero(producto.price)}</span>
                            <span>{formatearDinero(producto.price * producto.quantity)}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="ticket-linea" />
            <div className="ticket-total">
                Total: {formatearDinero(venta.total)}
            </div>
            <div className="ticket-footer">
                ¡Gracias por su compra!
            </div>
        </div>
    );
});

export default TicketVenta;
