import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test PayOS configuration
    const config = {
      clientId: process.env.PAYOS_CLIENT_ID ? '✅ Configured' : '❌ Missing',
      apiKey: process.env.PAYOS_API_KEY ? '✅ Configured' : '❌ Missing',
      checksumKey: process.env.PAYOS_CHECKSUM_KEY ? '✅ Configured' : '❌ Missing',
      webhookUrl: process.env.PAYOS_WEBHOOK_URL || 'Not set'
    }

    return NextResponse.json({
      success: true,
      message: 'PayOS configuration test',
      config: config,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Test PayOS payment creation
    const testResponse = await fetch('http://localhost:3000/api/generate-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: body.amount || 10000,
        orderId: body.orderId || `TEST-${Date.now()}`,
        description: body.description || 'Test PayOS payment'
      })
    })

    const result = await testResponse.json()

    return NextResponse.json({
      success: true,
      message: 'PayOS payment test completed',
      testResult: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Test PayOS webhook
export async function PUT(request: NextRequest) {
  try {
    // Test webhook by sending a mock PayOS webhook payload
    const mockWebhookData = {
      code: '00',
      desc: 'Thành công',
      success: true,
      data: {
        orderCode: Date.now(),
        amount: 10000,
        description: 'Test webhook',
        transactionDateTime: new Date().toISOString(),
        paymentLinkId: 'test_payment_link',
        code: '00',
        desc: 'Thành công'
      },
      signature: 'test_signature'
    }

    const webhookResponse = await fetch('http://localhost:3000/api/webhook/payos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockWebhookData)
    })

    const webhookResult = await webhookResponse.json()

    return NextResponse.json({
      success: true,
      message: 'PayOS webhook test completed',
      webhookResult: webhookResult,
      testPayload: mockWebhookData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}