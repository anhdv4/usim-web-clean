# PayOS Integration Guide

## Tổng quan
Hệ thống đã được tích hợp sẵn với PayOS để xử lý thanh toán. Tài liệu này hướng dẫn cách cấu hình và sử dụng đầy đủ tính năng PayOS.

## 1. Cấu hình PayOS

### 1.1 Đăng ký tài khoản PayOS
1. Truy cập https://payos.vn
2. Đăng ký tài khoản merchant
3. Lấy các thông tin sau từ dashboard PayOS:
   - Client ID
   - API Key
   - Checksum Key

### 1.2 Cấu hình biến môi trường
Cập nhật file `.env.local` với thông tin PayOS:

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your_client_id_here
PAYOS_API_KEY=your_api_key_here
PAYOS_CHECKSUM_KEY=your_checksum_key_here

# PayOS Webhook URL (cho production)
PAYOS_WEBHOOK_URL=https://yourdomain.com/api/webhook/payos

# PayOS Environment
PAYOS_ENV=sandbox
```

### 1.3 Cấu hình Webhook
1. Trong dashboard PayOS, cấu hình webhook URL:
   - Development: `http://localhost:3000/api/webhook/payos`
   - Production: `https://yourdomain.com/api/webhook/payos`

## 2. Quy trình thanh toán

### 2.1 Tạo đơn hàng
1. User chọn sản phẩm trên trang `/products`
2. Nhập thông tin liên hệ (email hoặc ICCID)
3. Hệ thống tạo đơn hàng và gọi API `/api/generate-qr`

### 2.2 Tạo link thanh toán
API `/api/generate-qr` sẽ:
- Tạo orderCode duy nhất
- Gọi PayOS API để tạo payment link
- Tạo QR code cho thanh toán
- Trả về thông tin cho frontend

### 2.3 Thanh toán
1. User quét QR code hoặc click vào link thanh toán
2. PayOS xử lý thanh toán qua các ngân hàng Việt Nam
3. PayOS gửi webhook về hệ thống khi thanh toán hoàn tất

### 2.4 Xử lý kết quả
1. Webhook `/api/webhook/payos` nhận kết quả
2. Cập nhật trạng thái đơn hàng trong `global.ordersStore`
3. User được chuyển hướng về trang success/cancel

## 3. API Endpoints

### 3.1 Tạo thanh toán
```
POST /api/generate-qr
Content-Type: application/json

{
  "amount": 24030,
  "orderId": "ORD-123456789",
  "description": "Thanh toán đơn hàng eSIM"
}
```

**Response:**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "paymentUrl": "https://my.payos.vn/payment/123456789",
  "amount": 24030,
  "orderId": "ORD-123456789",
  "orderCode": 123456789,
  "paymentId": "PAY-123456789"
}
```

### 3.2 Webhook xử lý thanh toán
```
POST /api/webhook/payos
X-PayOS-Signature: signature_hash
Content-Type: application/json

{
  "code": "00",
  "desc": "Thành công",
  "success": true,
  "data": {
    "orderCode": 123456789,
    "amount": 24030,
    "description": "Thanh toán đơn hàng eSIM",
    "transactionDateTime": "2025-01-09T10:30:00.000Z",
    "paymentLinkId": "payment_link_id",
    "code": "00",
    "desc": "Thành công"
  },
  "signature": "signature_hash"
}
```

## 4. Cấu trúc dữ liệu

### 4.1 Đơn hàng (Order)
```typescript
interface Order {
  id: string
  productName: string
  country: string
  duration: number
  price: number
  priceVND: number
  simType: 'esim' | 'physical'
  contactInfo: string
  orderDate: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  paymentId?: string
  orderCode?: number
}
```

### 4.2 Webhook Data
```typescript
interface PayOSWebhookData {
  code: string
  desc: string
  success: boolean
  data: {
    orderCode: number
    amount: number
    description: string
    accountNumber: string
    reference: string
    transactionDateTime: string
    paymentLinkId: string
    code: string
    desc: string
    counterAccountBankId?: string
    counterAccountBankName?: string
    counterAccountName?: string
    counterAccountNumber?: string
    virtualAccountName?: string
    virtualAccountNumber?: string
  }
  signature: string
}
```

## 5. Triển khai thực tế

### 5.1 Thay thế mock implementation
Trong file `/api/generate-qr/route.ts`, thay thế phần TODO bằng code thực:

```typescript
import { PayOS } from '@payos/node'

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID!,
  process.env.PAYOS_API_KEY!,
  process.env.PAYOS_CHECKSUM_KEY!
)

const paymentResponse = await payOS.createPaymentLink({
  orderCode: orderCode,
  amount: Math.round(amount),
  description: description,
  returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
  items: [{
    name: description,
    quantity: 1,
    price: Math.round(amount)
  }]
})
```

### 5.2 Thêm xác thực webhook
Trong file `/api/webhook/payos/route.ts`, thêm hàm xác thực signature:

```typescript
function verifyPayOSSignature(headers: Headers, data: PayOSWebhookData, checksumKey: string): boolean {
  const signature = headers.get('x-payos-signature')
  if (!signature) return false

  // Implement PayOS signature verification logic
  const expectedSignature = crypto
    .createHmac('sha256', checksumKey)
    .update(JSON.stringify(data))
    .digest('hex')

  return signature === expectedSignature
}
```

## 6. Testing

### 6.1 Test với PayOS Sandbox
1. Sử dụng credentials từ PayOS sandbox
2. Thực hiện thanh toán test
3. Kiểm tra webhook được gọi đúng

### 6.2 Test cases
- Thanh toán thành công
- Thanh toán thất bại
- Thanh toán bị hủy
- Webhook signature validation
- Order status updates

## 7. Bảo mật

### 7.1 Webhook Security
- Luôn xác thực signature của webhook
- Sử dụng HTTPS cho webhook URL
- Validate orderCode và amount

### 7.2 Environment Variables
- Không commit file `.env.local` vào git
- Sử dụng different credentials cho dev/prod
- Rotate API keys định kỳ

## 8. Troubleshooting

### 8.1 Lỗi thường gặp
1. **Invalid signature**: Kiểm tra CHECKSUM_KEY
2. **Order not found**: Kiểm tra orderCode mapping
3. **Payment failed**: Kiểm tra PayOS dashboard

### 8.2 Debug mode
Thêm logging để debug:
```typescript
console.log('PayOS Webhook:', webhookData)
console.log('Order found:', orderIndex)
```

## 9. Production Deployment

### 9.1 Checklist
- [ ] Cập nhật webhook URL production
- [ ] Sử dụng PayOS production credentials
- [ ] Enable webhook signature verification
- [ ] Test end-to-end payment flow
- [ ] Monitor webhook logs
- [ ] Set up error notifications

### 9.2 Monitoring
- Theo dõi tỷ lệ thành công thanh toán
- Monitor webhook response times
- Alert khi có lỗi thanh toán

## 10. Troubleshooting QR Code Issues

### 10.1 Tại sao QR code không quét được?

#### Nguyên nhân có thể:
1. **PayOS chưa được cấu hình đúng**
2. **Webhook URL chưa được thiết lập**
3. **Merchant account chưa được kích hoạt**
4. **App ngân hàng không hỗ trợ PayOS**

#### Giải pháp:
1. **Kiểm tra cấu hình PayOS:**
   - Đăng nhập PayOS dashboard
   - Kiểm tra merchant account status
   - Verify webhook URL configuration

2. **Cấu hình Webhook:**
   ```
   Development: http://localhost:3000/api/webhook/payos
   Production: https://yourdomain.com/api/webhook/payos
   ```

3. **Test với tài khoản PayOS khác:**
   - Tạo tài khoản PayOS riêng cho hệ thống này
   - Tránh xung đột với hệ thống khác

### 10.2 Sử dụng cùng PayOS credentials cho nhiều hệ thống

#### ⚠️ Lưu ý quan trọng:
- **Không nên** dùng cùng credentials cho nhiều hệ thống
- Có thể gây **xung đột webhook**
- **Order codes có thể trùng nhau**
- Thanh toán có thể bị **route sai**

#### Giải pháp:
1. **Tạo tài khoản PayOS riêng** cho mỗi hệ thống
2. **Sử dụng environment khác nhau:**
   ```env
   # Hệ thống 1
   PAYOS_CLIENT_ID=client_id_1
   PAYOS_API_KEY=api_key_1

   # Hệ thống 2
   PAYOS_CLIENT_ID=client_id_2
   PAYOS_API_KEY=api_key_2
   ```

### 10.3 Test QR code với dữ liệu thực

#### Cách test:
1. **Copy dữ liệu QR từ debug panel**
2. **Mở app ngân hàng** → **Quét QR** → **Nhập thủ công**
3. **Paste dữ liệu QR**
4. **Kiểm tra phản hồi từ PayOS**

#### Nếu vẫn lỗi:
- Kiểm tra **network connection**
- Verify **PayOS credentials**
- Check **webhook logs**
- Test với **app ngân hàng khác**

### 10.4 Cấu hình PayOS Dashboard

#### Bước thiết lập:
1. **Đăng nhập** https://my.payos.vn
2. **Vào Settings** → **Webhook**
3. **Thêm webhook URL:**
   ```
   URL: https://yourdomain.com/api/webhook/payos
   Events: payment.success, payment.cancel
   ```
4. **Lưu thay đổi**

#### Kiểm tra cấu hình:
- [ ] Webhook URL chính xác
- [ ] Events được chọn đúng
- [ ] Test webhook hoạt động
- [ ] Logs hiển thị webhook calls

## 10. Support

Nếu gặp vấn đề với tích hợp PayOS:
1. Kiểm tra PayOS documentation: https://payos.vn/docs
2. Contact PayOS support
3. Check application logs
4. Verify webhook configuration