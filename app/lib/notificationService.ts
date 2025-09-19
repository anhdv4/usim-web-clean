import nodemailer from 'nodemailer'

interface OrderData {
  id: string
  productName: string
  country: string
  price: number
  priceVND: number
  contactInfo: string
  orderDate: string
}

class NotificationService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    // Use Gmail SMTP for sending emails
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    })
  }

  async sendPaymentSuccessNotification(orderData: OrderData): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized')
      return false
    }

    try {
      // Extract email from contact info
      const emailMatch = orderData.contactInfo.match(/Email:\s*([^\s]+)/)
      const customerEmail = emailMatch ? emailMatch[1] : null

      if (!customerEmail) {
        console.log('No email found in contact info, skipping notification')
        return false
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: customerEmail,
        subject: '🎉 Thanh toán thành công - Daily Telebox',
        html: this.generatePaymentSuccessEmail(orderData)
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Payment success email sent:', result.messageId)
      return true

    } catch (error) {
      console.error('Failed to send payment success notification:', error)
      return false
    }
  }

  private generatePaymentSuccessEmail(orderData: OrderData): string {
    const orderDate = new Date(orderData.orderDate).toLocaleString('vi-VN')

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thanh toán thành công</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .status { display: inline-block; padding: 5px 15px; background: #dcfce7; color: #166534; border-radius: 20px; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Thanh toán thành công!</h1>
            <p>Cảm ơn bạn đã tin tưởng Daily Telebox</p>
          </div>

          <div class="content">
            <h2>Xin chào!</h2>
            <p>Chúng tôi xác nhận thanh toán của bạn đã được xử lý thành công. Đơn hàng của bạn đang được xử lý.</p>

            <div class="order-details">
              <h3>📋 Chi tiết đơn hàng</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Mã đơn hàng:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${orderData.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Sản phẩm:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${orderData.productName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Quốc gia:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${orderData.country}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Số tiền:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${orderData.priceVND.toLocaleString()} VND</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Thời gian:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Trạng thái:</strong></td>
                  <td style="padding: 8px 0;"><span class="status">Đang xử lý</span></td>
                </tr>
              </table>
            </div>

            <h3>⏱️ Quy trình xử lý đơn hàng:</h3>
            <ol>
              <li>✅ <strong>Thanh toán thành công</strong> - Đã nhận thanh toán</li>
              <li>🔄 <strong>Đang xử lý</strong> - Kích hoạt eSIM/USIM</li>
              <li>📧 <strong>Gửi thông tin</strong> - Email hướng dẫn sử dụng (5-10 phút)</li>
            </ol>

            <p><strong>Lưu ý:</strong> Thông tin kích hoạt sẽ được gửi về email này trong vòng 5-10 phút. Vui lòng kiểm tra hộp thư đến và thư rác.</p>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <strong>📞 Cần hỗ trợ?</strong><br>
              Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ bộ phận hỗ trợ của chúng tôi.
            </div>
          </div>

          <div class="footer">
            <p>Trân trọng,<br><strong>Đội ngũ Daily Telebox</strong></p>
            <p style="margin-top: 10px; font-size: 12px; color: #999;">
              Email này được gửi tự động, vui lòng không trả lời trực tiếp.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

// Export singleton instance
export const notificationService = new NotificationService()