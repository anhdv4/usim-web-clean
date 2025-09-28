import { NextRequest, NextResponse } from 'next/server'
import { usimAutomation } from '../../lib/usimAutomation'

export async function POST(request: NextRequest) {
  try {
    const { productCode, customerEmail } = await request.json()

    console.log('Testing USIM automation with:', { productCode, customerEmail })

    // Initialize USIM automation
    await usimAutomation.initialize()

    // Login to USIM
    const loginSuccess = await usimAutomation.login()

    if (!loginSuccess) {
      await usimAutomation.close()
      return NextResponse.json({
        success: false,
        error: 'Failed to login to USIM.VN'
      })
    }

    // Place test order
    const orderData = {
      productCode: productCode || 'test-product',
      customerEmail: customerEmail || 'test@example.com',
      customerName: 'Test Customer',
      simType: 'esim' as const,
      isBulk: false,
      quantity: 1
    }

    const result = await usimAutomation.placeOrder(orderData)

    // Close automation
    await usimAutomation.close()

    return NextResponse.json({
      success: result.success,
      orderId: result.orderId,
      error: result.error,
      message: result.success ? 'Order placed successfully on USIM.VN' : 'Order placement failed'
    })

  } catch (error) {
    console.error('USIM test error:', error)

    try {
      await usimAutomation.close()
    } catch (closeError) {
      console.error('Error closing USIM automation:', closeError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'USIM Automation Test Endpoint',
    usage: 'POST with { productCode: "code", customerEmail: "email" }'
  })
}