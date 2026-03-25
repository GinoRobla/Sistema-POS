// Importa la conexión Sequelize y el modelo Product
const sequelize = require('./conexion');
const { Product } = require('../models/Product');

// Array de productos de ejemplo para insertar en la base de datos
const productos = [
    { name: "Arroz 1kg", price: 1250.00, stock: 120, barcode: "7501000000001", image: null },
    { name: "Jugo de Durazno 1L", price: 1800.00, stock: 40, barcode: "7791000000006", image: null },
    { name: "Aceite de Girasol 900ml", price: 2100.00, stock: 35, barcode: "7501000000002", image: null },
    { name: "Leche Descremada 1L", price: 950.00, stock: 80, barcode: "7501000000003", image: null },
    { name: "Pan de Molde", price: 680.00, stock: 25, barcode: "7501000000004", image: null },
    { name: "Azúcar 1kg", price: 1100.00, stock: 60, barcode: "7501000000005", image: null },
    { name: "Café Instantáneo 100g", price: 3200.00, stock: 15, barcode: "7501000000006", image: null },
    { name: "Fideos Largos 500g", price: 820.00, stock: 90, barcode: "7501000000007", image: null },
    { name: "Atún en Lata", price: 1450.00, stock: 55, barcode: "7501000000008", image: null },
    { name: "Yogurt Natural 1L", price: 1300.00, stock: 30, barcode: "7501000000009", image: null },
    { name: "Galletas Dulces", price: 750.00, stock: 45, barcode: "7501000000010", image: null },
    { name: "Detergente 1L", price: 2800.00, stock: 20, barcode: "7501000000011", image: null },
    { name: "Shampoo 400ml", price: 1900.00, stock: 18, barcode: "7501000000012", image: null },
    { name: "Papel Higiénico x4", price: 1600.00, stock: 65, barcode: "7501000000013", image: null },
    { name: "Chocolate en Barra", price: 950.00, stock: 42, barcode: "7501000000014", image: null }
];

// Función principal para crear la tabla y poblarla con productos de ejemplo
async function crearTablaYSeed(callback) {
    try {
        await sequelize.sync(); // Crea la tabla Product si no existe
        // Inserta cada producto, evitando duplicados por barcode
        for (const producto of productos) {
            await Product.findOrCreate({ where: { barcode: producto.barcode }, defaults: producto });
        }
        console.log('✅ Productos de ejemplo insertados');
        if (callback) callback();
    } catch (err) {
        console.error('❌ Error en el seed de productos:', err.message);
        if (callback) callback();
    }
    // No cerrar la conexión aquí si hay callback, dejar que el callback lo maneje
    if (!callback) {
        await sequelize.close();
    }
}

// Si el archivo se ejecuta directamente, corre la función de seed
if (require.main === module) {
    crearTablaYSeed();
}

// Exporta la función para poder llamarla desde otros scripts si es necesario
module.exports = crearTablaYSeed;