@echo off
echo ======================================
echo Login automatico para Miguel Rodriguez
echo ======================================
echo.
echo Haciendo login...
curl -H "Content-Type: application/json" -d "{\"username\":\"miguel.rodriguez\",\"password\":\"miguel123\"}" http://localhost:3445/api/auth/login/admin
echo.
echo.
echo ======================================
echo Probando dashboard admin...
echo ======================================
echo.
curl -H "Authorization: Bearer %TOKEN%" http://localhost:3445/api/dashboard/admin | findstr "solicitudes_recientes.*PENDIENTE"
echo.
pause