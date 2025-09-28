const fetch = require('node-fetch');

// Test webhook with sample PayOS data
async function testWebhook() {
  const webhookUrl = 'http://localhost:3000/api/test-webhook'; // Change to your deployed URL

  // Sample successful payment webhook data (similar to what PayOS sends)
  const sampleWebhookData = {
    code: '00',
    desc: 'success',
    success: true,
    data: {
      orderCode: 123456789, // This should match an order in your store
      amount: 27000,
      description: 'Test payment',
      accountNumber: '1234567890',
      reference: 'TEST123',
      transactionDateTime: new Date().toISOString(),
      paymentLinkId: 'test-link-id',
      code: '00',
      desc: 'success'
    },
    signature: 'test-signature' // Not verified in test endpoint
  };

  try {
    console.log('🧪 Testing webhook with sample data...');
    console.log('Webhook URL:', webhookUrl);
    console.log('Sample data:', JSON.stringify(sampleWebhookData, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleWebhookData)
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', result);

    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }

  } catch (error) {
    console.error('❌ Webhook test error:', error.message);
  }
}

// Check current orders status
async function checkOrders() {
  const statusUrl = 'http://localhost:3000/api/test-webhook'; // Change to your deployed URL

  try {
    console.log('📋 Checking current orders status...');

    const response = await fetch(statusUrl);
    const result = await response.json();

    console.log('Orders status:', result);

  } catch (error) {
    console.error('❌ Error checking orders:', error.message);
  }
}

// Manual webhook simulation for real PayOS data
async function simulateRealWebhook(orderCode) {
  const webhookUrl = 'http://localhost:3000/api/webhook/payos'; // Real webhook endpoint

  const realWebhookData = {
    code: '00',
    desc: 'success',
    success: true,
    data: {
      orderCode: parseInt(orderCode), // Use real orderCode from your order
      amount: 27000,
      description: 'Thanh toán đơn hàng test',
      accountNumber: '1234567890',
      reference: 'PAY123456',
      transactionDateTime: new Date().toISOString(),
      paymentLinkId: 'payos-link-id',
      code: '00',
      desc: 'success'
    },
    signature: 'real-signature-from-payos'
  };

  try {
    console.log('🎯 Simulating real PayOS webhook...');
    console.log('Order Code:', orderCode);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(realWebhookData)
    });

    const result = await response.json();
    console.log('Real webhook response:', result);

  } catch (error) {
    console.error('❌ Real webhook simulation error:', error.message);
  }
}

// Command line interface
const command = process.argv[2];
const param = process.argv[3];

switch (command) {
  case 'test':
    testWebhook();
    break;
  case 'check':
    checkOrders();
    break;
  case 'real':
    if (!param) {
      console.log('Usage: node test-webhook.js real <orderCode>');
      console.log('Example: node test-webhook.js real 123456789');
    } else {
      simulateRealWebhook(param);
    }
    break;
  default:
    console.log('Usage:');
    console.log('  node test-webhook.js test    - Test webhook with sample data');
    console.log('  node test-webhook.js check   - Check current orders status');
    console.log('  node test-webhook.js real <orderCode> - Simulate real PayOS webhook');
    break;
}