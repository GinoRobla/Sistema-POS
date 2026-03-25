const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Preparando backend para empaquetado...');

const backendPath = path.join(__dirname, '..', 'backend');

// Verificar que exista el backend
if (!fs.existsSync(backendPath)) {
  console.error('Error: No se encuentra la carpeta backend');
  process.exit(1);
}

// Verificar que existan node_modules en el backend
const backendNodeModules = path.join(backendPath, 'node_modules');
if (!fs.existsSync(backendNodeModules)) {
  console.log('Instalando dependencias del backend...');
  try {
    execSync('npm install', {
      cwd: backendPath,
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Error al instalar dependencias del backend');
    process.exit(1);
  }
}

console.log('Backend preparado correctamente');
