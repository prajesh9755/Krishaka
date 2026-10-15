/**
 * Razorpay Payment Gateway Helper Module
 * Keys loaded from .env
 */
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TnrNZFxSp1gbdf';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '4mtIiE43xOCiPQZQIHzOh7SH';

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: key_id,
  key_secret: key_secret,
});

/**
 * 1. Create a Razorpay Order
 * @param {number} amountInRupees - The amount in Indian Rupees (e.g. 500 for ₹500)
 * @param {string} receiptId - Unique receipt identifier
 * @param {object} notes - Optional metadata (farmerId, buyerId, cropName, etc.)
 * @returns {Promise<object>} Razorpay Order Object
 */
async function createOrder(amountInRupees, receiptId = `rcpt_${Date.now()}`, notes = {}) {
  try {
    if (!amountInRupees || amountInRupees <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const options = {
      amount: Math.round(amountInRupees * 100), // Convert ₹ to Paise
      currency: 'INR',
      receipt: receiptId,
      notes: {
        platform: 'Krishaka Agri Marketplace',
        ...notes,
      },
    };

    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created successfully:', order.id);
    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      amountInRupees: amountInRupees,
      currency: order.currency,
      receipt: order.receipt,
      keyId: key_id,
    };
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 2. Verify Razorpay Payment Signature
 * @param {string} razorpayOrderId - The order ID from Razorpay
 * @param {string} razorpayPaymentId - The payment ID returned by Razorpay Checkout
 * @param {string} razorpaySignature - The signature returned by Razorpay Checkout
 * @returns {boolean} True if signature is authentic, false otherwise
 */
function verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isValid = generatedSignature === razorpaySignature;
    console.log(`🔒 Signature check: ${isValid ? 'VERIFIED' : 'FAILED'}`);
    return isValid;
  } catch (error) {
    console.error('❌ Error during signature verification:', error);
    return false;
  }
}

// Export for use in Node.js server
module.exports = {
  razorpay,
  createOrder,
  verifyPayment,
  key_id,
};

// Self-test if run directly via `node payment.js`
if (require.main === module) {
  console.log('Testing Razorpay Connection...');
  console.log('Key ID:', key_id);
  createOrder(100, 'test_receipt_001', { test: true }).then((res) => {
    console.log('Test Order Result:', res);
  });
}
