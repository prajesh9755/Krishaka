const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Initialize Razorpay with credentials from .env
const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TnrNZFxSp1gbdf';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '4mtIiE43xOCiPQZQIHzOh7SH';

const razorpay = new Razorpay({
  key_id: key_id,
  key_secret: key_secret,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Krishaka Razorpay Payment Gateway Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 1. Get Public Key ID for Frontend
app.get('/api/payment/key', (req, res) => {
  res.json({
    success: true,
    keyId: key_id,
  });
});

// 2. Create Order API
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'A valid amount is required' });
    }

    // Convert amount in INR to Paise (1 INR = 100 Paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: receipt || `krishaka_rcpt_${Date.now()}`,
      notes: notes || { platform: 'Krishaka Agri Marketplace' },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      amountInRupees: Number(amount),
      currency: order.currency,
      receipt: order.receipt,
      keyId: key_id,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order',
    });
  }
});

// 3. Verify Payment Signature API
app.post('/api/payment/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification parameters',
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      res.status(200).json({
        success: true,
        verified: true,
        message: 'Payment verified successfully!',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid payment signature',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Verification error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`💳 Razorpay Payment Server running on http://localhost:${PORT}`);
  console.log(`🔑 Key ID in use: ${key_id}`);
});