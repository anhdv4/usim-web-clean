import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { usimAutomation } from '../../../lib/usimAutomation'

// Import PayOS SDK
let PayOS: any
try {
  PayOS = require('@payos/node').PayOS
} catch (error) {
  console.warn('PayOS SDK not available for webhook verification')
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
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is active'
  })
}

export async function POST(request: NextRequest) {
  try {
    const webhookData: PayOSWebhookData = await request.json()

    console.log('PayOS Webhook received:', webhookData)

    // Verify webhook signature (skip for localhost testing)
    const isLocalhost = request.headers.get('host')?.includes('localhost') ||
                       request.headers.get('host')?.includes('127.0.0.1')

    if (!isLocalhost) {
      let isValidSignature = false

      // Try SDK verification first
      if (PayOS && process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) {
        try {
          const payOS = new PayOS(
            process.env.PAYOS_CLIENT_ID,
            process.env.PAYOS_API_KEY,
            process.env.PAYOS_CHECKSUM_KEY
          )
          // Assume SDK has verifyWebhook method
          if (payOS.verifyWebhook) {
            isValidSignature = payOS.verifyWebhook(webhookData, request.headers.get('x-payos-signature'))
          } else {
            // Fallback to manual
            isValidSignature = verifyPayOSSignature(request.headers, webhookData, process.env.PAYOS_CHECKSUM_KEY!)
          }
        } catch (error) {
          console.error('SDK verification failed, using manual:', error)
          isValidSignature = verifyPayOSSignature(request.headers, webhookData, process.env.PAYOS_CHECKSUM_KEY!)
        }
      } else {
        // Manual verification
        isValidSignature = verifyPayOSSignature(request.headers, webhookData, process.env.PAYOS_CHECKSUM_KEY!)
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

// PayOS webhook signature verification
function verifyPayOSSignature(headers: Headers, data: PayOSWebhookData, checksumKey: string): boolean {
  try {
    const signature = headers.get('x-payos-signature') || headers.get('x-signature') || headers.get('signature')
    if (!signature) {
      console.log('No signature header found')
      return false
    }

    console.log('Received signature:', signature)

    // Method 1: Full payload (current implementation)
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