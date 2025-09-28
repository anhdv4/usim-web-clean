# 🚀 Hướng Dẫn Thiết Lập Domain Custom: daily.telebox.vn

## 📋 Tổng quan
Hướng dẫn thiết lập domain `daily.telebox.vn` cho ứng dụng USIM Web trên Google Cloud Run.

## ✅ Điều Kiện Đã Đủ

### 1. Middleware Đã Cấu Hình
- ✅ File `middleware.ts` đã có logic redirect
- ✅ Domain `daily.telebox.vn` đã được cấu hình
- ✅ Logic chống redirect loop đã có

### 2. SSL Certificate
- ✅ Google Cloud Run tự động cấp SSL certificate
- ✅ Không cần cấu hình thủ công

## 🔧 Các Bước Thiết Lập Domain

### Bước 1: Truy Cập Google Cloud Console
```
1. Mở: https://console.cloud.google.com/run/domains
2. Chọn project: usim-web-project
3. Click "Add Mapping"
```

### Bước 2: Cấu Hình Domain
```
Domain: daily.telebox.vn
Service: usim-web
Region: asia-southeast1
```

### Bước 3: Thiết Lập DNS Records

Sau khi click "Continue", Google sẽ cung cấp DNS records cần thiết:

#### Record CNAME:
```
Type: CNAME
Name: daily
Value: ghs.googlehosted.com
TTL: 300 (hoặc mặc định)
```

### Bước 4: Cập Nhật DNS Tại Domain Registrar

#### Với Namecheap/GoDaddy/Porkbun:
```
1. Đăng nhập vào tài khoản domain
2. Vào DNS Management
3. Thêm CNAME record:
   - Host: daily
   - Value: ghs.googlehosted.com
   - TTL: 300
```

#### Với Cloudflare:
```
1. Vào DNS settings
2. Add record:
   - Type: CNAME
   - Name: daily
   - Target: ghs.googlehosted.com
   - TTL: Auto
```

## ⏱️ Thời Gian Chờ

### Sau Khi Cập Nhật DNS:
- **DNS Propagation**: 5-15 phút
- **SSL Certificate**: 15-30 phút
- **Domain Active**: 30-60 phút

## 🧪 Kiểm Tra Domain

### Test 1: DNS Resolution
```bash
nslookup daily.telebox.vn
# Should return: ghs.googlehosted.com
```

### Test 2: HTTP Access
```bash
curl -I https://daily.telebox.vn
# Should return 200 OK
```

### Test 3: Browser Test
```
1. Mở: https://daily.telebox.vn
2. Should redirect to: https://usim-web-xxxxxx-as.a.run.app
3. Should show login page
```

## 🔍 Troubleshooting

### Lỗi 1: DNS Not Propagated
```
✅ Giải pháp: Đợi 15-30 phút
✅ Kiểm tra: nslookup daily.telebox.vn
```

### Lỗi 2: SSL Certificate Pending
```
✅ Giải pháp: Đợi 15-30 phút
✅ Kiểm tra: Browser shows "Connection is secure"
```

### Lỗi 3: Redirect Loop
```
✅ Kiểm tra middleware.ts
✅ Đảm bảo logic chống loop hoạt động
```

### Lỗi 4: Domain Not Found
```
✅ Kiểm tra DNS records
✅ Đảm bảo CNAME record đúng
✅ Đợi DNS propagation
```

## 📊 Monitoring Domain

### Google Cloud Console:
```
1. Cloud Run → Services → usim-web
2. Tab "Domain mappings"
3. Check status: Active/Pending
```

### Logs:
```bash
gcloud logging read "resource.type=cloud_run_revision" \
  --filter="resource.labels.service_name=usim-web" \
  --limit=10
```

## 🎯 Kết Quả Mong Đợi

### Khi Domain Hoạt Động:
```
✅ https://daily.telebox.vn → Redirect to Cloud Run
✅ SSL certificate tự động
✅ SEO friendly URL
✅ Professional branding
```

### User Experience:
```
1. User truy cập: daily.telebox.vn
2. Tự động redirect đến Cloud Run URL
3. Hiển thị trang login Telebox
4. Sau login → Countries page
5. Chọn country → Products filtered
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. **Check DNS**: `nslookup daily.telebox.vn`
2. **Check SSL**: Browser developer tools
3. **Check logs**: Google Cloud Logging
4. **Contact**: Cung cấp error details

---

**🎉 Chúc mừng! Domain daily.telebox.vn sẽ sớm hoạt động!**