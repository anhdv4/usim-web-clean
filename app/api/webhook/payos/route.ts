import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { usimAutomation } from '../../../lib/usimAutomation'

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

export async function POST(request: NextRequest) {
  try {
    const webhookData: PayOSWebhookData = await request.json()

    console.log('PayOS Webhook received:', webhookData)

    // Verify webhook signature (skip for localhost testing)
    const isLocalhost = request.headers.get('host')?.includes('localhost') ||
                       request.headers.get('host')?.includes('127.0.0.1')

    if (!isLocalhost) {
      const isValidSignature = verifyPayOSSignature(request.headers, webhookData, process.env.PAYOS_CHECKSUM_KEY!)
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
    const signature = headers.get('x-payos-signature')
    if (!signature) {
      console.log('No signature header found')
      return false
    }

    // Create the expected signature from data without the signature field
    const { signature: _, ...dataWithoutSignature } = data
    const dataString = JSON.stringify(dataWithoutSignature)
    const expectedSignature = crypto
      .createHmac('sha256', checksumKey)
      .update(dataString)
      .digest('hex')

    console.log('Signature verification:', {
      received: signature,
      expected: expectedSignature,
      dataString,
      match: signature === expectedSignature
    })

    return signature === expectedSignature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}