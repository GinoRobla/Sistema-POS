# 📖 Documentación API - Sistema POS

> **Documentación completa de la API RESTful del Sistema de Punto de Venta**

## 📋 Tabla de Contenidos

- [Información General](#información-general)
- [Base URL](#base-url)
- [Modelos de Datos](#modelos-de-datos)
- [Endpoints de Productos](#endpoints-de-productos)
- [Endpoints de Ventas](#endpoints-de-ventas)
- [Endpoints de Estadísticas](#endpoints-de-estadísticas)
- [Códigos de Respuesta](#códigos-de-respuesta)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## 📊 Información General

**Versión:** 1.0  
**Formato de respuesta:** JSON  
**Autenticación:** No requerida  
**CORS:** Habilitado para desarrollo local  
**Base de Datos:** SQLite local  

---

## 🌐 Base URL

```
http://localhost:3001/api
```

---

## 🗄️ Modelos de Datos

### 📦 Product (Producto)

```json
{
  "id": "INTEGER (Primary Key, Auto-increment)",
  "name": "STRING (Requerido) - Nombre del producto",
  "price": "FLOAT (Requerido) - Precio unitario",
  "stock": "INTEGER (Requerido) - Cantidad disponible",
  "barcode": "STRING (Único, Opcional) - Código de barras",
  "image": "STRING (Opcional) - URL/path de imagen"
}
```

### 🛍️ Sale (Venta)

```json
{
  "id": "INTEGER (Primary Key, Auto-increment)",
  "total": "FLOAT (Requerido) - Monto total de la venta",
  "items": "TEXT (Requerido) - JSON string con productos vendidos",
  "createdAt": "DATE (Auto) - Fecha y hora de la venta"
}
```

### 📝 Sale Items (Estructura de items)

```json
[
  {
    "productId": "INTEGER - ID del producto",
    "name": "STRING - Nombre del producto",
    "price": "FLOAT - Precio unitario",
    "quantity": "INTEGER - Cantidad vendida"
  }
]
```

---

## 📦 Endpoints de Productos

### 🔍 **GET** `/products`
Obtiene todos los productos

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Coca Cola 500ml",
    "price": 2.5,
    "stock": 50,
    "barcode": "12345678901",
    "image": "coca-cola.jpg"
  }
]
```

---

### 🔍 **GET** `/products/:id`
Obtiene un producto específico por ID

**Parámetros:**
- `id` (INTEGER) - ID del producto

**Respuesta exitosa:**
```json
{
  "id": 1,
  "name": "Coca Cola 500ml",
  "price": 2.5,
  "stock": 50,
  "barcode": "12345678901",
  "image": "coca-cola.jpg"
}
```

**Respuesta error (404):**
```json
{
  "error": "Producto no encontrado"
}
```

---

### 🔎 **GET** `/products/search?q={query}`
Busca productos por nombre

**Query Parameters:**
- `q` (STRING) - Término de búsqueda (busca en el nombre)

**Ejemplo:**
```
GET /api/products/search?q=coca
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Coca Cola 500ml",
    "price": 2.5,
    "stock": 50,
    "barcode": "12345678901",
    "image": "coca-cola.jpg"
  }
]
```

---

### 🏷️ **GET** `/products/barcode/:barcode`
Busca producto por código de barras

**Parámetros:**
- `barcode` (STRING) - Código de barras

**Ejemplo:**
```
GET /api/products/barcode/12345678901
```

**Respuesta exitosa:**
```json
{
  "id": 1,
  "name": "Coca Cola 500ml",
  "price": 2.5,
  "stock": 50,
  "barcode": "12345678901",
  "image": "coca-cola.jpg"
}
```

---

### ⚠️ **GET** `/products/low-stock`
Obtiene productos con stock bajo (≤10 unidades)

**Respuesta:**
```json
[
  {
    "id": 3,
    "name": "Pan de molde",
    "price": 3.2,
    "stock": 5,
    "barcode": "98765432101",
    "image": "pan.jpg"
  }
]
```

---

### ➕ **POST** `/products`
Crea un nuevo producto

**Body (JSON):**
```json
{
  "name": "Producto Nuevo",
  "price": 10.5,
  "stock": 100,
  "barcode": "11111111111",
  "image": "producto.jpg"
}
```

**Respuesta exitosa (201):**
```json
{
  "id": 15,
  "name": "Producto Nuevo",
  "price": 10.5,
  "stock": 100,
  "barcode": "11111111111",
  "image": "producto.jpg"
}
```

**Respuesta error (400):**
```json
{
  "error": "Descripción del error de validación"
}
```

---

### ✏️ **PUT** `/products/:id`
Actualiza un producto existente

**Parámetros:**
- `id` (INTEGER) - ID del producto

**Body (JSON):**
```json
{
  "name": "Nombre Actualizado",
  "price": 12.0,
  "stock": 80,
  "barcode": "22222222222",
  "image": "nueva-imagen.jpg"
}
```

**Respuesta exitosa:**
```json
{
  "id": 1,
  "name": "Nombre Actualizado",
  "price": 12.0,
  "stock": 80,
  "barcode": "22222222222",
  "image": "nueva-imagen.jpg"
}
```

---

### 🗑️ **DELETE** `/products/:id`
Elimina un producto

**Parámetros:**
- `id` (INTEGER) - ID del producto

**Respuesta exitosa (200):**
```json
{
  "message": "Producto eliminado exitosamente"
}
```

**Respuesta error (404):**
```json
{
  "error": "Producto no encontrado"
}
```

---

## 🛍️ Endpoints de Ventas

### 📋 **GET** `/sales`
Obtiene todas las ventas (ordenadas por fecha, más recientes primero)

**Respuesta:**
```json
[
  {
    "id": 1,
    "total": 12.5,
    "items": [
      {
        "productId": 1,
        "name": "Coca Cola 500ml",
        "price": 2.5,
        "quantity": 5
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### 🔍 **GET** `/sales/:id`
Obtiene una venta específica por ID

**Parámetros:**
- `id` (INTEGER) - ID de la venta

**Respuesta exitosa:**
```json
{
  "id": 1,
  "total": 12.5,
  "items": [
    {
      "productId": 1,
      "name": "Coca Cola 500ml",
      "price": 2.5,
      "quantity": 5
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 💰 **POST** `/sales`
Crea una nueva venta

**Body (JSON):**
```json
{
  "items": [
    {
      "productId": 1,
      "name": "Coca Cola 500ml",
      "price": 2.5,
      "quantity": 2
    },
    {
      "productId": 2,
      "name": "Pan de molde",
      "price": 3.2,
      "quantity": 1
    }
  ],
  "total": 8.2
}
```

**Respuesta exitosa (201):**
```json
{
  "id": 25,
  "total": 8.2,
  "items": [
    {
      "productId": 1,
      "name": "Coca Cola 500ml",
      "price": 2.5,
      "quantity": 2
    },
    {
      "productId": 2,
      "name": "Pan de molde",
      "price": 3.2,
      "quantity": 1
    }
  ],
  "createdAt": "2024-01-15T14:22:00.000Z"
}
```

**Respuesta error (400):**
```json
{
  "error": "No hay suficiente stock de Pan de molde. Stock disponible: 0"
}
```

---

## 📊 Endpoints de Estadísticas

### 📈 **GET** `/sales/stats`
Obtiene estadísticas generales de ventas

**Respuesta:**
```json
{
  "ventasTotales": 156,
  "ventasDeHoy": 8,
  "ventasSemana": 42,
  "ingresosTotales": 2340.50,
  "ingresosDeHoy": 125.30,
  "ingresosSemana": 680.75,
  "ingresosMes": 1450.20,
  "ingresosMesAnterior": 1200.00,
  "crecimiento": 20.8
}
```

**Explicación de campos:**
- `ventasTotales`: Total de ventas realizadas
- `ventasDeHoy`: Ventas del día actual
- `ventasSemana`: Ventas desde el lunes de la semana actual
- `ingresosTotales`: Suma total de todas las ventas
- `ingresosDeHoy`: Ingresos del día actual
- `ingresosSemana`: Ingresos desde el lunes actual
- `ingresosMes`: Ingresos del mes actual
- `ingresosMesAnterior`: Ingresos del mes anterior
- `crecimiento`: Porcentaje de crecimiento vs mes anterior

---

### 🏆 **GET** `/sales/stats/top-products`
Obtiene los 5 productos más vendidos

**Respuesta:**
```json
[
  {
    "id": 1,
    "name": "Coca Cola 500ml",
    "cantidadVendida": 145,
    "ingresos": 362.5
  },
  {
    "id": 3,
    "name": "Pan de molde",
    "cantidadVendida": 89,
    "ingresos": 284.8
  }
]
```

---

### 📅 **GET** `/sales/stats/date-range?fechaInicio={start}&fechaFin={end}`
Obtiene estadísticas por rango de fechas

**Query Parameters:**
- `fechaInicio` (STRING, Opcional) - Fecha inicio (YYYY-MM-DD)
- `fechaFin` (STRING, Opcional) - Fecha fin (YYYY-MM-DD)

**Ejemplo:**
```
GET /api/sales/stats/date-range?fechaInicio=2024-01-01&fechaFin=2024-01-31
```

**Respuesta:**
```json
{
  "ventasEnRango": 45,
  "ingresosEnRango": 580.75,
  "fechaInicio": "2024-01-01",
  "fechaFin": "2024-01-31"
}
```

**Sin parámetros:**
Si no se proporcionan fechas, devuelve estadísticas de todas las ventas.

---

## 🚦 Códigos de Respuesta

| Código | Significado | Descripción |
|--------|-------------|-------------|
| **200** | OK | Solicitud exitosa |
| **201** | Created | Recurso creado exitosamente |
| **400** | Bad Request | Error en los datos enviados |
| **404** | Not Found | Recurso no encontrado |
| **500** | Internal Server Error | Error interno del servidor |

---

## 💡 Ejemplos de Uso

### 🔍 Buscar producto para escaneo

```javascript
// Buscar por código de barras
fetch('/api/products/barcode/12345678901')
  .then(response => response.json())
  .then(product => {
    if (product.id) {
      // Producto encontrado, agregar al carrito
      console.log('Producto:', product.name);
    } else {
      console.log('Producto no encontrado');
    }
  });
```

### 🛒 Realizar una venta

```javascript
const venta = {
  items: [
    { productId: 1, name: "Coca Cola", price: 2.5, quantity: 2 },
    { productId: 2, name: "Pan", price: 3.2, quantity: 1 }
  ],
  total: 8.2
};

fetch('/api/sales', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(venta)
})
.then(response => response.json())
.then(result => {
  if (result.id) {
    console.log('Venta realizada:', result.id);
  } else {
    console.error('Error:', result.error);
  }
});
```

### 📊 Obtener estadísticas del día

```javascript
fetch('/api/sales/stats')
  .then(response => response.json())
  .then(stats => {
    console.log(`Hoy: $${stats.ingresosDeHoy}`);
    console.log(`Ventas: ${stats.ventasDeHoy}`);
  });
```

### 🔎 Búsqueda de productos

```javascript
// Buscar por nombre
fetch('/api/products/search?q=coca')
  .then(response => response.json())
  .then(products => {
    console.log('Productos encontrados:', products.length);
  });
```

### ⚠️ Verificar stock bajo

```javascript
fetch('/api/products/low-stock')
  .then(response => response.json())
  .then(products => {
    if (products.length > 0) {
      console.log('⚠️ Productos con poco stock:', products);
    }
  });
```

---

## 🔧 Notas Técnicas

### 📅 Manejo de Fechas
- Las fechas se almacenan en UTC
- El cálculo de "esta semana" va desde el lunes de la semana actual
- Los filtros de fecha son inclusivos

### 🏷️ Códigos de Barras
- Pueden ser cualquier string único
- Se valida unicidad a nivel de base de datos
- Compatible con lectores EAN-13, UPC-A, Code 128, etc.

### 💾 Gestión de Stock
- Se reduce automáticamente al realizar una venta
- Se valida disponibilidad antes de crear la venta
- El stock no puede ser negativo

### 🔍 Búsquedas
- La búsqueda por nombre es case-insensitive
- Utiliza LIKE SQL con wildcards automáticos
- Los resultados se ordenan por relevancia

---

**📖 Documentación API v1.0 - Sistema POS**  
*Actualizada: Enero 2025*