# Manual de Aplicación de Escritorio - Sistema de Ventas

Este manual explica cómo usar, empaquetar, distribuir y licenciar la aplicación de escritorio del Sistema de Ventas.

## Tabla de Contenidos
1. [Desarrollo Local](#desarrollo-local)
2. [Crear Instalador](#crear-instalador)
3. [Sistema de Licencias](#sistema-de-licencias)
4. [Instalar en PC del Negocio](#instalar-en-pc-del-negocio)
5. [Base de Datos](#base-de-datos)
6. [Solución de Problemas](#solución-de-problemas)
7. [Desinstalación](#desinstalación)
8. [Checklist para Distribución](#checklist-para-distribución)

---

## Desarrollo Local

### Requisitos previos
- Node.js 16 o superior instalado
- Git Bash o terminal

### Pasos para desarrollo

1. **Instalar todas las dependencias:**
   ```bash
   # En la raíz del proyecto
   npm install

   # En el backend
   cd backend
   npm install
   cd ..

   # En el frontend
   cd frontend
   npm install
   cd ..
   ```

2. **Ejecutar en modo desarrollo:**
   ```bash
   # Terminal 1: Iniciar backend
   cd backend
   npm run dev

   # Terminal 2: Iniciar frontend
   cd frontend
   npm run dev

   # Terminal 3: Iniciar Electron
   npm run electron:dev
   ```

---

## Crear Instalador

### Paso 1: Preparar el proyecto

Asegúrate de que todos los archivos estén actualizados y funcionando correctamente.

### Paso 2: Instalar dependencias (si es necesario)

```bash
# Solo la primera vez o después de cambios en package.json
npm install                 # Raíz (Electron)
cd backend && npm install  # Backend
cd ../frontend && npm install  # Frontend
cd ..
```

### Paso 3: Ejecutar el comando de empaquetado

**Opción A: Script automatizado (Windows)**
```bash
# Desde la raíz del proyecto
build-installer.bat
```

**Opción B: Comando npm**
```bash
# Desde la raíz del proyecto
npm run dist
```

### Proceso de Build (Lo que sucede internamente):

1. **`npm run build:frontend`**
   - Compila React con Vite → crea carpeta `/dist/`
   - Contiene: index.html, assets/, imágenes

2. **`npm run prepare:backend`**
   - Instala SOLO dependencias de producción del backend
   - Ejecuta: `npm install --production` en `/backend/`
   - Elimina devDependencies para reducir tamaño
   - Resultado: backend/node_modules con solo 5 paquetes necesarios

3. **`electron-builder`**
   - Empaqueta `electron-main.js` y `/dist/` en el archivo asar
   - Copia `/backend/` completo (con node_modules) a extraResources
   - Crea el instalador NSIS para Windows
   - Resultado: `release/Sistema de Ventas Setup 1.0.0.exe`

### Paso 4: Ubicar el instalador

El instalador se generará en la carpeta `release/`:

```
Sistema ventas/
└── release/
    ├── Sistema de Ventas Setup 1.0.0.exe  ← INSTALADOR
    ├── win-unpacked/  (versión sin comprimir)
    └── builder-*.yml  (logs de build)
```

**Este es el archivo que distribuirás a tus clientes.**

### Nota Técnica: Estructura del instalador

```
Sistema de Ventas.exe (aplicación instalada)
├── resources/
│   ├── app.asar  (Electron + Frontend compilado)
│   └── app/
│       └── backend/  (Backend completo con node_modules)
└── Sistema de Ventas.exe (ejecutable)
```

---

## Sistema de Licencias

El sistema usa licencias por máquina con vencimiento configurable. Cada PC tiene un ID único y la clave solo funciona en esa PC.

### Conceptos clave

| Término | Descripción |
|---------|-------------|
| **Machine ID** | Identificador único de la PC del cliente (ej: `A1B2-C3D4-E5F6`) |
| **Clave de activación** | `AAAAA-BBBBB-CCCCC-DDDDD\|YYYY-MM-DD` — firmada con HMAC y con fecha de vencimiento |
| **keygen.html** | Herramienta local (solo tuya) para generar claves. **No se distribuye con el .exe** |

---

### Flujo completo de venta a un cliente nuevo

```
1. Cliente instala el .exe
2. La app muestra la pantalla de activación con su Machine ID
3. Cliente te manda el Machine ID por WhatsApp
4. Vos abrís keygen.html en tu PC
5. Ingresás el Machine ID y elegís el vencimiento
6. keygen.html genera la clave → se la mandás al cliente
7. Cliente ingresa la clave → sistema activado ✅
```

---

### Generar una clave de activación

1. **Abrir `keygen.html`** en tu navegador (doble clic sobre el archivo)

2. **Pegar el Machine ID del cliente** en el campo correspondiente

3. **Seleccionar el vencimiento:**
   - `1 mes` / `3 meses` / `6 meses` / `1 año` — suscripción mensual
   - `Pago único` — vence en ~100 años (nunca en la práctica)

4. **Hacer clic en "Generar clave"**

5. **Copiar la clave** (formato: `AAAAA-BBBBB-CCCCC-DDDDD|2026-04-11`) y mandársela al cliente por WhatsApp

> **Importante:** Guardá el `keygen.html` en un lugar seguro. Si lo perdés, no podés generar nuevas claves ni renovaciones.

---

### Renovación de licencia

Cuando la licencia del cliente vence:

1. La app vuelve a mostrar la pantalla de activación automáticamente
2. El cliente te avisa → vos generás una nueva clave con nueva fecha
3. El cliente la ingresa y sigue usando el sistema

No hay que reinstalar nada — el proceso es el mismo que la activación inicial.

---

### Dónde se guarda la licencia

La licencia activada se guarda en:
```
[carpeta de instalación]\resources\app\backend\data\license.json
```

Si necesitás desactivar una licencia (por cambio de PC, fraude, etc.), eliminá ese archivo y la app volverá a pedir activación.

---

## Instalar en PC del Negocio

### Requisitos del Sistema
- **Sistema Operativo:** Windows 7 o superior
- **Espacio en disco:** 500 MB mínimo
- **RAM:** 2 GB mínimo (4 GB recomendado)
- **NO requiere Node.js instalado** ✅
- **NO requiere internet para funcionar** ✅

### Proceso de Instalación

1. **Copiar el instalador:**
   - Copia `Sistema de Ventas Setup 1.0.0.exe` a una USB
   - Llévalo a la PC del negocio

2. **Ejecutar el instalador:**
   - Doble clic en el archivo `.exe`
   - Windows puede mostrar una advertencia (es normal para aplicaciones no firmadas)
   - Click en "Más información" → "Ejecutar de todas formas"

3. **Seguir el asistente:**
   - Elegir la carpeta de instalación (por defecto está bien)
   - Seleccionar "Crear acceso directo en escritorio" ✅
   - Click en "Instalar"

4. **Primera ejecución:**
   - Al abrir por primera vez aparece la **pantalla de activación de licencia**
   - El cliente ve su **Machine ID** (ej: `A1B2-C3D4-E5F6`) — debe mandártelo
   - Vos generás la clave con `keygen.html` y se la enviás
   - El cliente ingresa la clave → sistema desbloqueado
   - La base de datos SQLite se crea automáticamente en el primer inicio

### Usar la Aplicación

- **Icono en el escritorio:** Doble click para abrir
- **Menú inicio:** Buscar "Sistema de Ventas"
- **Cierre:** Simplemente cierra la ventana (X)

---

## Base de Datos

### Ubicación de la base de datos

La base de datos SQLite se guarda dentro de la carpeta de instalación:
```
[carpeta de instalación]\resources\app\backend\data\sistema-pos.db
```

Por defecto (instalación de usuario):
```
C:\Users\[Usuario]\AppData\Local\Programs\Sistema de Ventas\resources\app\backend\data\sistema-pos.db
```

### Respaldo de datos

**IMPORTANTE:** Para hacer respaldo de los datos:

1. Localiza el archivo `sistema-pos.db`
2. Copia este archivo a un USB o nube
3. Para restaurar: reemplaza el archivo en la misma ubicación

**Script de respaldo automático (Opcional):**

Puedes crear un archivo `.bat` para hacer respaldo automático:

```batch
@echo off
set FECHA=%date:~-4,4%%date:~-7,2%%date:~-10,2%
set ORIGEN=%APPDATA%\sistema-ventas\backend\data\sistema-pos.db
set DESTINO=D:\Respaldos\sistema-pos-%FECHA%.db

copy "%ORIGEN%" "%DESTINO%"
echo Respaldo completado: %DESTINO%
pause
```

Guarda este archivo como `respaldo.bat` y ejecútalo cuando quieras hacer un respaldo.

---

## Solución de Problemas

### La aplicación no abre

1. **Verificar que el instalador terminó correctamente**
   - Reinstalar si es necesario

2. **Verificar que el puerto 3001 esté libre**
   - Cerrar otras aplicaciones que puedan usar este puerto
   - Reiniciar la computadora

3. **Ver logs de error:**
   - Presiona `Ctrl + Shift + I` dentro de la aplicación para abrir DevTools
   - Buscar errores en la consola

### Problemas con la licencia

**"Clave incorrecta para esta máquina":**
- El Machine ID que usaste para generar la clave no coincide con el de la PC
- Pedí el Machine ID nuevamente desde la pantalla de activación y regenerá la clave

**"La clave ha vencido":**
- Generá una nueva clave con `keygen.html` con una fecha de vencimiento nueva

**La pantalla de activación aparece aunque ya fue activado:**
- El archivo `license.json` fue eliminado o la instalación cambió
- Generá una nueva clave para el mismo Machine ID

**El cliente cambió de PC:**
- El Machine ID nuevo es diferente — el cliente debe mandarte el nuevo ID
- Generá una clave nueva para la nueva PC

---

### La base de datos no se crea

1. Verificar permisos de escritura en la carpeta AppData
2. Ejecutar la aplicación como administrador (click derecho → "Ejecutar como administrador")

### Error al escanear códigos de barras

1. Verificar que el escáner esté configurado como teclado USB
2. Probar en un campo de texto normal (Notepad) primero
3. Reiniciar la aplicación

### Actualizar la aplicación

1. Desinstalar la versión anterior:
   - Panel de Control → Programas → Desinstalar "Sistema de Ventas"

2. Instalar la nueva versión:
   - Ejecutar el nuevo instalador
   - **La base de datos se mantiene intacta** ✅

---

## Desinstalación

Para desinstalar la aplicación:

1. Panel de Control → Programas y características
2. Buscar "Sistema de Ventas"
3. Click derecho → Desinstalar

**NOTA:** La base de datos NO se elimina automáticamente. Si quieres eliminarla también:
```
C:\Users\[Usuario]\AppData\Roaming\sistema-ventas\
```

---

## Personalización

### Cambiar el icono

Ver instrucciones en `ICONO.md`

### Cambiar el nombre de la aplicación

Editar `package.json`:
```json
{
  "build": {
    "productName": "Mi Tienda POS"
  }
}
```

### Cambiar el puerto del servidor

Crear archivo `backend/.env`:
```
PORT=3001
```

---

## Soporte Técnico

Si encuentras problemas:
1. Revisar esta documentación
2. Revisar los logs de error (DevTools)
3. Contactar al desarrollador

---

## Checklist para Distribución

Antes de entregar la aplicación al cliente:

**Preparación:**
- [ ] Generar el instalador con `npm run dist` o `build-installer.bat`
- [ ] Probar la instalación en una PC limpia
- [ ] Verificar que aparece la pantalla de activación en el primer inicio

**Activación:**
- [ ] Obtener el Machine ID del cliente
- [ ] Generar la clave con `keygen.html`
- [ ] Verificar que la clave activa correctamente el sistema

**Funcionalidad:**
- [ ] Verificar que todos los módulos funcionen (Ventas, Inventario, Estadísticas, Historial)
- [ ] Probar el escaneo de códigos de barras
- [ ] Crear productos de prueba
- [ ] Realizar ventas de prueba
- [ ] Verificar que las estadísticas se muestren correctamente

**Entrega:**
- [ ] Copiar el `.exe` en USB (carpeta `release/`)
- [ ] Anotar la fecha de vencimiento de la licencia del cliente
- [ ] Capacitar al usuario en el uso básico
- [ ] Acordar proceso de renovación cuando venza la licencia

---

## Problemas Corregidos en la Configuración

### Versión 1.0.0 - Limpieza de Producción (Enero 2026)

**Problemas identificados y solucionados:**

1. ✅ **Configuración de electron-builder contradictoria**
   - **Problema:** El backend se empaquetaba incorrectamente causando errores en producción
   - **Causa:** `files`, `extraResources` y `asarUnpack` tenían configuración conflictiva
   - **Solución:** Se simplificó usando solo `extraResources` para el backend

2. ✅ **node_modules del backend no se copiaban**
   - **Problema:** El filtro excluía node_modules en producción
   - **Causa:** `filter: ["!node_modules"]` en extraResources
   - **Solución:** Se removió el filtro para incluir las dependencias de producción

3. ✅ **PostgreSQL innecesario en dependencias**
   - **Problema:** Se instalaba PostgreSQL aunque solo se usa SQLite
   - **Solución:** Se removió `pg` de backend/package.json

4. ✅ **Archivos vacíos problemáticos**
   - **Problema:** Archivos vacíos (build, node, npm, vite, cd) causaban conflictos
   - **Causa:** Errores en ejecución de scripts batch
   - **Solución:** Eliminados y agregados a .gitignore

### Configuración actual de empaquetado:

```json
{
  "build": {
    "files": [
      "electron-main.js",    // Solo el proceso principal
      "dist/**/*"            // Solo el frontend compilado
    ],
    "extraResources": [
      {
        "from": "backend",   // Copia TODO el backend
        "to": "app/backend", // Incluyendo node_modules
        "filter": ["**/*", "!.env", "!.env.*"]
      }
    ]
  }
}
```

### Flujo de producción correcto:

1. Frontend compilado → empaquetado en app.asar
2. Backend completo → copiado a resources/app/backend
3. electron-main.js → carga backend desde resources/app/backend
4. Todo funciona correctamente ✅

### Desarrollo vs Producción:

| Aspecto | Desarrollo | Producción |
|---------|-----------|------------|
| Frontend | Vite dev server (http://localhost:5173) | Archivos estáticos en dist/ |
| Backend | Carpeta backend/ local | resources/app/backend |
| node_modules | Todas las dependencias | Solo producción (5 paquetes) |
| Base de datos | backend/data/ | %APPDATA%/sistema-ventas/backend/data/ |
| DevTools | Abierto automáticamente | Cerrado (Ctrl+Shift+I para abrir) |

---

**Última actualización:** Abril 2026
**Versión:** 1.0.0
