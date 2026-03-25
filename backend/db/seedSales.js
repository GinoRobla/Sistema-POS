// Importa la conexión Sequelize y los modelos Sale y Product
const sequelize = require('./conexion');
const { Sale } = require('../models/Sale');
const { Product } = require('../models/Product');

// Función principal para crear la tabla y poblarla con ventas de ejemplo
async function crearTablaYSeed(callback) {
    try {
        await sequelize.sync(); // Crea las tablas Sale y Product si no existen

        // Obtiene todos los productos para asociar ventas
        const productos = await Product.findAll();
        if (!productos.length) {
            console.log('⚠️ No hay productos. Ejecuta primero el seed de productos');
            return;
        }

        // Genera 15 ventas con productos y fechas aleatorias
        for (let i = 0; i < 15; i++) {
            // Selecciona productos aleatorios para la venta (1 a 10 productos por venta)
            const numItems = Math.floor(Math.random() * 10) + 1;
            const items = [];
            let total = 0;

            for (let j = 0; j < numItems; j++) {
                const producto = productos[Math.floor(Math.random() * productos.length)];
                const quantity = Math.floor(Math.random() * 4) + 1; // 1 a 4 unidades
                const subtotal = producto.price * quantity;
                
                items.push({
                    productId: producto.id,
                    productName: producto.name,
                    barcode: producto.barcode,
                    price: producto.price,
                    quantity: quantity,
                    subtotal: subtotal
                });
                
                total += subtotal;
            }

            // Calcula fecha aleatoria en los últimos 30 días
            const diasAntes = Math.floor(Math.random() * 30);
            const fechaVenta = new Date();
            fechaVenta.setDate(fechaVenta.getDate() - diasAntes);
            fechaVenta.setHours(
                Math.floor(Math.random() * 10) + 9, // Hora entre 9 y 18
                Math.floor(Math.random() * 60), // Minutos aleatorios
                0, 0
            );

            // Inserta la venta en la base de datos
            await Sale.create({
                total: total,
                items: JSON.stringify(items),
                createdAt: fechaVenta.toISOString()
            });
        }
        console.log('✅ Seed de ventas insertado correctamente');
        if (callback) callback();
    } catch (err) {
        console.error('❌ Error en el seed de ventas:', err.message);
        if (callback) callback();
    }
    // Solo cerrar la conexión si no hay callback
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