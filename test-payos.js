// Test PayOS credentials and signature calculation
const crypto = require('crypto');

const PAYOS_CLIENT_ID = '1e267ccb-fbfe-446e-8dcf-1c20881d65e5';
const PAYOS_API_KEY = 'f0566b1e-381b-4a8f-bd02-eced96238517';
const PAYOS_CHECKSUM_KEY = '4383e890ca0eb06140810527e938bbde97bc7f8fc52a93f861b9a678e98e043f';

async function testPayOS() {
  console.log('Testing PayOS credentials...\n');

  // Test data
  const testData = {
    orderCode: Date.now(),
    amount: 100000,
    description: 'Test payment',
    returnUrl: 'https://daily.telebox.vn/payment/success',
    cancelUrl: 'https://daily.telebox.vn/payment/cancel',
    items: [{
      name: 'Test payment',
      quantity: 1,
      price: 100000
    }]
  };

  console.log('Test data:', testData);

  // Method 1: Pipe-separated signature (current implementation)
  const signatureData1 = `${testData.orderCode}|${testData.amount}|${testData.description}|${testData.returnUrl}|${testData.cancelUrl}`;
  const signature1 = crypto
    .createHmac('sha256', PAYOS_CHECKSUM_KEY)
    .update(signatureData1, 'utf8')
    .digest('hex');

  console.log('\nMethod 1 (Pipe-separated):');
  console.log('Signature data:', signatureData1);
  console.log('Signature:', signature1);

  // Method 2: JSON payload signature
  const payloadForSignature = {
    orderCode: testData.orderCode,
    amount: testData.amount,
    description: testData.description,
    returnUrl: testData.returnUrl,
    cancelUrl: testData.cancelUrl
  };
  const signatureData2 = JSON.stringify(payloadForSignature);
  const signature2 = crypto
    .createHmac('sha256', PAYOS_CHECKSUM_KEY)
    .update(signatureData2, 'utf8')
    .digest('hex');

  console.log('\nMethod 2 (JSON payload):');
  console.log('Signature data:', signatureData2);
  console.log('Signature:', signature2);

  // Test API call with Method 1
  console.log('\nTesting API call with Method 1...');

  const requestBody = {
    ...testData,
    signature: signature1
  };

  try {
    const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    console.log('API Response:', result);

    if (result.code === '00' && result.data) {
      console.log('✅ SUCCESS! PayOS is working');
      console.log('Checkout URL:', result.data.checkoutUrl);
      console.log('QR Code:', result.data.qrCode);
    } else {
      console.log('❌ FAILED! PayOS returned error');
      console.log('Error:', result.desc);
    }
  } catch (error) {
    console.log('❌ NETWORK ERROR:', error.message);
  }

  // Test API call with Method 2
  console.log('\nTesting API call with Method 2...');

  const requestBody2 = {
    ...testData,
    signature: signature2
  };

  try {
    const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': PAYOS_CLIENT_ID,
        'x-api-key': PAYOS_API_KEY
      },
      body: JSON.stringify(requestBody2)
    });

    const result = await response.json();
    console.log('API Response:', result);

    if (result.code === '00' && result.data) {
      console.log('✅ SUCCESS! PayOS is working with JSON signature');
      console.log('Checkout URL:', result.data.checkoutUrl);
      console.log('QR Code:', result.data.qrCode);
    } else {
      console.log('❌ FAILED! PayOS returned error');
      console.log('Error:', result.desc);
    }
  } catch (error) {
    console.log('❌ NETWORK ERROR:', error.message);
  }
}

// Run the test
testPayOS().catch(console.error);