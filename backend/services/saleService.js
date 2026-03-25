const { Product } = require('../models/Product');
const { Sale } = require('../models/Sale');
const { Op } = require('sequelize');

// 1. CREAR UNA NUEVA VENTA
async function crearVenta(datosVenta) {
    const { items, total } = datosVenta;
    if (!items.length) throw new Error('No hay productos en la venta');

    let errorStock = null;

    // Verificar stock y reducirlo
    for (const producto of items) {
        const productoEnDB = await Product.findByPk(producto.productId);
        if (!productoEnDB) {
            errorStock = new Error(`Producto con ID ${producto.productId} no existe`);
            break;
        }
        if (productoEnDB.stock < producto.quantity) {
            errorStock = new Error(`No hay suficiente stock de ${productoEnDB.name}. Stock disponible: ${productoEnDB.stock}`);
            break;
        }
        await productoEnDB.update({ stock: productoEnDB.stock - producto.quantity });
    }

    if (errorStock) throw errorStock;

    const now = new Date().toISOString();
    const venta = await Sale.create({
        total,
        items: JSON.stringify(items),
        createdAt: now
    });

    return { id: venta.id, total, items, createdAt: now };
}

// 2. OBTENER TODAS LAS VENTAS (más recientes primero) con paginación
async function obtenerTodasLasVentas(limit = 100, offset = 0) {
    // Limitar a máximo 1000 registros por solicitud para evitar sobrecargar el sistema
    const limiteSanitizado = Math.min(limit, 1000);

    const ventas = await Sale.findAll({
        order: [['createdAt', 'DESC']],
        limit: limiteSanitizado,
        offset: offset
    });

    const total = await Sale.count();

    return {
        ventas: ventas.map(v => ({ ...v.toJSON(), items: JSON.parse(v.items) })),
        total,
        limit: limiteSanitizado,
        offset
    };
}

// 3. OBTENER ESTADÍSTICAS COMPLETAS DE VENTAS
async function obtenerEstadisticas() {
    const ahora = new Date();
    
    // Usar zona horaria local para calcular el día actual
    const inicioDelDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const finDelDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);

    const diaActual = ahora.getDay();
    const diasHastaLunes = diaActual === 0 ? 6 : diaActual - 1;
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - diasHastaLunes);
    inicioSemana.setHours(0, 0, 0, 0);
    const inicioSemanaISO = inicioSemana.toISOString();

    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1).toISOString();
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999).toISOString();

    const ventasTotales = await Sale.count();
    const ingresosTotales = (await Sale.sum('total')) || 0;
    const ventasDeHoy = await Sale.count({ where: { createdAt: { [Op.between]: [inicioDelDia.toISOString(), finDelDia.toISOString()] } } });
    const ingresosDeHoy = (await Sale.sum('total', { where: { createdAt: { [Op.between]: [inicioDelDia.toISOString(), finDelDia.toISOString()] } } })) || 0;
    const ventasSemana = await Sale.count({ where: { createdAt: { [Op.gte]: inicioSemanaISO } } });
    const ingresosSemana = (await Sale.sum('total', { where: { createdAt: { [Op.gte]: inicioSemanaISO } } })) || 0;
    const ingresosMes = (await Sale.sum('total', { where: { createdAt: { [Op.gte]: inicioMes } } })) || 0;
    const ingresosMesAnterior = (await Sale.sum('total', { where: { createdAt: { [Op.between]: [inicioMesAnterior, finMesAnterior] } } })) || 0;

    const crecimiento = ingresosMesAnterior > 0
        ? ((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior * 100).toFixed(1)
        : 0;

    return {
        ventasTotales,
        ventasDeHoy,
        ventasSemana,
        ingresosTotales,
        ingresosDeHoy,
        ingresosSemana,
        ingresosMes,
        ingresosMesAnterior,
        crecimiento: parseFloat(crecimiento)
    };
}

// 4. OBTENER TOP PRODUCTOS MÁS VENDIDOS (optimizado)
async function obtenerTopProductos(limitVentas = 10000) {
    // Limitar análisis a las últimas X ventas para mejor rendimiento
    // En vez de cargar TODAS las ventas, solo analizamos las más recientes
    const ventas = await Sale.findAll({
        order: [['createdAt', 'DESC']],
        limit: limitVentas
    });

    const conteoProductos = {};

    ventas.forEach(venta => {
        const items = JSON.parse(venta.items);
        items.forEach(item => {
            if (!conteoProductos[item.productId]) {
                conteoProductos[item.productId] = { cantidad: 0, ingresos: 0 };
            }
            conteoProductos[item.productId].cantidad += item.quantity;
            conteoProductos[item.productId].ingresos += item.quantity * item.price;
        });
    });

    const ids = Object.keys(conteoProductos);
    if (!ids.length) return [];

    const productos = await Product.findAll({ where: { id: ids } });

    const productosConInfo = productos.map(p => ({
        id: p.id,
        name: p.name,
        cantidadVendida: conteoProductos[p.id].cantidad,
        ingresos: conteoProductos[p.id].ingresos
    }));

    return productosConInfo.sort((a, b) => b.cantidadVendida - a.cantidadVendida).slice(0, 5);
}

// 5. OBTENER UNA VENTA POR ID (optimizado)
async function obtenerVentaPorId(id) {
    const venta = await Sale.findByPk(id);
    if (!venta) throw new Error('Venta no encontrada');
    return { ...venta.toJSON(), items: JSON.parse(venta.items) };
}

// 6. OBTENER ESTADÍSTICAS POR RANGO DE FECHAS
async function obtenerEstadisticasPorFecha(fechaInicio, fechaFin) {
    const where = {};
    if (fechaInicio && fechaFin) where.createdAt = { [Op.between]: [fechaInicio, fechaFin] };
    else if (fechaInicio) where.createdAt = { [Op.gte]: fechaInicio };
    else if (fechaFin) where.createdAt = { [Op.lte]: fechaFin };

    const ventas = await Sale.findAll({ where });
    const totalVentas = ventas.length;
    const totalIngresos = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);

    return {
        ventasEnRango: totalVentas,
        ingresosEnRango: totalIngresos,
        fechaInicio: fechaInicio || 'Sin límite inicial',
        fechaFin: fechaFin || 'Sin límite final'
    };
}

module.exports = {
    crearVenta,
    obtenerTodasLasVentas,
    obtenerVentaPorId,
    obtenerEstadisticas,
    obtenerTopProductos,
    obtenerEstadisticasPorFecha
};