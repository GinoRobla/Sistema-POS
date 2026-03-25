const { DataTypes } = require('sequelize');
const sequelize = require('../db/conexion');

// Define el modelo Sale para la tabla 'Sale'
const Sale = sequelize.define('Sale', {
    total: { type: DataTypes.FLOAT, allowNull: false },      // Monto total de la venta
    items: { type: DataTypes.TEXT, allowNull: false },       // Detalle de productos vendidos (JSON string)
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }    // Fecha y hora de la venta
}, {
    timestamps: false,           // No agrega columnas createdAt/updatedAt automáticamente
    freezeTableName: true,       // Usa el nombre 'Sale' tal cual, sin pluralizar
    indexes: [
        {
            fields: ['createdAt']  // Índice para optimizar consultas por fecha
        }
    ]
});

module.exports = { Sale };