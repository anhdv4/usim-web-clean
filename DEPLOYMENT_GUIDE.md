# 🚀 Hướng Dẫn Deploy USIM Web lên Google Cloud

## 📋 Tổng quan
Hướng dẫn triển khai ứng dụng USIM Web lên Google Cloud Platform (GCP) để test thực tế.

## 🎯 Chuẩn bị

### 1. Tài khoản Google Cloud
- Đăng ký tài khoản GCP: https://cloud.google.com
- Tạo project mới
- Kích hoạt billing

### 2. Cài đặt Google Cloud SDK
```bash
# Download và cài đặt gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Khởi tạo
gcloud init

# Đăng nhập
gcloud auth login
```

### 3. Kích hoạt APIs cần thiết
```bash
# App Engine
gcloud services enable appengine.googleapis.com

# Cloud Build
gcloud services enable cloudbuild.googleapis.com

# Container Registry (nếu dùng Docker)
gcloud services enable containerregistry.googleapis.com
```

## 📦 Phương án 1: Deploy với App Engine (Dễ nhất)

### Bước 1: Chuẩn bị project
```bash
# Tạo app.yaml
cat > app.yaml << EOF
runtime: nodejs18
env: standard

handlers:
- url: /.*
  script: auto
  secure: always

env_variables:
  NODE_ENV: production
  PAYPAL_CLIENT_ID: ${PAYPAL_CLIENT_ID}
  PAYPAL_CLIENT_SECRET: ${PAYPAL_CLIENT_SECRET}
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: ${PAYPAL_CLIENT_ID}
  PAYOS_CLIENT_ID: ${PAYOS_CLIENT_ID}
  PAYOS_API_KEY: ${PAYOS_API_KEY}
  PAYOS_CHECKSUM_KEY: ${PAYOS_CHECKSUM_KEY}
  PAYOS_ENV: production
EOF
```

### Bước 2: Build và deploy
```bash
# Build production
npm run build

# Deploy lên App Engine
gcloud app deploy --project YOUR_PROJECT_ID

# Mở ứng dụng
gcloud app browse
```

## 🐳 Phương án 2: Deploy với Cloud Run (Khuyên dùng)

### Bước 1: Tạo Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build ứng dụng
RUN npm run build

# Expose port
EXPOSE 3000

# Start ứng dụng
CMD ["npm", "start"]
```

### Bước 2: Build và push Docker image
```bash
# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/usim-web .

# Push lên Container Registry
docker push gcr.io/YOUR_PROJECT_ID/usim-web
```

### Bước 3: Deploy lên Cloud Run
```bash
gcloud run deploy usim-web \
  --image gcr.io/YOUR_PROJECT_ID/usim-web \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID},PAYPAL_CLIENT_SECRET=${PAYPAL_CLIENT_SECRET},NEXT_PUBLIC_PAYPAL_CLIENT_ID=${PAYPAL_CLIENT_ID},PAYOS_CLIENT_ID=${PAYOS_CLIENT_ID},PAYOS_API_KEY=${PAYOS_API_KEY},PAYOS_CHECKSUM_KEY=${PAYOS_CHECKSUM_KEY},PAYOS_ENV=production"
```

## 🌐 Phương án 3: Deploy với Compute Engine + Nginx

### Bước 1: Tạo VM instance
```bash
gcloud compute instances create usim-web \
  --zone asia-southeast1-a \
  --machine-type e2-medium \
  --image-family ubuntu-2204-lts \
  --image-project ubuntu-os-cloud \
  --boot-disk-size 20GB \
  --tags http-server,https-server
```

### Bước 2: Cài đặt Node.js và Nginx
```bash
# SSH vào VM
gcloud compute ssh usim-web --zone asia-southeast1-a

# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài đặt Nginx
sudo apt-get install nginx

# Cài đặt PM2
sudo npm install -g pm2
```

### Bước 3: Upload và chạy ứng dụng
```bash
# Upload code lên VM
gcloud compute scp --recurse . usim-web:~/usim-web --zone asia-southeast1-a

# SSH và setup
gcloud compute ssh usim-web --zone asia-southeast1-a

cd usim-web

# Install dependencies
npm install

# Build production
npm run build

# Start với PM2
pm2 start npm --name "usim-web" -- start
pm2 startup
pm2 save
```

### Bước 4: Cấu hình Nginx
```bash
sudo nano /etc/nginx/sites-available/usim-web

# Thêm config:
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/usim-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Bảo mật và SSL

### 1. Tạo SSL Certificate với Let's Encrypt
```bash
# Cài đặt Certbot
sudo apt-get install certbot python3-certbot-nginx

# Tạo SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### 2. Cấu hình Firewall
```bash
# Mở port 80 và 443
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --target-tags http-server

gcloud compute firewall-rules create allow-https \
  --allow tcp:443 \
  --target-tags https-server
```

## 📊 Monitoring và Logging

### 1. App Engine Monitoring
```bash
# Xem logs
gcloud app logs read

# Xem metrics
gcloud app instances list
```

### 2. Cloud Run Monitoring
```bash
# Xem logs
gcloud logging read "resource.type=cloud_run_revision"

# Xem metrics
gcloud run services describe usim-web
```

## 🔧 Cấu hình Environment Variables

### Tạo file .env.production.local
```bash
# Production environment variables
NODE_ENV=production

# PayPal
PAYPAL_CLIENT_ID=ARvMhCqmKmADF8lE1oc_qex-ztX6MWN3QIJMLEzno2k7QtMyKGaTU71BBHEkD7YYb3XsBFh3WO0qZhm2
PAYPAL_CLIENT_SECRET=ELpZ3ZRpdI8o_NsCO89kkmpNNVTQR1DwmY8o_BbuAgoyjEFWK8Saw7mk-kdmT-ZpL0VpCGe6yvgQAcYY
NEXT_PUBLIC_PAYPAL_CLIENT_ID=ARvMhCqmKmADF8lE1oc_qex-ztX6MWN3QIJMLEzno2k7QtMyKGaTU71BBHEkD7YYb3XsBFh3WO0qZhm2

# PayOS
PAYOS_CLIENT_ID=55731c66-9cf3-4ddc-9782-29ae545a37df
PAYOS_API_KEY=c25e2373-ff67-4137-a176-d9429ce8ddb2
PAYOS_CHECKSUM_KEY=f460bd682769cf211e24bdb716fa005c01fcabb1148010d31cd8aa4d4dc57a8a
PAYOS_ENV=production

# Database (nếu cần)
DATABASE_URL=your_database_url

# USIM Automation
USIM_EMAIL=Anhdv@telebox.vn
USIM_PASSWORD=telebox@123
USIM_COOKIE=PHPSESSID=6b87ed7161a0fbf25942becf625bdef8
```

## 🚀 Quick Deploy Script

### Tạo script deploy.sh
```bash
#!/bin/bash

echo "🚀 Starting USIM Web deployment..."

# Build ứng dụng
echo "📦 Building application..."
npm run build

# Deploy lên Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy usim-web \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars-file .env.production.local

echo "✅ Deployment completed!"
echo "🌐 Your app is live at: $(gcloud run services describe usim-web --region asia-southeast1 --format 'value(status.url)')"
```

## 🧪 Test sau khi deploy

### 1. Test cơ bản
```bash
# Test homepage
curl https://your-app-url.com

# Test API
curl https://your-app-url.com/api/test-usim-automation \
  -H "Content-Type: application/json" \
  -d '{"productCode":"test","customerEmail":"test@example.com"}'
```

### 2. Test payment
- Truy cập: `https://your-app-url.com/products`
- Đăng nhập admin
- Chọn sản phẩm và test thanh toán

## 📞 Troubleshooting

### Lỗi thường gặp:

1. **Build failed**: Kiểm tra Node.js version và dependencies
2. **Environment variables**: Đảm bảo tất cả env vars được set
3. **SSL issues**: Kiểm tra SSL certificate
4. **CORS errors**: Cấu hình CORS trong Next.js

### Logs debugging:
```bash
# App Engine logs
gcloud app logs tail

# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

## 🎯 Khuyến nghị Production

1. **Use Cloud Run** cho dễ scale và maintain
2. **Enable SSL** với custom domain
3. **Setup monitoring** với Cloud Monitoring
4. **Backup strategy** cho database
5. **Security**: Restrict API keys và use IAM

---

**🎉 Chúc mừng! Website USIM Web của bạn đã sẵn sàng cho production!**

Bạn chọn phương án nào để deploy? Tôi sẽ hướng dẫn chi tiết hơn. 🚀