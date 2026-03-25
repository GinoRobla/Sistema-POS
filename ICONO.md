# Instrucciones para agregar icono a la aplicación

Para agregar un icono personalizado a la aplicación de escritorio:

1. **Crear o descargar un icono:**
   - Necesitas dos archivos:
     - `icon.png` (256x256 o 512x512 píxeles) para el icono de la ventana
     - `icon.ico` (formato .ico de Windows) para el instalador

2. **Coloca los archivos en la raíz del proyecto:**
   ```
   Sistema ventas/
   ├── icon.png
   ├── icon.ico
   └── ...
   ```

3. **Herramientas para crear iconos:**
   - Online: https://convertio.co/es/png-ico/
   - Sube tu imagen PNG y descarga el archivo .ico

## Icono por defecto

Si no agregas un icono personalizado, Electron usará el icono por defecto.
La aplicación funcionará perfectamente sin un icono personalizado.
