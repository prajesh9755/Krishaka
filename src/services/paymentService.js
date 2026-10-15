/**
 * Frontend Razorpay Payment Service
 * Connects frontend UI to the backend payment endpoints & Razorpay Checkout Modal
 */

/**
 * Dynamically loads the Razorpay checkout.js script if not present
 */
export function loadRazorpaySDK() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Main function to initiate Razorpay checkout
 * @param {Object} params
 * @param {number} params.amount - Total amount in INR (e.g. 5000 for ₹5,000)
 * @param {string} params.title - Title shown on modal (e.g. "Krishaka Escrow")
 * @param {string} params.description - Subtitle (e.g. "Payment for Onion Lot #102")
 * @param {Object} params.user - Current user { name, phone, email }
 * @param {Object} params.notes - Extra metadata to attach
 * @param {Function} params.onSuccess - Callback on verified payment (paymentId, orderId)
 * @param {Function} params.onError - Callback on error
 */
export async function initiateRazorpayPayment({
  amount,
  title = 'Krishaka Agri Marketplace',
  description = 'Crop Procurement Escrow Payment',
  user = {},
  notes = {},
  onSuccess,
  onError,
}) {
  try {
    // 1. Ensure Razorpay SDK is loaded
    const isSdkLoaded = await loadRazorpaySDK();
    if (!isSdkLoaded || !window.Razorpay) {
      throw new Error('Razorpay payment gateway SDK could not be loaded. Please check your internet connection.');
    }

    // 2. Call backend to create a Razorpay Order
    const createOrderResponse = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        currency: 'INR',
        notes: {
          userName: user.name || 'Agri Buyer',
          userPhone: user.phone || '',
          ...notes,
        },
      }),
    });

    const orderData = await createOrderResponse.json();

    if (!createOrderResponse.ok || !orderData.success) {
      throw new Error(orderData.error || 'Failed to initialize payment order on server.');
    }

    const { orderId, keyId } = orderData;
    const finalKeyId = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TnrNZFxSp1gbdf';

    // 3. Configure Razorpay Checkout Modal
    const options = {
      key: finalKeyId,
      amount: orderData.amount, // in paise
      currency: orderData.currency || 'INR',
      name: title,
      description: description,
      image: 'https://cdn-icons-png.flaticon.com/512/2917/2917995.png', // Krishaka / Agri icon
      order_id: orderId,
      prefill: {
        name: user.name || '',
        contact: user.phone || '',
        email: user.email || 'buyer@krishaka.in',
      },
      notes: {
        platform: 'Krishaka',
        ...notes,
      },
      theme: {
        color: '#B8562D', // Krishaka brand accent
      },
      modal: {
        ondismiss: function () {
          console.log('Payment modal dismissed by user');
        },
      },
      handler: async function (response) {
        // response contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
        try {
          // 4. Verify payment signature on backend
          const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok && verifyData.success) {
            if (onSuccess) {
              onSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: amount,
                verified: true,
              });
            }
          } else {
            throw new Error(verifyData.error || 'Payment signature verification failed.');
          }
        } catch (verifyErr) {
          console.error('Payment verification error:', verifyErr);
          if (onError) onError(verifyErr.message || 'Payment verification failed');
        }
      },
    };

    // 5. Open Razorpay Checkout modal
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (failResponse) {
      console.error('Razorpay payment failed:', failResponse.error);
      if (onError) {
        onError(failResponse.error?.description || 'Payment was declined or failed.');
      }
    });

    rzp.open();
  } catch (err) {
    console.error('Initiate Razorpay Error:', err);
    if (onError) onError(err.message || 'Could not initiate Razorpay payment');
  }
}
