const { PayOS, WebhookError, Webhook } = require('@payos/node');
require('dotenv').config();

/**
 * PayOS Webhook Debug Script
 * Based on PayOS SDK example: https://github.com/payOSHQ/payos-lib-node/blob/main/examples/webhook-handling.ts
 */

// PayOS Configuration
const PAYOS_CLIENT_ID = '1e267ccb-fbfe-446e-8dcf-1c20881d65e5';
const PAYOS_API_KEY = 'f0566b1e-381b-4a8f-bd02-eced96238517';
const PAYOS_CHECKSUM_KEY = '4383e890ca0eb06140810527e938bbde97bc7f8fc52a93f861b9a678e98e043f';

// Mock webhook data for testing (same as received in logs)
const mockWebhookData = {
  code: '00',
  desc: 'success',
  success: true,
  data: {
    orderCode: 123,
    amount: 3000,
    description: 'VQRIO123',
    accountNumber: '12345678',
    reference: 'TF230204212323',
    transactionDateTime: '2023-02-04 18:25:00',
    paymentLinkId: '124c33293c43417ab7879e14c8d9eb18',
    code: '00',
    desc: 'Thành công',
    counterAccountBankId: '',
    counterAccountBankName: '',
    counterAccountName: '',
    counterAccountNumber: '',
    virtualAccountName: '',
    virtualAccountNumber: '',
    currency: 'VND'
  },
  signature: '1945a809971e3a02a6592df680ee4ac19ffab74d9fe4e509456319b7e3f44e7c'
};

async function debugWebhookVerification() {
  console.log('🔍 PayOS Webhook Debug Script');
  console.log('================================');

  // Initialize PayOS
  const payos = new PayOS(PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY);
  console.log('✅ PayOS initialized');

  // Calculate expected signature
  console.log('\n📝 Calculating expected signature...');
  try {
    const expectedSignature = await payos.crypto.createSignatureFromObj(mockWebhookData.data, payos.checksumKey);
    console.log('Expected signature:', expectedSignature);
    console.log('Received signature:', mockWebhookData.signature);
    console.log('Signatures match:', expectedSignature === mockWebhookData.signature);
  } catch (error) {
    console.error('❌ Error calculating signature:', error.message);
  }

  // Test webhook verification
  console.log('\n🔐 Testing webhook verification...');
  try {
    const verifiedData = await payos.webhooks.verify(mockWebhookData);
    console.log('✅ Webhook verified successfully!');
    console.log('Verified data:', JSON.stringify(verifiedData, null, 2));
  } catch (error) {
    if (error instanceof WebhookError) {
      console.error('❌ Webhook verification failed:', error.message);
      console.log('This might be a fraudulent webhook request');
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }

  // Test webhook registration
  console.log('\n📡 Testing webhook registration...');
  try {
    const webhookUrl = 'https://daily.telebox.vn/api/webhook/payos';
    console.log('Registering webhook URL:', webhookUrl);

    const confirmResult = await payos.webhooks.confirm(webhookUrl);
    console.log('✅ Webhook registered successfully:', confirmResult);
  } catch (error) {
    if (error instanceof WebhookError) {
      console.error('❌ Webhook registration failed:', error.message);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }

  console.log('\n🎯 Debug completed!');
}

// Test payment creation
async function debugPaymentCreation() {
  console.log('\n💳 Testing payment creation...');

  const payos = new PayOS(PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY);

  const paymentData = {
    orderCode: Date.now(),
    amount: 19872,
    description: 'Test payment', // Keep under 25 chars
    returnUrl: 'https://daily.telebox.vn/payment/success',
    cancelUrl: 'https://daily.telebox.vn/payment/cancel',
    items: [{
      name: 'Test payment',
      quantity: 1,
      price: 19872
    }]
  };

  try {
    const result = await payos.paymentRequests.create(paymentData);
    console.log('✅ Payment created successfully:', result);
  } catch (error) {
    console.error('❌ Payment creation failed:', error.message);
  }
}

// Run debug functions
async function main() {
  await debugWebhookVerification();
  await debugPaymentCreation();
}

main().catch(console.error);