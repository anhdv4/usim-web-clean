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

  // Create signature for PayOS
  const signatureData = `${requestBody.orderCode}${requestBody.amount}${requestBody.description}${requestBody.returnUrl}${requestBody.cancelUrl}`
  requestBody.signature = crypto
    .createHmac('sha256', process.env.PAYOS_CHECKSUM_KEY!)
    .update(signatureData)
    .digest('hex')

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

    if (!amount || !orderId) {
      return NextResponse.json({ error: 'Amount and orderId are required' }, { status: 400 })
    }

    // Generate unique order code for PayOS
    const orderCode = Date.now()

    // Create PayOS payment request
    const paymentData = {
      orderCode: orderCode,
      amount: Math.round(amount), // PayOS requires integer amount
      description: description || `Thanh toán đơn hàng ${orderId}`,
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/cancel`,
      items: [{
        name: description || `Đơn hàng ${orderId}`,
        quantity: 1,
        price: Math.round(amount)
      }]
    }

    console.log('Creating PayOS payment with data:', paymentData)

    // Create VietQR format for better banking app compatibility
    let paymentResponse: any
    try {
      console.log('Creating VietQR format for banking apps')

      // VietQR format parameters - corrected for Vietnamese banking standards
      const vietQRData = {
        // VietQR version 01
        payloadFormat: '01',
        // Point of Initiation Method (11 = static, 12 = dynamic)
        initiationMethod: '12',
        // Merchant Account Information - using PayOS format
        // Format: GUID + BIN + Account Info
        merchantAccount: `A00000072701${process.env.PAYOS_CLIENT_ID?.replace(/-/g, '').substring(0, 8) || '01234567'}0208QRIBFTTA0306${orderCode.toString().slice(-8)}`,
        // Merchant Category Code (for digital goods/services)
        merchantCategory: '7999',
        // Transaction Currency (704 = VND)
        currency: '704',
        // Transaction Amount
        amount: Math.round(amount).toString(),
        // Country Code
        country: 'VN',
        // Merchant Name (no spaces, max 25 chars)
        merchantName: 'USIM',
        // Merchant City
        merchantCity: 'HANOI',
        // Additional Data Field
        additionalData: `08${orderCode.toString()}`
      }

      // Build VietQR string with proper formatting
      let vietQRString = '000201' // Payload Format
      vietQRString += '010212' // Point of Initiation Method (dynamic)

      // Merchant Account Information (ID 26) - Standard VietQR format
      // Using Vietcombank as example (BIN: 970436)
      const bankBin = '970436' // Vietcombank BIN
      const accountNumber = '1234567890' // Example account number
      const merchantInfo = `0010A0000007270110${bankBin}0208${accountNumber}0306${orderCode.toString().slice(-8)}`
      vietQRString += `26${merchantInfo.length.toString().padStart(2, '0')}${merchantInfo}`

      // Merchant Category Code (ID 52)
      vietQRString += `52047999`

      // Transaction Currency (ID 53)
      vietQRString += `5303704`

      // Transaction Amount (ID 54)
      vietQRString += `54${vietQRData.amount.length.toString().padStart(2, '0')}${vietQRData.amount}`

      // Country Code (ID 58)
      vietQRString += `5802VN`

      // Merchant Name (ID 59)
      vietQRString += `59${vietQRData.merchantName.length.toString().padStart(2, '0')}${vietQRData.merchantName}`

      // Merchant City (ID 60)
      vietQRString += `60${vietQRData.merchantCity.length.toString().padStart(2, '0')}${vietQRData.merchantCity}`

      // Additional Data Field (ID 62)
      vietQRString += `62${vietQRData.additionalData.length.toString().padStart(2, '0')}${vietQRData.additionalData}`

      // Calculate CRC16 checksum
      const crc16 = calculateCRC16(vietQRString + '6304')
      vietQRString += `6304${crc16}`

      paymentResponse = {
        checkoutUrl: vietQRString,
        qrData: vietQRString,
        orderCode: orderCode,
        amount: Math.round(amount)
      }

      console.log('VietQR payment data created:', vietQRString)
    } catch (error) {
      console.error('VietQR creation failed:', error)
      // Fallback to PayOS URL
      paymentResponse = {
        checkoutUrl: `https://payos.vn/payment/${orderCode}?amount=${Math.round(amount)}&description=${encodeURIComponent(description || `Thanh toán đơn hàng ${orderId}`)}`,
        orderCode: orderCode,
        amount: Math.round(amount)
      }
    }

    if (!paymentResponse || !paymentResponse.checkoutUrl) {
      throw new Error('Failed to create PayOS payment link')
    }

    console.log('Payment data created:', paymentResponse)

    // Generate QR code for the VietQR string
    const qrData = paymentResponse.qrData || paymentResponse.checkoutUrl

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