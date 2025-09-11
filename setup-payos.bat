@echo off
REM 🔧 PayOS Setup Script for Windows
REM Helps configure PayOS integration for the USIM web application

echo ==========================================
echo 🔧 PayOS Setup Script
echo ==========================================
echo.

set /p CLIENT_ID="Enter PayOS Client ID: "
set /p API_KEY="Enter PayOS API Key: "
set /p CHECKSUM_KEY="Enter PayOS Checksum Key: "
set /p ENVIRONMENT="Enter environment (sandbox/prod) [prod]: "

if "%ENVIRONMENT%"=="" set ENVIRONMENT=prod

echo.
echo [INFO] Creating .env.local file...

REM Create .env.local file
(
echo # PayOS Configuration
echo PAYOS_CLIENT_ID=%CLIENT_ID%
echo PAYOS_API_KEY=%API_KEY%
echo PAYOS_CHECKSUM_KEY=%CHECKSUM_KEY%
echo.
echo # PayOS Webhook URL
if "%ENVIRONMENT%"=="prod" (
    echo PAYOS_WEBHOOK_URL=https://daily.telebox.vn/api/webhook/payos
    echo NEXT_PUBLIC_BASE_URL=https://daily.telebox.vn
) else (
    echo PAYOS_WEBHOOK_URL=https://your-staging-domain.com/api/webhook/payos
    echo NEXT_PUBLIC_BASE_URL=https://your-staging-domain.com
)
echo.
echo # PayOS Environment
echo PAYOS_ENV=%ENVIRONMENT%
) > .env.local

echo [SUCCESS] .env.local file created successfully!
echo.
echo [INFO] PayOS configuration summary:
echo ==========================================
echo Client ID: %CLIENT_ID%
echo API Key: %API_KEY%
echo Checksum Key: %CHECKSUM_KEY%
echo Environment: %ENVIRONMENT%
echo ==========================================
echo.
echo [INFO] Next steps:
echo 1. Test the configuration: npm run dev
echo 2. Test PayOS integration: curl http://localhost:3000/api/test-payos
echo 3. For production, update webhook URL in PayOS dashboard
echo 4. Deploy using: deploy.bat prod
echo.
echo [WARNING] Keep your PayOS credentials secure and never commit to git!
echo.
pause