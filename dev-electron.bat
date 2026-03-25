@echo off
echo ====================================
echo Sistema de Ventas - Modo Desarrollo
echo ====================================
echo.

:: Verificar e instalar dependencias si no existen
if not exist "node_modules" (
    echo Instalando dependencias principales...
    call npm install
    echo.
)

if not exist "backend\node_modules" (
    echo Instalando dependencias del backend...
    cd backend
    call npm install
    cd ..
    echo.
)

if not exist "frontend\node_modules" (
    echo Instalando dependencias del frontend...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo Iniciando servicios...
echo.

:: Iniciar backend en segundo plano
start /B cmd /c "cd backend && npm run dev"
echo [1/3] Backend iniciado...

:: Esperar 3 segundos
timeout /t 3 /nobreak >nul

:: Iniciar frontend en segundo plano
start /B cmd /c "cd frontend && npm run dev"
echo [2/3] Frontend iniciado...

:: Esperar 5 segundos para que Vite compile
timeout /t 5 /nobreak >nul

:: Iniciar Electron
echo [3/3] Abriendo aplicacion Electron...
echo.
call npm run electron:dev

echo.
echo Aplicacion cerrada.
pause
