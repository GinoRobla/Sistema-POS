@echo off
echo ====================================
echo Sistema de Ventas - Build Installer
echo ====================================
echo.

echo [1/5] Instalando dependencias principales...
call npm install
if errorlevel 1 goto error

echo.
echo [2/5] Instalando dependencias del backend...
cd backend
call npm install
if errorlevel 1 goto error
cd ..

echo.
echo [3/5] Instalando dependencias del frontend...
cd frontend
call npm install
if errorlevel 1 goto error
cd ..

echo.
echo [4/5] Construyendo aplicacion...
call npm run build:all
if errorlevel 1 goto error

echo.
echo [5/5] Creando instalador...
call npm run electron:build
if errorlevel 1 goto error

echo.
echo ====================================
echo BUILD COMPLETADO!
echo ====================================
echo.
echo El instalador esta en: release\
echo Archivo: Sistema de Ventas Setup 1.0.0.exe
echo.
pause
goto end

:error
echo.
echo ====================================
echo ERROR EN EL BUILD
echo ====================================
echo.
pause
exit /b 1

:end
