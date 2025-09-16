import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

// Import PayOS SDK - the SDK handles signature calculation internally
let PayOS: any
try {
  PayOS = require('@payos/node').PayOS
} catch (error) {
  console.warn('PayOS SDK not available, will use manual API calls')
}

// Initialize PayOS SDK if available and env vars exist
const payOS = PayOS && process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY
  ? new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    )
  : null

// PayOS payment link creator using SDK (preferred) or manual API
async function createPayOSPaymentLink(paymentData: any) {
  // Try SDK first if available
  if (payOS && payOS.createPaymentLink) {
    try {
      console.log('Using PayOS SDK for payment creation')
      const result = await payOS.createPaymentLink(paymentData)
      console.log('PayOS SDK Response:', result)
      return result
    } catch (error) {
      console.error('PayOS SDK failed, falling back to manual API:', error)
    }
  }

  // Fallback to manual API call
  console.log('Using manual PayOS API call')
  const isSandbox = process.env.PAYOS_ENV === 'sandbox'
  const url = isSandbox
    ? 'https://api-merchant-sandbox.payos.vn/v2/payment-requests'
    : 'https://api-merchant.payos.vn/v2/payment-requests'

  const requestBody = {
    orderCode: paymentData.orderCode,
    amount: paymentData.amount,
    description: paymentData.description,
    returnUrl: paymentData.returnUrl,
    cancelUrl: paymentData.cancelUrl,
    items: paymentData.items,
    signature: '' // Will be calculated
  }

  // PayOS signature calculation - JSON of request body without signature
  const { signature, ...bodyWithoutSignature } = requestBody
  const signatureData = JSON.stringify(bodyWithoutSignature)

  const crypto = require('crypto')
  requestBody.signature = crypto
    .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY!)
    .update(signatureData, 'utf8')
    .digest('hex')

  console.log('PayOS signature calculation:', {
    bodyWithoutSignature: JSON.parse(signatureData),
    signatureData,
    signature: requestBody.signature
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': process.env.PAYOS_CLIENT_ID!,
      'x-api-key': process.env.PAYOS_API_KEY!
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('PayOS API Error:', response.status, errorText)
    throw new Error(`PayOS API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log('PayOS API Response:', result)

  return result
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

    // Create PayOS payment request - use localhost for testing
    const paymentData = {
      orderCode: orderCode,
      amount: Math.round(numericAmount), // PayOS requires integer amount
      description: description || `Thanh toán đơn hàng ${orderId}`,
      returnUrl: `http://localhost:3000/payment/success`,
      cancelUrl: `http://localhost:3000/payment/cancel`,
      items: [{
        name: description || `Đơn hàng ${orderId}`,
        quantity: 1,
        price: Math.round(numericAmount)
      }]
    }

    console.log('PayOS payment data:', paymentData)

    console.log('Creating PayOS payment with data:', paymentData)

    // Create PayOS payment link only
    console.log('Creating PayOS payment with new credentials')
    const paymentResponse = await createPayOSPaymentLink(paymentData)
    console.log('PayOS API response:', paymentResponse)

    if (!paymentResponse || !paymentResponse.checkoutUrl) {
      throw new Error('PayOS API did not return checkoutUrl')
    }

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