import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json()

    console.log('=== TEST WEBHOOK RECEIVED ===')
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    console.log('Body:', JSON.stringify(webhookData, null, 2))

    // Check current orders
    console.log('Current orders in store:', global.ordersStore?.length || 0)
    if (global.ordersStore) {
      global.ordersStore.forEach((order: any, index: number) => {
        console.log(`Order ${index}:`, {
          id: order.id,
          orderCode: order.orderCode,
          status: order.status,
          productName: order.productName
        })
      })
    }

    // Simulate webhook processing
    if (webhookData.success && webhookData.data) {
      const { orderCode, code } = webhookData.data
      console.log(`Looking for order with orderCode: ${orderCode}`)

      const orderIndex = global.ordersStore?.findIndex((order: any) => order.orderCode === orderCode)
      console.log(`Order found at index: ${orderIndex}`)

      if (orderIndex !== -1 && orderIndex !== undefined) {
        const oldStatus = global.ordersStore[orderIndex].status
        if (code === '00') {
          global.ordersStore[orderIndex].status = 'processing'
          console.log(`✅ Order ${global.ordersStore[orderIndex].id} status changed: ${oldStatus} → processing`)
        } else {
          global.ordersStore[orderIndex].status = 'failed'
          console.log(`❌ Order ${global.ordersStore[orderIndex].id} status changed: ${oldStatus} → failed`)
        }
      } else {
        console.log(`❌ Order with orderCode ${orderCode} not found in store`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test webhook processed',
      timestamp: new Date().toISOString(),
      ordersCount: global.ordersStore?.length || 0
    })

  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('=== TEST WEBHOOK STATUS CHECK ===')
  console.log('Current orders in store:', global.ordersStore?.length || 0)

  if (global.ordersStore) {
    global.ordersStore.forEach((order: any, index: number) => {
      console.log(`Order ${index}:`, {
        id: order.id,
        orderCode: order.orderCode,
        status: order.status,
        productName: order.productName,
        createdAt: order.orderDate
      })
    })
  }

  return NextResponse.json({
    success: true,
    message: 'Current orders status',
    orders: global.ordersStore || [],
    timestamp: new Date().toISOString()
  })
}