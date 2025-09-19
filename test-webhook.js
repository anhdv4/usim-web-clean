// Test webhook endpoint locally
async function testWebhook() {
  console.log('Testing webhook endpoint...\n');

  // Test webhook data (simulating PayOS webhook)
  const testWebhookData = {
    code: '00',
    desc: 'success',
    success: true,
    data: {
      orderCode: 123456789,
      amount: 100000,
      description: 'Test payment',
      accountNumber: '1234567890',
      reference: 'REF123456',
      transactionDateTime: '2024-01-01T12:00:00.000Z',
      paymentLinkId: 'plink_test_123',
      code: '00',
      desc: 'Payment successful'
    },
    signature: 'test_signature' // This will be ignored on localhost
  };

  console.log('Sending POST request to webhook...');
  console.log('Data:', JSON.stringify(testWebhookData, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/webhook/payos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payos-signature': 'test_signature_header'
      },
      body: JSON.stringify(testWebhookData)
    });

    const result = await response.json();
    console.log('\nResponse status:', response.status);
    console.log('Response:', result);

    if (response.ok) {
      console.log('✅ Webhook processed successfully');
    } else {
      console.log('❌ Webhook failed');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Test GET request (for URL verification)
async function testWebhookGET() {
  console.log('\nTesting GET request for webhook verification...');

  try {
    const response = await fetch('http://localhost:3000/api/webhook/payos', {
      method: 'GET'
    });

    const result = await response.json();
    console.log('GET Response status:', response.status);
    console.log('GET Response:', result);

    if (response.ok) {
      console.log('✅ GET verification successful');
    } else {
      console.log('❌ GET verification failed');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testWebhookGET();
  await testWebhook();
}

runTests().catch(console.error);