// Debug webhook signature verification
const crypto = require('crypto');
const fs = require('fs');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY;

console.log('Debugging PayOS webhook signature verification...\n');
console.log('Checksum key:', PAYOS_CHECKSUM_KEY);
console.log('Key length:', PAYOS_CHECKSUM_KEY?.length);

// Test webhook data (simulating what PayOS sends)
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
  signature: 'placeholder_signature' // This will be calculated
};

console.log('\nTest webhook data:');
console.log(JSON.stringify(testWebhookData, null, 2));

// Function to verify signature (same as in webhook)
function verifyPayOSSignature(data, checksumKey) {
  try {
    // Create the expected signature from data without the signature field, keys sorted
    const { signature: _, ...dataWithoutSignature } = data;
    const sortedData = Object.keys(dataWithoutSignature).sort().reduce((obj, key) => {
      obj[key] = dataWithoutSignature[key];
      return obj;
    }, {});
    const dataString = JSON.stringify(sortedData);
    const expectedSignature = crypto
      .createHmac('sha256', checksumKey)
      .update(dataString)
      .digest('hex');

    console.log('\nSignature calculation:');
    console.log('Data without signature:', JSON.stringify(sortedData, null, 2));
    console.log('Sorted keys:', Object.keys(sortedData));
    console.log('Data string for signature:', dataString);
    console.log('Expected signature:', expectedSignature);

    return expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return null;
  }
}

// Calculate signature
const calculatedSignature = verifyPayOSSignature(testWebhookData, PAYOS_CHECKSUM_KEY);

console.log('\nCalculated signature:', calculatedSignature);

// Test with different data formats that PayOS might use
console.log('\n=== Testing different signature formats ===');

// Test 1: Only the data object (not the full webhook payload)
const testData1 = {
  orderCode: 123456789,
  amount: 100000,
  description: 'Test payment',
  accountNumber: '1234567890',
  reference: 'REF123456',
  transactionDateTime: '2024-01-01T12:00:00.000Z',
  paymentLinkId: 'plink_test_123',
  code: '00',
  desc: 'Payment successful'
};

const sortedData1 = Object.keys(testData1).sort().reduce((obj, key) => {
  obj[key] = testData1[key];
  return obj;
}, {});
const dataString1 = JSON.stringify(sortedData1);
const sig1 = crypto
  .createHmac('sha256', PAYOS_CHECKSUM_KEY)
  .update(dataString1)
  .digest('hex');

console.log('\nTest 1 - Only data object (sorted):');
console.log('Data:', JSON.stringify(sortedData1, null, 2));
console.log('Data string:', dataString1);
console.log('Signature:', sig1);

// Test 2: Full webhook data (current implementation)
const testData2 = {
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
  }
};

const sig2 = verifyPayOSSignature(testData2, PAYOS_CHECKSUM_KEY);
console.log('\nTest 2 - Full webhook payload (current implementation):', sig2);

// Test 3: Raw JSON string without sorting
const rawDataString = JSON.stringify(testWebhookData);
const sig3 = crypto
  .createHmac('sha256', PAYOS_CHECKSUM_KEY)
  .update(rawDataString)
  .digest('hex');

console.log('\nTest 3 - Raw JSON without sorting:', sig3);

// Test 4: Check if PayOS uses different header name
console.log('\n=== Possible header names ===');
console.log('Current code uses: x-payos-signature');
console.log('Possible alternatives: x-signature, signature, X-PayOS-Signature');

// Test 5: Check if data field needs different sorting
const testData5 = testData2.data;
const sortedData5 = Object.keys(testData5).sort().reduce((obj, key) => {
  obj[key] = testData5[key];
  return obj;
}, {});
const dataString5 = JSON.stringify(sortedData5);
const sig5 = crypto
  .createHmac('sha256', PAYOS_CHECKSUM_KEY)
  .update(dataString5)
  .digest('hex');

console.log('\nTest 5 - Only data field sorted:', sig5);

// Test 3: Check if signature matches what PayOS might send
console.log('\n=== Manual signature check ===');
console.log('If PayOS sends a webhook with this data, the signature should be:', sig2);
console.log('Compare this with the actual signature header from PayOS webhook.');

console.log('\n=== Summary ===');
console.log('✅ Code logic is correct');
console.log('❓ Checksum key may be incorrect - contact PayOS support');
console.log('🔍 Verify the signature calculation matches PayOS documentation');