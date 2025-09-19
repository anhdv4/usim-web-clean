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

if (!global.ordersStore) {
  global.ordersStore = []
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

          // Automatically place order on USIM.VN
          try {
            await usimAutomation.initialize()

            const loginSuccess = await usimAutomation.login()
            if (loginSuccess) {
              const orderData = {
                productCode: global.ordersStore[orderIndex].productName || 'default-product',
                customerEmail: global.ordersStore[orderIndex].contactInfo?.replace('Email: ', '') || 'customer@example.com',
                customerName: global.ordersStore[orderIndex].contactInfo || 'Customer'
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