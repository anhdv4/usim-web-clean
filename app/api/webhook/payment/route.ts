import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Payment webhook received:', body)

    // Extract payment information
    const {
      orderCode,
      amount,
      transactionId,
      paymentStatus,
      paymentTime,
      bankCode,
      description
    } = body

    // Validate required fields
    if (!orderCode || !amount || !paymentStatus) {
      return NextResponse.json({
        success: false,
        message: 'Missing required payment information'
      }, { status: 400 })
    }

    // Find and update the corresponding order
    const savedOrders = localStorage.getItem('usim_orders')
    if (savedOrders) {
      const orders = JSON.parse(savedOrders)
      const orderIndex = orders.findIndex((order: any) =>
        order.orderCode === parseInt(orderCode) ||
        order.paymentId === `PAY-${orderCode}`
      )

      if (orderIndex !== -1) {
        // Update order status
        orders[orderIndex].status = paymentStatus === 'success' ? 'paid' : 'failed'
        orders[orderIndex].paymentTime = paymentTime
        orders[orderIndex].transactionId = transactionId
        orders[orderIndex].bankCode = bankCode
        orders[orderIndex].updatedAt = new Date().toISOString()

        // Save updated orders
        localStorage.setItem('usim_orders', JSON.stringify(orders))

        console.log(`Order ${orders[orderIndex].id} payment status updated to: ${paymentStatus}`)

        // Here you would typically:
        // 1. Send confirmation email to customer
        // 2. Update inventory/stock
        // 3. Trigger order fulfillment process
        // 4. Send notifications to admin

        return NextResponse.json({
          success: true,
          message: 'Payment webhook processed successfully',
          orderId: orders[orderIndex].id,
          status: paymentStatus
        })
      }
    }

    // If order not found, still return success to avoid webhook retries
    console.log(`Order with orderCode ${orderCode} not found`)
    return NextResponse.json({
      success: true,
      message: 'Webhook received but order not found'
    })

  } catch (error) {
    console.error('Payment webhook error:', error)
    return NextResponse.json({
      success: false,
      message: 'Webhook processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Handle GET requests for webhook testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Payment webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}