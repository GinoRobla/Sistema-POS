const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Rutas para productos
router.get('/', productController.getAllProducts);               // GET /api/products
router.get('/search', productController.searchProducts);         // GET /api/products/search?q=
router.get('/low-stock', productController.getLowStockProducts); // GET /api/products/low-stock
router.get('/barcode/:barcode', productController.getProductByBarcode); // GET /api/products/barcode/:barcode
router.get('/:id', productController.getProductById);            // GET /api/products/:id
router.post('/', productController.createProduct);               // POST /api/products
router.put('/:id', productController.updateProduct);             // PUT /api/products/:id
router.delete('/:id', productController.deleteProduct);          // DELETE /api/products/:id

module.exports = router;