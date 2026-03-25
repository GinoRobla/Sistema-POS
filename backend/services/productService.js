// ===== SERVICIO DE PRODUCTOS =====

const { Product } = require('../models/Product');
const { Op } = require('sequelize');

// 1. OBTENER TODOS LOS PRODUCTOS (ordenados por nombre) con paginación
async function obtenerTodosLosProductos(limit = 100, offset = 0) {
    // Limitar a máximo 1000 registros por solicitud para evitar sobrecargar el sistema
    const limiteSanitizado = Math.min(limit, 1000);

    const productos = await Product.findAll({
        order: [['name', 'ASC']],
        limit: limiteSanitizado,
        offset: offset
    });

    const total = await Product.count();

    return {
        productos,
        total,
        limit: limiteSanitizado,
        offset
    };
}

// 2. BUSCAR UN PRODUCTO POR SU CÓDIGO DE BARRAS O ID
async function buscarProductoPorCodigo(codigo) {
    const producto = await Product.findOne({
        where: {
            [Op.or]: [
                { barcode: codigo },
                { id: codigo }
            ]
        }
    });
    if (!producto) throw new Error('Producto no encontrado');
    return producto;
}

// 3. BUSCAR PRODUCTOS POR NOMBRE O CÓDIGO
async function buscarProductos(textoBusqueda) {
    return await Product.findAll({
        where: {
            [Op.or]: [
                { name: { [Op.like]: `%${textoBusqueda}%` } },
                { barcode: { [Op.like]: `%${textoBusqueda}%` } }
            ]
        },
        order: [['name', 'ASC']]
    });
}

// 4. CREAR UN NUEVO PRODUCTO
async function crearProducto(datosProducto) {
    // Limpiar datos: convertir strings vacíos en null para campos opcionales
    const datosLimpios = { ...datosProducto };
    if (datosLimpios.barcode === '') datosLimpios.barcode = null;
    if (datosLimpios.image === '') datosLimpios.image = null;

    // Verificar si el código de barras ya existe (solo si no es null/vacío)
    if (datosLimpios.barcode) {
        const existe = await Product.findOne({ where: { barcode: datosLimpios.barcode } });
        if (existe) throw new Error('Ya existe un producto con ese código de barras');
    }
    const producto = await Product.create(datosLimpios);
    return producto;
}

// 5. ACTUALIZAR UN PRODUCTO COMPLETO
async function actualizarProducto(idProducto, datosActualizados) {
    const producto = await Product.findByPk(idProducto);
    if (!producto) throw new Error('Producto no encontrado');

    // Limpiar datos: convertir strings vacíos en null para campos opcionales
    const datosLimpios = { ...datosActualizados };
    if (datosLimpios.barcode === '') datosLimpios.barcode = null;
    if (datosLimpios.image === '') datosLimpios.image = null;

    // Verificar si el código de barras ya existe en otro producto (solo si no es null/vacío)
    if (datosLimpios.barcode && datosLimpios.barcode !== producto.barcode) {
        const existe = await Product.findOne({
            where: {
                barcode: datosLimpios.barcode,
                id: { [Op.ne]: idProducto }
            }
        });
        if (existe) throw new Error('Ya existe un producto con ese código de barras');
    }

    // Actualizar todos los campos proporcionados
    await producto.update(datosLimpios);
    return producto;
}

// 6. ACTUALIZAR SOLO EL STOCK DE UN PRODUCTO
async function actualizarStock(idProducto, nuevoStock) {
    const producto = await Product.findByPk(idProducto);
    if (!producto) throw new Error('Producto no encontrado');
    producto.stock = nuevoStock;
    await producto.save();
    return producto;
}

// 7. OBTENER PRODUCTOS CON POCO STOCK
async function obtenerProductosPocoStock(limite = 5) {
    return await Product.findAll({
        where: { stock: { [Op.lte]: limite } },
        order: [['stock', 'ASC'], ['name', 'ASC']]
    });
}

// 8. ELIMINAR UN PRODUCTO
async function eliminarProducto(idProducto) {
    const producto = await Product.findByPk(idProducto);
    if (!producto) throw new Error('Producto no encontrado');
    await producto.destroy();
    return { message: 'Producto eliminado correctamente' };
}

// 9. EXPORTAR TODAS LAS FUNCIONES PARA USAR EN OTROS ARCHIVOS
module.exports = {
    obtenerTodosLosProductos,
    buscarProductoPorCodigo,
    buscarProductos,
    crearProducto,
    actualizarProducto,
    actualizarStock,
    obtenerProductosPocoStock,
    eliminarProducto
};