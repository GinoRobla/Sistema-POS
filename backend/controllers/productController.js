const productService = require('../services/productService');

const productController = {
    // Obtener todos los productos con paginación
    async getAllProducts(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;
            const products = await productService.obtenerTodosLosProductos(limit, offset);
            res.json(products);
        } catch (error) {
            console.error('Error en getAllProducts:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Obtener producto por ID
    async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await productService.buscarProductoPorCodigo(id);
            res.json(product);
        } catch (error) {
            console.error('Error en getProductById:', error);
            res.status(404).json({ message: error.message });
        }
    },

    // Obtener producto por código de barras
    async getProductByBarcode(req, res) {
        try {
            const { barcode } = req.params;
            const product = await productService.buscarProductoPorCodigo(barcode);
            res.json(product);
        } catch (error) {
            console.error('Error en getProductByBarcode:', error);
            res.status(404).json({ message: error.message });
        }
    },

    // Buscar productos
    async searchProducts(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ message: 'Query de búsqueda requerida' });
            }
            const products = await productService.buscarProductos(q);
            res.json(products);
        } catch (error) {
            console.error('Error en searchProducts:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Crear producto
    async createProduct(req, res) {
        try {
            const productData = req.body;
            const newProduct = await productService.crearProducto(productData);
            res.status(201).json(newProduct);
        } catch (error) {
            console.error('Error en createProduct:', error);
            res.status(400).json({ message: error.message });
        }
    },

    // Actualizar producto
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            console.log('📝 Actualizando producto ID:', id);
            console.log('📝 Datos recibidos:', updateData);
            const updatedProduct = await productService.actualizarProducto(id, updateData);
            res.json(updatedProduct);
        } catch (error) {
            console.error('❌ Error en updateProduct:', error.message);
            console.error('Stack:', error.stack);
            res.status(400).json({ message: error.message });
        }
    },

    // Eliminar producto - Función simplificada
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            await productService.eliminarProducto(id);
            res.json({ message: 'Producto eliminado correctamente' });
        } catch (error) {
            console.error('Error en deleteProduct:', error);
            res.status(404).json({ message: error.message });
        }
    },

    // Obtener productos con stock bajo - Función simplificada
    async getLowStockProducts(req, res) {
        try {
            const products = await productService.obtenerProductosPocoStock(5);
            res.json(products);
        } catch (error) {
            console.error('Error en getLowStockProducts:', error);
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = productController;