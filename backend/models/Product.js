const { DataTypes } = require('sequelize');
const sequelize = require('../db/conexion');

// Define el modelo Product para la tabla 'Product'
const Product = sequelize.define('Product', {
    name: { type: DataTypes.STRING, allowNull: false },      // Nombre del producto
    price: { type: DataTypes.FLOAT, allowNull: false },      // Precio del producto
    stock: { type: DataTypes.INTEGER, allowNull: false },    // Stock disponible
    barcode: { type: DataTypes.STRING, unique: true },       // Código de barras único
    image: { type: DataTypes.STRING }                        // URL o nombre de imagen (opcional)
}, {
    timestamps: false,           // No agrega columnas createdAt/updatedAt automáticamente
    freezeTableName: true        // Usa el nombre 'Product' tal cual, sin pluralizar
});

module.exports = { Product };