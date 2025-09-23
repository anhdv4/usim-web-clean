import { NextRequest, NextResponse } from 'next/server'
import { usimAutomation } from '../../lib/usimAutomation'

export async function POST(request: NextRequest) {
  try {
    const { productCode, customerEmail, customerName, simulatePayment = true } = await request.json()

    console.log('🧪 Testing USIM Automation:', { productCode, customerEmail, customerName, simulatePayment })

    // Simulate successful payment webhook
    if (simulatePayment) {
      console.log('💰 Simulating successful payment...')

      // Create a mock order that would normally come from payment success
      const mockOrder = {
        id: `TEST-${Date.now()}`,
        productName: productCode || 'Test Product',
        country: 'Test Country',
        price: 1.00,
        priceVND: 27000,
        simType: 'esim',
        contactInfo: `Email: ${customerEmail}`,
        orderDate: new Date().toISOString(),
        status: 'pending'
      }

      // Add to global orders store (simulating database)
      if (!global.ordersStore) {
        global.ordersStore = []
      }
      global.ordersStore.push(mockOrder)

      console.log('✅ Mock order created:', mockOrder.id)
    }

    // Initialize USIM automation
    console.log('🚀 Initializing USIM automation...')
    await usimAutomation.initialize()

    // Login to USIM
    console.log('🔐 Logging into USIM.VN...')
    const loginSuccess = await usimAutomation.login()

    if (!loginSuccess) {
      await usimAutomation.close()
      return NextResponse.json({
        success: false,
        error: '❌ Failed to login to USIM.VN'
      })
    }

    console.log('✅ Successfully logged into USIM.VN')

    // Place test order
    const orderData = {
      productCode: productCode || 'test-product',
      customerEmail: customerEmail || 'test@example.com',
      customerName: customerName || 'Test Customer',
      simType: 'esim' as const,
      isBulk: false,
      quantity: 1
    }

    console.log('🛒 Placing order on USIM.VN...', orderData)
    const result = await usimAutomation.placeOrder(orderData)

    // Close automation
    await usimAutomation.close()

    if (result.success) {
      console.log('🎉 Order placed successfully on USIM.VN!')
      console.log('📋 Order ID:', result.orderId)
      console.log('📦 eSIM Data:', result.esimData)

      return NextResponse.json({
        success: true,
        message: '🎉 USIM automation test successful!',
        orderId: result.orderId,
        esimData: result.esimData,
        details: {
          login: '✅ Successful',
          orderPlacement: '✅ Successful',
          automationStatus: '✅ Working'
        }
      })
    } else {
      console.log('❌ Order placement failed:', result.error)

      return NextResponse.json({
        success: false,
        message: '❌ USIM automation test failed',
        error: result.error,
        details: {
          login: '✅ Successful',
          orderPlacement: '❌ Failed',
          automationStatus: '⚠️ Needs debugging'
        }
      })
    }

  } catch (error) {
    console.error('💥 USIM automation test error:', error)

    try {
      await usimAutomation.close()
    } catch (closeError) {
      console.error('Error closing USIM automation:', closeError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: {
        login: '❌ Error',
        orderPlacement: '❌ Error',
        automationStatus: '💥 System error'
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: '🧪 USIM Automation Test Endpoint',
    usage: 'POST with { productCode: "code", customerEmail: "email", customerName: "name" }',
    description: 'Test the USIM automation system without payment',
    example: {
      productCode: "test-esim",
      customerEmail: "test@example.com",
      customerName: "Test Customer"
    }
  })
}