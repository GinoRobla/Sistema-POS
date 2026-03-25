// Importa la clase Sequelize para manejar la conexión y los modelos
const { Sequelize } = require('sequelize');
// Importa path para construir rutas de archivos de forma segura
const path = require('path');

// Configuración con SQLite
const dbPath = path.join(__dirname, '..', 'data', 'sistema-pos.db');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

// Exporta la instancia para usarla en modelos y servicios
module.exports = sequelize;