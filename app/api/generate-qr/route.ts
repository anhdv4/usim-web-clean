import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

// Import PayOS SDK - the SDK handles signature calculation internally
let PayOS: any
let payOS: any = null

try {
  PayOS = require('@payos/node').PayOS
  console.log('PayOS SDK loaded successfully')

  // Initialize PayOS SDK if available and env vars exist
  if (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) {
    payOS = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    )
    console.log('PayOS SDK initialized successfully')
  } else {
    console.warn('PayOS environment variables not set')
  }
} catch (error) {
  console.warn('PayOS SDK not available:', error)
}

// PayOS payment link creator using SDK (preferred) or manual API
async function createPayOSPaymentLink(paymentData: any) {
  console.log('PayOS instance:', !!payOS)
  console.log('PayOS methods:', payOS ? Object.getOwnPropertyNames(payOS) : 'No PayOS')

  // Try SDK first if available
  if (payOS && typeof payOS.paymentRequests === 'object' && payOS.paymentRequests.create) {
    try {
      console.log('Using PayOS SDK for payment creation')
      const result = await payOS.paymentRequests.create(paymentData)
      console.log('PayOS SDK Response:', result)
      return result
    } catch (error) {
      console.error('PayOS SDK failed:', error)
      // Continue to manual implementation
    }
  }

  // Fallback to manual API implementation
  console.log('Using manual PayOS API implementation')
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

  // PayOS signature calculation - based on sorted JSON data
  const { signature, ...dataForSignature } = requestBody
  const sortedData = Object.keys(dataForSignature).sort().reduce((obj: any, key) => {
    obj[key] = dataForSignature[key as keyof typeof dataForSignature]
    return obj
  }, {})

  const signatureData = JSON.stringify(sortedData)
  const crypto = require('crypto')
  requestBody.signature = crypto
    .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY!)
    .update(signatureData, 'utf8')
    .digest('hex')

  console.log('PayOS signature calculation:', {
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

    // Create PayOS payment request - use configured base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    // PayOS requires description to be max 25 characters
    const shortDescription = (description || `Đơn hàng ${orderId}`).substring(0, 25)
    const paymentData = {
      orderCode: orderCode,
      amount: Math.round(numericAmount), // PayOS requires integer amount
      description: shortDescription,
      returnUrl: `${baseUrl}/payment/success`,
      cancelUrl: `${baseUrl}/payment/cancel`,
      items: [{
        name: shortDescription,
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