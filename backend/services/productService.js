// ===== SERVICIO DE PRODUCTOS =====

const { Product } = require('../models/Product');
const { Op } = require('sequelize');

function obtenerCodigosAlternativos(codigo) {
    const codigoTexto = String(codigo ?? '').trim();
    const codigoSinCeros = codigoTexto.replace(/^0+/, '');
    const codigoConCeroInicial = codigoTexto.length === 12 ? `0${codigoTexto}` : '';
    const codigoSinUltimoDigito = codigoTexto.length === 13 ? codigoTexto.slice(0, -1) : '';
    const codigoSinPrimerDigito = codigoTexto.length === 13 ? codigoTexto.slice(1) : '';

    return [...new Set([
        codigoTexto,
        codigoSinCeros,
        codigoConCeroInicial,
        codigoSinUltimoDigito,
        codigoSinPrimerDigito
    ].filter(Boolean))];
}

// 1. OBTENER TODOS LOS PRODUCTOS (ordenados por nombre) con paginaciÃ³n
async function obtenerTodosLosProductos(limit = 100, offset = 0) {
    // Limitar a mÃ¡ximo 1000 registros por solicitud para evitar sobrecargar el sistema
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

// 2. BUSCAR UN PRODUCTO POR SU CÃ“DIGO DE BARRAS O ID
async function buscarProductoPorCodigo(codigo) {
    const codigoTexto = String(codigo ?? '').trim();

    const producto = await Product.findOne({
        where: {
            [Op.or]: [
                { barcode: codigoTexto },
                { id: codigoTexto }
            ]
        }
    });

    if (producto) return producto;

    const codigosAlternativos = obtenerCodigosAlternativos(codigoTexto).filter(
        (codigoAlternativo) => codigoAlternativo !== codigoTexto
    );

    if (codigosAlternativos.length > 0) {
        const productoAlternativo = await Product.findOne({
            where: {
                barcode: {
                    [Op.in]: codigosAlternativos
                }
            }
        });

        if (productoAlternativo) return productoAlternativo;
    }

    throw new Error('Producto no encontrado');
}

// 3. BUSCAR PRODUCTOS POR NOMBRE O CÃ“DIGO
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
    // Limpiar datos: convertir strings vacÃ­os en null para campos opcionales
    const datosLimpios = { ...datosProducto };
    if (datosLimpios.barcode === '') datosLimpios.barcode = null;
    if (datosLimpios.image === '') datosLimpios.image = null;

    // Verificar si el cÃ³digo de barras ya existe (solo si no es null/vacÃ­o)
    if (datosLimpios.barcode) {
        const existe = await Product.findOne({ where: { barcode: datosLimpios.barcode } });
        if (existe) throw new Error('Ya existe un producto con ese cÃ³digo de barras');
    }
    const producto = await Product.create(datosLimpios);
    return producto;
}

// 5. ACTUALIZAR UN PRODUCTO COMPLETO
async function actualizarProducto(idProducto, datosActualizados) {
    const producto = await Product.findByPk(idProducto);
    if (!producto) throw new Error('Producto no encontrado');

    // Limpiar datos: convertir strings vacÃ­os en null para campos opcionales
    const datosLimpios = { ...datosActualizados };
    if (datosLimpios.barcode === '') datosLimpios.barcode = null;
    if (datosLimpios.image === '') datosLimpios.image = null;

    // Verificar si el cÃ³digo de barras ya existe en otro producto (solo si no es null/vacÃ­o)
    if (datosLimpios.barcode && datosLimpios.barcode !== producto.barcode) {
        const existe = await Product.findOne({
            where: {
                barcode: datosLimpios.barcode,
                id: { [Op.ne]: idProducto }
            }
        });
        if (existe) throw new Error('Ya existe un producto con ese cÃ³digo de barras');
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
