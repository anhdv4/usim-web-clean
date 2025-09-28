@echo off
echo 🚀 USIM Web - Google Cloud Deployment Script
echo ==========================================

:: Colors (Windows CMD doesn't support ANSI colors well, so we'll use plain text)

echo [INFO] Starting deployment process...

:: Check if gcloud is installed
gcloud version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] gcloud CLI is not installed. Please install it first:
    echo curl https://sdk.cloud.google.com ^| bash
    echo exec -l $SHELL
    pause
    exit /b 1
)

:: Check if user is logged in
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] You are not logged in to gcloud. Running login...
    gcloud auth login
)

:: Get project ID
for /f "tokens=*" %%i in ('gcloud config get-value project') do set PROJECT_ID=%%i
if "%PROJECT_ID%"=="" (
    echo [WARNING] No project set. Please enter your Google Cloud Project ID:
    set /p PROJECT_ID="Project ID: "
    gcloud config set project %PROJECT_ID%
)

echo [INFO] Using Google Cloud Project: %PROJECT_ID%

:: Enable required APIs
echo [INFO] Enabling required Google Cloud APIs...
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

:: Build the application
echo [INFO] Building Next.js application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build application
    pause
    exit /b 1
)
echo [SUCCESS] Application built successfully

:: Create Dockerfile if it doesn't exist
if not exist "Dockerfile" (
    echo [INFO] Creating Dockerfile...
    echo FROM node:18-alpine > Dockerfile
    echo. >> Dockerfile
    echo WORKDIR /app >> Dockerfile
    echo. >> Dockerfile
    echo # Copy package files >> Dockerfile
    echo COPY package*.json ./ >> Dockerfile
    echo RUN npm ci --only=production >> Dockerfile
    echo. >> Dockerfile
    echo # Copy built application >> Dockerfile
    echo COPY .next ./.next >> Dockerfile
    echo COPY public ./public >> Dockerfile
    echo COPY next.config.js ./ >> Dockerfile
    echo COPY package*.json ./ >> Dockerfile
    echo. >> Dockerfile
    echo # Expose port >> Dockerfile
    echo EXPOSE 3000 >> Dockerfile
    echo. >> Dockerfile
    echo # Start application >> Dockerfile
    echo CMD ["npm", "start"] >> Dockerfile
    echo [SUCCESS] Dockerfile created
)

:: Build and push Docker image
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set IMAGE_NAME=gcr.io/%PROJECT_ID%/usim-web:%TIMESTAMP%

echo [INFO] Building Docker image: %IMAGE_NAME%
docker build -t %IMAGE_NAME% .
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker image
    pause
    exit /b 1
)
echo [SUCCESS] Docker image built successfully

echo [INFO] Pushing Docker image to Google Container Registry...
docker push %IMAGE_NAME%
if %errorlevel% neq 0 (
    echo [ERROR] Failed to push Docker image
    pause
    exit /b 1
)
echo [SUCCESS] Docker image pushed successfully

:: Deploy to Cloud Run
echo [INFO] Deploying to Google Cloud Run...
for /f "tokens=*" %%i in ('gcloud run deploy usim-web --image %IMAGE_NAME% --platform managed --region asia-southeast1 --allow-unauthenticated --port 3000 --memory 1Gi --cpu 1 --max-instances 10 --set-env-vars "NODE_ENV=production" --format "value(status.url)"') do set SERVICE_URL=%%i

if %errorlevel% equ 0 (
    echo [SUCCESS] Deployment completed successfully!
    echo [SUCCESS] Your application is live at: %SERVICE_URL%
    echo.
    echo [INFO] Next steps:
    echo 1. Visit: %SERVICE_URL%
    echo 2. Test the application
    echo 3. Configure custom domain (optional)
    echo 4. Set up SSL certificate (optional)
    echo.
    echo [INFO] To view logs:
    echo gcloud logging read "resource.type=cloud_run_revision" --limit 50
) else (
    echo [ERROR] Deployment failed
    pause
    exit /b 1
)

echo [SUCCESS] 🎉 Deployment completed! Your USIM Web is now live on Google Cloud!
pause