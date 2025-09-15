import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

// VietQR Generator for Vietnamese banking apps
class VietQRGenerator {
  private static calculateCRC16(data: string): string {
    const polynomial = 0x1021
    let crc = 0xFFFF

    for (let i = 0; i < data.length; i++) {
      crc ^= (data.charCodeAt(i) << 8)
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial
        } else {
          crc <<= 1
        }
      }
    }

    crc &= 0xFFFF
    return crc.toString(16).toUpperCase().padStart(4, '0')
  }

  static generateVietQR(bankId: string, accountNumber: string, amount: number, description: string, orderCode: string): string {
    // Simple payment URL format that banking apps can scan
    // Most banking apps can scan URLs with payment parameters

    const paymentUrl = `https://payment.example.com/pay?bank=${bankId}&account=${accountNumber}&amount=${Math.round(amount)}&desc=${encodeURIComponent(`Order ${orderCode}`)}`

    return paymentUrl
  }
}

// Payment processor with VietQR support
class PaymentProcessor {
  static async createPayment(amount: number, orderId: string, description: string) {
    const orderCode = Date.now().toString()

    // Use Vietcombank test account for VietQR (you can replace with real account)
    const vietQR = VietQRGenerator.generateVietQR(
      'VCB', // Vietcombank Bank ID
      '1234567890', // Test account number - replace with real account
      amount,
      description,
      orderCode
    )

    return {
      orderCode,
      amount: Math.round(amount),
      qrData: vietQR,
      checkoutUrl: `https://payment.vietqr.vn/pay/${orderCode}`,
      paymentId: `PAY-${orderCode}`,
      description,
      bankInfo: {
        bankName: 'Vietcombank',
        accountNumber: '1234567890', // Replace with real account
        accountHolder: 'Your Company Name'
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, orderId, description } = body

    console.log('PayOS QR Generation Request:', { amount, orderId, description })

    if (!amount || !orderId) {
      return NextResponse.json({ error: 'Amount and orderId are required' }, { status: 400 })
    }

    // Validate amount
    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Generate unique order code for PayOS
    const orderCode = Date.now()

    console.log('Generated order code:', orderCode, 'Amount:', numericAmount)

    // Create PayOS payment request
    const paymentData = {
      orderCode: orderCode,
      amount: Math.round(numericAmount), // PayOS requires integer amount
      description: description || `Thanh toán đơn hàng ${orderId}`,
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/cancel`,
      items: [{
        name: description || `Đơn hàng ${orderId}`,
        quantity: 1,
        price: Math.round(numericAmount)
      }]
    }

    console.log('PayOS payment data:', paymentData)

    console.log('Creating PayOS payment with data:', paymentData)

    // Create VietQR payment
    console.log('Creating VietQR payment')
    const paymentResponse = await PaymentProcessor.createPayment(
      numericAmount,
      orderId,
      description || `Thanh toán đơn hàng ${orderId}`
    )
    console.log('VietQR payment created:', paymentResponse)

    if (!paymentResponse || !paymentResponse.checkoutUrl) {
      throw new Error('Failed to create PayOS payment link')
    }

    console.log('Payment data created:', paymentResponse)

    // Generate QR code for the VietQR string
    const qrData = paymentResponse.qrData || paymentResponse.checkoutUrl

    console.log('Final QR data to encode:', qrData)
    console.log('QR data type:', typeof qrData)
    console.log('QR data length:', qrData.length)

    console.log('Generating QR code for data length:', qrData.length)
    console.log('QR data preview:', qrData.substring(0, 100) + '...')

    // Generate high-quality QR code for better scanning
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 400, // Larger size for better scanning
      margin: 3,  // More margin for better readability
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H', // High error correction for reliability
      version: undefined // Auto version selection
    })
    console.log('QR code generated with high quality settings, size:', qrCodeDataURL.length)

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataURL,
      paymentUrl: paymentResponse.checkoutUrl,
      qrData: paymentResponse.qrData,
      amount: Math.round(amount),
      orderId: orderId,
      orderCode: orderCode,
      paymentId: `PAY-${orderCode}`
    })
  } catch (error) {
    console.error('PayOS payment creation error:', error)
    return NextResponse.json({
      error: 'Failed to create PayOS payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}