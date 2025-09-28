# 🚀 Quick Start Guide - Deploy USIM Web

## ⚡ 5 phút để deploy lên production!

### **Bước 1: Chuẩn bị PayOS** (2 phút)
```bash
# Chạy script setup PayOS
cd usim-web
setup-payos.bat

# Nhập thông tin PayOS:
# - Client ID
# - API Key
# - Checksum Key
# - Environment: prod
```

### **Bước 2: Test local** (1 phút)
```bash
# Chạy ứng dụng local
npm run dev

# Test PayOS integration
start http://localhost:3000/api/test-payos
```

### **Bước 3: Deploy lên Vercel** (2 phút)
```bash
# Cài Vercel CLI (nếu chưa có)
npm install -g vercel

# Đăng nhập Vercel
vercel login

# Deploy
vercel --prod

# Vercel sẽ cung cấp URL preview
```

### **Bước 4: Cấu hình Domain** (2 phút)
1. Truy cập Vercel Dashboard
2. Vào Project Settings → Domains
3. Add domain: `daily.telebox.vn`
4. Copy DNS records
5. Paste vào domain provider (GoDaddy, Namecheap, etc.)

### **Bước 5: Cấu hình PayOS Production** (1 phút)
1. Vào [PayOS Dashboard](https://my.payos.vn)
2. Chuyển sang Production mode
3. Cập nhật Webhook URL: `https://daily.telebox.vn/api/webhook/payos`
4. Test thanh toán với số tiền nhỏ

---

## 🎯 Checklist nhanh

### ✅ Pre-deployment:
- [ ] PayOS credentials configured
- [ ] Local testing passed
- [ ] Vercel account ready
- [ ] Domain purchased

### ✅ Deployment:
- [ ] Vercel deployment successful
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] PayOS webhook updated

### ✅ Post-deployment:
- [ ] Test payment flow
- [ ] Verify webhook responses
- [ ] Check mobile compatibility
- [ ] Monitor first transactions

---

## 🆘 Troubleshooting

### **Lỗi thường gặp:**

#### **1. Build failed**
```bash
# Check lỗi chi tiết
npm run build

# Fix TypeScript errors
npm run type-check
```

#### **2. PayOS connection failed**
```bash
# Test PayOS config
curl http://localhost:3000/api/test-payos

# Check credentials in .env.local
```

#### **3. Domain not working**
```bash
# Check DNS propagation
nslookup daily.telebox.vn

# Wait 24-48 hours for DNS
```

#### **4. Webhook not receiving**
```bash
# Test webhook endpoint
curl -X POST https://daily.telebox.vn/api/webhook/payos \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

---

## 📞 Support

### **Cần giúp đỡ?**
1. **Check logs:** Vercel Dashboard → Functions → Logs
2. **PayOS issues:** support@payos.vn
3. **Vercel issues:** support@vercel.com
4. **Domain issues:** Contact domain provider

### **Useful links:**
- 📖 **Full Guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- 🔧 **PayOS Docs:** https://payos.vn/docs
- 🚀 **Vercel Docs:** https://vercel.com/docs
- 💳 **PayOS Dashboard:** https://my.payos.vn

---

## 🎉 Success!

Sau khi hoàn thành, website sẽ chạy tại: **https://daily.telebox.vn**

**Happy deploying! 🚀**