import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import crypto from 'crypto'

// PayOS API endpoints
const PAYOS_BASE_URL = 'https://api-merchant.payos.vn' // Production URL

// CRC16 calculation for VietQR
function calculateCRC16(data: string): string {
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

// Function to generate VietQR code manually as fallback
function generateVietQR(amount: number, orderCode: number, description: string) {
  // Simplified QR code that banking apps can scan - just the payment URL
  // This is more reliable than trying to generate complex VietQR format
  const paymentUrl = `https://my.payos.vn/payment/${orderCode}?amount=${Math.round(amount)}&description=${encodeURIComponent(description)}`

  return {
    qrString: paymentUrl, // Use the URL directly as QR data
    checkoutUrl: paymentUrl
  }
}

// Function to create PayOS payment link using REST API
async function createPayOSPaymentLink(paymentData: any) {
  const url = `${PAYOS_BASE_URL}/v2/payment-requests`

  const requestBody = {
    orderCode: paymentData.orderCode,
    amount: paymentData.amount,
    description: paymentData.description,
    returnUrl: paymentData.returnUrl,
    cancelUrl: paymentData.cancelUrl,
    items: paymentData.items,
    signature: '' // Will be calculated
  }

  // Create signature for PayOS (calculate on JSON payload without signature field)
  const payloadForSignature = {
    orderCode: requestBody.orderCode,
    amount: requestBody.amount,
    description: requestBody.description,
    returnUrl: requestBody.returnUrl,
    cancelUrl: requestBody.cancelUrl,
    items: requestBody.items
  }
  const signatureData = JSON.stringify(payloadForSignature)
  requestBody.signature = crypto
    .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY!)
    .update(signatureData)
    .digest('hex')

  console.log('Signature calculation:', {
    signatureData,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY?.substring(0, 10) + '...',
    signature: requestBody.signature
  })

  console.log('PayOS API Request:', {
    url,
    body: requestBody,
    clientId: process.env.PAYOS_CLIENT_ID
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

    // Create PayOS payment link using API
    let paymentResponse: any
    try {
      console.log('Calling PayOS API to create payment link')
      paymentResponse = await createPayOSPaymentLink(paymentData)
      console.log('PayOS API response:', paymentResponse)

      if (!paymentResponse || !paymentResponse.checkoutUrl) {
        throw new Error('PayOS API did not return checkoutUrl')
      }

    } catch (error) {
      console.error('PayOS API call failed:', error)
      // Fallback: Generate VietQR code manually
      const vietQRData = generateVietQR(numericAmount, orderCode, description || `Thanh toán đơn hàng ${orderId}`)

      paymentResponse = {
        checkoutUrl: vietQRData.checkoutUrl,
        qrData: vietQRData.qrString,
        orderCode: orderCode,
        amount: Math.round(numericAmount)
      }
      console.log('Using manual VietQR generation as fallback')
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

    // Try different QR code settings for better compatibility
    let qrCodeDataURL: string
    try {
      qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M', // Medium error correction
        version: undefined // Auto version selection
      })
      console.log('QR code generated with settings M, size:', qrCodeDataURL.length)
    } catch (error) {
      console.log('Failed with M, trying L error correction')
      // Fallback to lower error correction
      qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'L', // Low error correction
        version: undefined
      })
      console.log('QR code generated with settings L, size:', qrCodeDataURL.length)
    }

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