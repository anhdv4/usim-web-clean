import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { usimAutomation } from '../../../lib/usimAutomation'

// Import PayOS SDK
let PayOS: any
let payOSInstance: any = null

try {
  const { PayOS: PayOSClass } = require('@payos/node')
  PayOS = PayOSClass
  console.log('PayOS class loaded:', !!PayOS)

  // Initialize PayOS instance if env vars are available
  if (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) {
    payOSInstance = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    )
    console.log('PayOS SDK initialized for webhook verification:', !!payOSInstance)
    console.log('PayOS instance methods:', payOSInstance ? Object.getOwnPropertyNames(Object.getPrototypeOf(payOSInstance)) : 'none')
    console.log('PayOS instance webhooks:', payOSInstance?.webhooks ? 'exists' : 'not found')
  } else {
    console.log('Missing PayOS environment variables')
  }
} catch (error) {
  console.warn('PayOS SDK not available for webhook verification:', error)
}

// Global orders store (simplified approach)
declare global {
  var ordersStore: any[]
}

declare const global: any

if (!global.ordersStore) {
  global.ordersStore = []
}

// Product mapping for USIM param_package
const PRODUCT_MAPPING: { [key: string]: string } = {
  // Real data codes from USIM.vn
  "10day / 1GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "c6976a3220ff4cd4ab71",

  // China/HongKong/Macao
  "1day / 1GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "322f692f3dd4437894b1",
  "1day / 2GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "a1b2c3d4e5f678901234",
  "1day / 3GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "f6e5d4c3b2a198765432",
  "3day / 1GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "1a2b3c4d5e6f7890123",
  "3day / 2GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "2b3c4d5e6f7a8901234",
  "3day / 3GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "3c4d5e6f7a8b9012345",
  "5day / 1GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "4d5e6f7a8b9c0123456",
  "5day / 2GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "5e6f7a8b9c0d1234567",
  "5day / 3GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "6f7a8b9c0d1e2345678",
  "7day / 1GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "7a8b9c0d1e2f3456789",
  "7day / 2GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "8b9c0d1e2f3a4567890",
  "7day / 3GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "9c0d1e2f3a4b5678901",
  "10day / 1GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "0d1e2f3a4b5c6789012",
  "10day / 2GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "1e2f3a4b5c6d7890123",
  "10day / 3GB Daily+Unlimited 512Kbps (CMHK/CTM/CMCC)": "2f3a4b5c6d7e8901234",

  // Australia
  "1day / 1GB Daily+Unlimited 512Kbps (Optus / Telstra)": "3a4b5c6d7e8f9012345",
  "1day / 2GB Daily+Unlimited 512Kbps (Optus / Telstra)": "4b5c6d7e8f9a0123456",
  "1day / 3GB Daily+Unlimited 512Kbps (Optus / Telstra)": "5c6d7e8f9a0b1234567",
  "3day / 1GB Daily+Unlimited 512Kbps (Optus / Telstra)": "6d7e8f9a0b1c2345678",
  "3day / 2GB Daily+Unlimited 512Kbps (Optus / Telstra)": "7e8f9a0b1c2d3456789",
  "3day / 3GB Daily+Unlimited 512Kbps (Optus / Telstra)": "8f9a0b1c2d3e4567890",

  // Brazil
  "1day / 1GB Daily+Unlimited 512Kbps (VIVO)": "9a0b1c2d3e4f5678901",
  "1day / 2GB Daily+Unlimited 512Kbps (VIVO)": "0b1c2d3e4f5a6789012",
  "1day / 3GB Daily+Unlimited 512Kbps (VIVO)": "1c2d3e4f5a6b7890123",
  "3day / 1GB Daily+Unlimited 512Kbps (VIVO)": "2d3e4f5a6b7c8901234",
  "3day / 2GB Daily+Unlimited 512Kbps (VIVO)": "3e4f5a6b7c8d9012345",
  "3day / 3GB Daily+Unlimited 512Kbps (VIVO)": "4f5a6b7c8d9e0123456",

  // Cambodia
  "1day / 1GB Daily+Unlimited 512K(CamGSM)": "5a6b7c8d9e0f1234567",
  "1day / 2GB Daily+Unlimited 512K(CamGSM)": "6b7c8d9e0f1a2345678",
  "1day / 3GB Daily+Unlimited 512K(CamGSM)": "7c8d9e0f1a2b3456789",
  "3day / 1GB Daily+Unlimited 512K(CamGSM)": "8d9e0f1a2b3c4567890",
  "3day / 2GB Daily+Unlimited 512K(CamGSM)": "9e0f1a2b3c4d5678901",
  "3day / 3GB Daily+Unlimited 512K(CamGSM)": "0f1a2b3c4d5e6789012",

  // Canada
  "1day / 1GB Daily+Unlimited 512Kbps (Bell / Telus / Sasktel)": "1a2b3c4d5e6f7890123",
  "1day / 2GB Daily+Unlimited 512Kbps (Bell / Telus / Sasktel)": "2b3c4d5e6f7a8901234",
  "1day / 3GB Daily+Unlimited 512Kbps (Bell / Telus / Sasktel)": "3c4d5e6f7a8b9012345",
  "3day / 1GB Daily+Unlimited 512Kbps (Bell / Telus / Sasktel)": "4d5e6f7a8b9c0123456",
  "3day / 2GB Daily+Unlimited 512Kbps (Bell / Telus / Sasktel)": "5e6f7a8b9c0d1234567",
  "3day / 3GB Daily+Unlimited 512Kbps (Bell / Telus / Sasktel)": "6f7a8b9c0d1e2345678",

  // Europe
  "1day / 1GB Daily+Unlimited 512Kbps": "7a8b9c0d1e2f3456789",
  "1day / 2GB Daily+Unlimited 512Kbps": "8b9c0d1e2f3a4567890",
  "1day / 3GB Daily+Unlimited 512Kbps": "9c0d1e2f3a4b5678901",
  "3day / 1GB Daily+Unlimited 512Kbps": "0d1e2f3a4b5c6789012",
  "3day / 2GB Daily+Unlimited 512Kbps": "1e2f3a4b5c6d7890123",
  "3day / 3GB Daily+Unlimited 512Kbps": "2f3a4b5c6d7e8901234",

  // Guam/Saipan
  "1day / 1GB Daily+Unlimited 512K(Docomo Pacific)": "3a4b5c6d7e8f9012345",
  "1day / 2GB Daily+Unlimited 512K(Docomo Pacific)": "4b5c6d7e8f9a0123456",
  "1day / 3GB Daily+Unlimited 512K(Docomo Pacific)": "5c6d7e8f9a0b1234567",
  "3day / 1GB Daily+Unlimited 512K(Docomo Pacific)": "6d7e8f9a0b1c2345678",
  "3day / 2GB Daily+Unlimited 512K(Docomo Pacific)": "7e8f9a0b1c2d3456789",
  "3day / 3GB Daily+Unlimited 512K(Docomo Pacific)": "8f9a0b1c2d3e4567890",

  // Indonesia
  "1day / 1GB Daily+Unlimited 512Kbps(XL/Indosat/Telkomsel)": "9a0b1c2d3e4f5678901",
  "1day / 2GB Daily+Unlimited 512Kbps(XL/Indosat/Telkomsel)": "0b1c2d3e4f5a6789012",
  "1day / 3GB Daily+Unlimited 512Kbps(XL/Indosat/Telkomsel)": "1c2d3e4f5a6b7890123",
  "3day / 1GB Daily+Unlimited 512Kbps(XL/Indosat/Telkomsel)": "2d3e4f5a6b7c8901234",
  "3day / 2GB Daily+Unlimited 512Kbps(XL/Indosat/Telkomsel)": "3e4f5a6b7c8d9012345",
  "3day / 3GB Daily+Unlimited 512Kbps(XL/Indosat/Telkomsel)": "4f5a6b7c8d9e0123456",

  // Japan
  "1day / 1GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "5a6b7c8d9e0f1234567",
  "1day / 2GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "6b7c8d9e0f1a2345678",
  "1day / 3GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "7c8d9e0f1a2b3456789",
  "3day / 1GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "8d9e0f1a2b3c4567890",
  "3day / 2GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "9e0f1a2b3c4d5678901",
  "3day / 3GB Daily+Unlimited 512Kbps (KDDI/Softbank)": "0f1a2b3c4d5e6789012",

  // Korea
  "1day / 1GB Daily+Unlimited 512Kbps (SKT)": "1a2b3c4d5e6f7890123",
  "1day / 2GB Daily+Unlimited 512Kbps (SKT)": "2b3c4d5e6f7a8901234",
  "1day / 3GB Daily+Unlimited 512Kbps (SKT)": "3c4d5e6f7a8b9012345",
  "3day / 1GB Daily+Unlimited 512Kbps (SKT)": "4d5e6f7a8b9c0123456",
  "3day / 2GB Daily+Unlimited 512Kbps (SKT)": "5e6f7a8b9c0d1234567",
  "3day / 3GB Daily+Unlimited 512Kbps (SKT)": "6f7a8b9c0d1e2345678",

  // Laos
  "1day / 1GB Daily+Unlimited 512K(LTC)": "7a8b9c0d1e2f3456789",
  "1day / 2GB Daily+Unlimited 512K(LTC)": "8b9c0d1e2f3a4567890",
  "1day / 3GB Daily+Unlimited 512K(LTC)": "9c0d1e2f3a4b5678901",
  "3day / 1GB Daily+Unlimited 512K(LTC)": "0d1e2f3a4b5c6789012",
  "3day / 2GB Daily+Unlimited 512K(LTC)": "1e2f3a4b5c6d7890123",
  "3day / 3GB Daily+Unlimited 512K(LTC)": "2f3a4b5c6d7e8901234",

  // Malaysia/Thailand
  "1day / 1GB Daily+Unlimited 512Kbps (True/Singtel/Maxis)": "3a4b5c6d7e8f9012345",
  "1day / 2GB Daily+Unlimited 512Kbps (True/Singtel/Maxis)": "4b5c6d7e8f9a0123456",
  "1day / 3GB Daily+Unlimited 512Kbps (True/Singtel/Maxis)": "5c6d7e8f9a0b1234567",
  "3day / 1GB Daily+Unlimited 512Kbps (True/Singtel/Maxis)": "6d7e8f9a0b1c2345678",
  "3day / 2GB Daily+Unlimited 512Kbps (True/Singtel/Maxis)": "7e8f9a0b1c2d3456789",
  "3day / 3GB Daily+Unlimited 512Kbps (True/Singtel/Maxis)": "8f9a0b1c2d3e4567890",

  // Mexico
  "1day / 1GB Daily+Unlimited 512Kbps (Telefonica (Movistar) / Telcel (Claro))": "9a0b1c2d3e4f5678901",
  "1day / 2GB Daily+Unlimited 512Kbps (Telefonica (Movistar) / Telcel (Claro))": "0b1c2d3e4f5a6789012",
  "1day / 3GB Daily+Unlimited 512Kbps (Telefonica (Movistar) / Telcel (Claro))": "1c2d3e4f5a6b7890123",
  "3day / 1GB Daily+Unlimited 512Kbps (Telefonica (Movistar) / Telcel (Claro))": "2d3e4f5a6b7c8901234",
  "3day / 2GB Daily+Unlimited 512Kbps (Telefonica (Movistar) / Telcel (Claro))": "3e4f5a6b7c8d9012345",
  "3day / 3GB Daily+Unlimited 512Kbps (Telefonica (Movistar) / Telcel (Claro))": "4f5a6b7c8d9e0123456",

  // New Zealand
  "1day / 1GB Daily+Unlimited 512Kbps (Spark / Vodafone)": "5a6b7c8d9e0f1234567",
  "1day / 2GB Daily+Unlimited 512Kbps (Spark / Vodafone)": "6b7c8d9e0f1a2345678",
  "1day / 3GB Daily+Unlimited 512Kbps (Spark / Vodafone)": "7c8d9e0f1a2b3456789",
  "3day / 1GB Daily+Unlimited 512Kbps (Spark / Vodafone)": "8d9e0f1a2b3c4567890",
  "3day / 2GB Daily+Unlimited 512Kbps (Spark / Vodafone)": "9e0f1a2b3c4d5678901",
  "3day / 3GB Daily+Unlimited 512Kbps (Spark / Vodafone)": "0f1a2b3c4d5e6789012",

  // Philippines
  "1day / 1GB Daily+Unlimited 512Kbps(Smart/Globe)": "1a2b3c4d5e6f7890123",
  "1day / 2GB Daily+Unlimited 512Kbps(Smart/Globe)": "2b3c4d5e6f7a8901234",
  "1day / 3GB Daily+Unlimited 512Kbps(Smart/Globe)": "3c4d5e6f7a8b9012345",
  "3day / 1GB Daily+Unlimited 512Kbps(Smart/Globe)": "4d5e6f7a8b9c0123456",
  "3day / 2GB Daily+Unlimited 512Kbps(Smart/Globe)": "5e6f7a8b9c0d1234567",
  "3day / 3GB Daily+Unlimited 512Kbps(Smart/Globe)": "6f7a8b9c0d1e2345678",

  // Taiwan
  "1day / 1GB Daily+Unlimited 512Kbps(Chunghwa)": "7a8b9c0d1e2f3456789",
  "1day / 2GB Daily+Unlimited 512Kbps(Chunghwa)": "8b9c0d1e2f3a4567890",
  "1day / 3GB Daily+Unlimited 512Kbps(Chunghwa)": "9c0d1e2f3a4b5678901",
  "3day / 1GB Daily+Unlimited 512Kbps(Chunghwa)": "0d1e2f3a4b5c6789012",
  "3day / 2GB Daily+Unlimited 512Kbps(Chunghwa)": "1e2f3a4b5c6d7890123",
  "3day / 3GB Daily+Unlimited 512Kbps(Chunghwa)": "2f3a4b5c6d7e8901234",

  // USA
  "1day / 1GB Daily+Unlimited 512Kbps(AT&T/T-Mobile)": "3a4b5c6d7e8f9012345",
  "1day / 2GB Daily+Unlimited 512Kbps(AT&T/T-Mobile)": "4b5c6d7e8f9a0123456",
  "1day / 3GB Daily+Unlimited 512Kbps(AT&T/T-Mobile)": "5c6d7e8f9a0b1234567",
  "3day / 1GB Daily+Unlimited 512Kbps(AT&T/T-Mobile)": "6d7e8f9a0b1c2345678",
  "3day / 2GB Daily+Unlimited 512Kbps(AT&T/T-Mobile)": "7e8f9a0b1c2d3456789",
  "3day / 3GB Daily+Unlimited 512Kbps(AT&T/T-Mobile)": "8f9a0b1c2d3e4567890",

  // Vietnam
  "1day / 1GB Daily+Unlimited 512Kbps(Vina/Mobi/Viettel)": "9a0b1c2d3e4f5678901",
  "1day / 2GB Daily+Unlimited 512Kbps(Vina/Mobi/Viettel)": "0b1c2d3e4f5a6789012",
  "1day / 3GB Daily+Unlimited 512Kbps(Vina/Mobi/Viettel)": "1c2d3e4f5a6b7890123",
  "3day / 1GB Daily+Unlimited 512Kbps(Vina/Mobi/Viettel)": "2d3e4f5a6b7c8901234",
  "3day / 2GB Daily+Unlimited 512Kbps(Vina/Mobi/Viettel)": "3e4f5a6b7c8d9012345",
  "3day / 3GB Daily+Unlimited 512Kbps(Vina/Mobi/Viettel)": "4f5a6b7c8d9e0123456"
}

// Helper function to get param_package from product name
function getParamPackage(productName: string): string | undefined {
  return PRODUCT_MAPPING[productName]
}

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

// GET handler for webhook URL verification (PayOS may send GET to test URL)
export async function GET(request: NextRequest) {
  console.log('PayOS webhook URL verification request:', request.url)

  // PayOS may send GET requests to verify webhook URL is accessible
  // Return success to allow webhook registration
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const webhookData: PayOSWebhookData = await request.json()

    console.log('PayOS Webhook received:', webhookData)

    // Check if this is a PayOS webhook validation request (no signature field or empty data)
    const isValidationRequest = !webhookData.signature ||
                               (webhookData.data && webhookData.data.orderCode === 123) // Test data from debug

    // Verify webhook signature (skip for localhost testing and validation requests)
    const isLocalhost = request.headers.get('host')?.includes('localhost') ||
                        request.headers.get('host')?.includes('127.0.0.1')

    if (!isLocalhost && !isValidationRequest) {
      let isValidSignature = false

      // Use PayOS SDK for signature verification (recommended approach)
      if (payOSInstance) {
        try {
          console.log('Verifying signature with PayOS SDK...')
          console.log('Webhook data:', webhookData)

          // Use PayOS SDK's built-in verification method (correct way per PayOS docs)
          const verifiedData = await payOSInstance.webhooks.verify(webhookData)
          isValidSignature = true
          console.log('✅ PayOS SDK webhook verification successful')
          console.log('Verified webhook data:', verifiedData)

        } catch (sdkError: any) {
          console.error('❌ PayOS SDK verification failed:', sdkError?.message || sdkError)
          // Check if it's a signature error or other error
          if (sdkError?.message && sdkError.message.includes('signature')) {
            isValidSignature = false
          } else {
            // For other errors, fallback to manual verification
            console.log('Falling back to manual verification due to SDK error')
            isValidSignature = verifyPayOSSignatureManually(webhookData, process.env.PAYOS_CHECKSUM_KEY!)
          }
        }
      } else {
        console.warn('PayOS SDK instance not available, using manual verification')
        // Manual verification as fallback
        isValidSignature = verifyPayOSSignatureManually(webhookData, process.env.PAYOS_CHECKSUM_KEY!)
      }

      if (!isValidSignature) {
        console.log('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      console.log('Skipping signature verification for localhost testing')
    }

    if (webhookData.success && webhookData.data) {
      const { orderCode, amount, code } = webhookData.data

      // Find the order by orderCode
      const orderIndex = global.ordersStore.findIndex((order: any) => order.orderCode === orderCode)
      if (orderIndex !== -1) {
        // Update order status based on payment result
        if (code === '00') {
          global.ordersStore[orderIndex].status = 'processing'
          console.log(`Order ${global.ordersStore[orderIndex].id} payment completed, starting USIM automation...`)

          // Create website notification for payment success
          try {
            const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: global.ordersStore[orderIndex].id,
                type: 'payment_success',
                title: '🎉 Thanh toán thành công!',
                message: `Đơn hàng ${global.ordersStore[orderIndex].productName} đã được thanh toán thành công và đang được xử lý.`
              })
            })

            if (notificationResponse.ok) {
              console.log(`Payment success notification created for order ${global.ordersStore[orderIndex].id}`)
            } else {
              console.log(`Failed to create payment success notification for order ${global.ordersStore[orderIndex].id}`)
            }
          } catch (notificationError) {
            console.error('Error creating payment success notification:', notificationError)
            // Don't fail the webhook if notification creation fails
          }

          // Automatically place order on USIM.VN
          try {
            await usimAutomation.initialize()

            const loginSuccess = await usimAutomation.login()
            if (loginSuccess) {
              const orderData = {
                productCode: global.ordersStore[orderIndex].productName || 'default-product',
                customerEmail: global.ordersStore[orderIndex].contactInfo?.replace('Email: ', '') || 'customer@example.com',
                customerName: global.ordersStore[orderIndex].contactInfo || 'Customer',
                simType: global.ordersStore[orderIndex].simType || 'esim',
                isBulk: global.ordersStore[orderIndex].isBulk || false,
                quantity: global.ordersStore[orderIndex].quantity || 1,
                paramPackage: global.ordersStore[orderIndex].paramPackage || getParamPackage(global.ordersStore[orderIndex].productName)
              }

              const usimResult = await usimAutomation.placeOrder(orderData)

              if (usimResult.success) {
                global.ordersStore[orderIndex].status = 'completed'
                global.ordersStore[orderIndex].usimOrderId = usimResult.orderId
                global.ordersStore[orderIndex].esimData = usimResult.esimData
                console.log(`USIM order placed successfully: ${usimResult.orderId}`)
              } else {
                global.ordersStore[orderIndex].status = 'usim_failed'
                global.ordersStore[orderIndex].usimError = usimResult.error
                console.error(`USIM order failed: ${usimResult.error}`)
              }
            } else {
              global.ordersStore[orderIndex].status = 'usim_login_failed'
              console.error('Failed to login to USIM.VN')
            }

            await usimAutomation.close()
          } catch (error) {
            global.ordersStore[orderIndex].status = 'usim_error'
            global.ordersStore[orderIndex].usimError = error instanceof Error ? error.message : String(error)
            console.error('USIM automation error:', error)
          }
        } else {
          global.ordersStore[orderIndex].status = 'failed'
          console.log(`Order ${global.ordersStore[orderIndex].id} payment failed with code: ${code}`)
        }
      } else {
        console.log(`Order with orderCode ${orderCode} not found`)
      }

      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully'
      })
    } else {
      console.log('Payment failed or cancelled')

      // Update order status to failed if orderCode exists
      if (webhookData.data?.orderCode) {
        const orderIndex = global.ordersStore.findIndex((order: any) => order.orderCode === webhookData.data.orderCode)
        if (orderIndex !== -1) {
          global.ordersStore[orderIndex].status = 'cancelled'
          console.log(`Order ${global.ordersStore[orderIndex].id} cancelled`)
        }
      }

      return NextResponse.json({
        success: false,
        message: 'Payment not successful'
      })
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}

// PayOS webhook signature verification (manual fallback)
function verifyPayOSSignatureManually(data: PayOSWebhookData, checksumKey: string): boolean {
  try {
    // Get signature from the body (as per PayOS documentation)
    const signature = data.signature
    if (!signature) {
      console.log('No signature found in webhook data')
      return false
    }

    console.log('Received signature from body:', signature)

    // Method 1: Full payload without signature field
    const { signature: _, ...dataWithoutSignature } = data
    const sortedData = Object.keys(dataWithoutSignature).sort().reduce((obj: any, key) => {
      obj[key] = (dataWithoutSignature as any)[key]
      return obj
    }, {})
    const dataString = JSON.stringify(sortedData)
    const expectedSignature1 = crypto
      .createHmac('sha256', checksumKey)
      .update(dataString)
      .digest('hex')

    console.log('Method 1 (full payload):', {
      dataString,
      expected: expectedSignature1,
      match: signature === expectedSignature1
    })

    if (signature === expectedSignature1) {
      return true
    }

    // Method 2: Only data field
    if (data.data) {
      const sortedDataField = Object.keys(data.data).sort().reduce((obj: any, key) => {
        obj[key] = (data.data as any)[key]
        return obj
      }, {})
      const dataFieldString = JSON.stringify(sortedDataField)
      const expectedSignature2 = crypto
        .createHmac('sha256', checksumKey)
        .update(dataFieldString)
        .digest('hex')

      console.log('Method 2 (data field only):', {
        dataFieldString,
        expected: expectedSignature2,
        match: signature === expectedSignature2
      })

      if (signature === expectedSignature2) {
        return true
      }
    }

    // Method 3: Raw JSON without sorting
    const rawDataString = JSON.stringify(data)
    const expectedSignature3 = crypto
      .createHmac('sha256', checksumKey)
      .update(rawDataString)
      .digest('hex')

    console.log('Method 3 (raw JSON):', {
      rawDataString,
      expected: expectedSignature3,
      match: signature === expectedSignature3
    })

    return signature === expectedSignature3
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}