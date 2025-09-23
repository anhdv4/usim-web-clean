import { NextRequest, NextResponse } from 'next/server'

// Global orders store
declare global {
  var ordersStore: any[]
}

if (!global.ordersStore) {
  global.ordersStore = []
}

interface Order {
  id: string
  productName: string
  country: string
  duration: number
  price: number
  priceVND: number
  simType: 'esim' | 'physical'
  contactInfo: string
  orderDate: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  paymentId?: string
  orderCode?: number
  userId?: string // Add user association
  paramPackage?: string // USIM param_package for direct ordering
}

export async function GET() {
  try {
    return NextResponse.json(global.ordersStore)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }

    const orderIndex = global.ordersStore.findIndex((order: any) => order.id === orderId)
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status
    global.ordersStore[orderIndex].status = status

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully'
    })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const order: Order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productName: body.productName,
      country: body.country,
      duration: body.duration,
      price: body.price,
      priceVND: body.priceVND,
      simType: body.simType,
      contactInfo: body.contactInfo,
      orderDate: new Date().toISOString(),
      status: 'pending',
      paymentId: body.paymentId,
      orderCode: body.orderCode
    }

    // Store order in memory
    global.ordersStore.push(order)
    console.log('New order received and stored:', order)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Order submitted successfully'
    })
  } catch (error) {
    console.error('Order submission error:', error)
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 })
  }
}