const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');

// Rutas para ventas - Las rutas más específicas van primero
router.get('/stats/top-products', saleController.getTopProducts);     // GET /api/sales/stats/top-products
router.get('/stats/date-range', saleController.getStatsByDateRange);  // GET /api/sales/stats/date-range
router.get('/stats', saleController.getSalesStats);                   // GET /api/sales/stats
router.get('/', saleController.getAllSales);                          // GET /api/sales
router.get('/:id', saleController.getSaleById);                       // GET /api/sales/:id
router.post('/', saleController.createSale);                          // POST /api/sales

module.exports = router;