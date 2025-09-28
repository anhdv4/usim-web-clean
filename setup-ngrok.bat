@echo off
echo ========================================
echo PayOS Webhook Setup with Ngrok
echo ========================================
echo.
echo This script will help you set up ngrok for PayOS webhook testing
echo.
echo Step 1: Download and install ngrok from https://ngrok.com
echo Step 2: Sign up for a free account
echo Step 3: Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken
echo.
echo After installing ngrok, run these commands:
echo.
echo 1. Authenticate ngrok:
echo    ngrok config add-authtoken YOUR_AUTH_TOKEN
echo.
echo 2. Start ngrok tunnel:
echo    ngrok http 3000
echo.
echo 3. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
echo.
echo 4. Update PayOS webhook URL:
echo    https://abc123.ngrok.io/api/webhook/payos
echo.
echo 5. Test the webhook:
echo    curl -X GET https://abc123.ngrok.io/api/webhook/payos
echo.
echo ========================================
echo Alternative: Use webhook.site for testing
echo ========================================
echo.
echo 1. Go to https://webhook.site
echo 2. Copy the unique URL
echo 3. Use that URL in PayOS webhook configuration
echo 4. Monitor webhook calls on webhook.site
echo.
pause