const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { paymentConfirmedEmail, paymentAdminEmail } = require('../utils/emailTemplates/paymentEmail');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { amount, serviceName } = req.body;
    if (!amount || !serviceName) {
      return res.status(400).json({ success: false, message: 'amount and serviceName are required' });
    }
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { serviceName },
    };
    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Could not create order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
      customerName, customerEmail, serviceName, amount,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment fields' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    // Admin notification
    await sendEmail({
      to: adminEmail,
      subject: `💰 New Payment Received — ${serviceName} (₹${amount})`,
      text: `New payment of ₹${amount} from ${customerName} (${customerEmail}) for ${serviceName}. Payment ID: ${razorpay_payment_id}`,
      html: paymentAdminEmail({ customerName, customerEmail, amount, serviceName, paymentId: razorpay_payment_id, orderId: razorpay_order_id }),
    });

    // Customer confirmation
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: `Payment Confirmed – ${serviceName} | Modplint Interiors`,
        text: `Hi ${customerName}, thank you for your payment of ₹${amount} for ${serviceName}. Our team will contact you shortly.\n\nWarm regards,\nModplint Interiors`,
        html: paymentConfirmedEmail({ customerName, amount, serviceName, paymentId: razorpay_payment_id, orderId: razorpay_order_id }),
      });
    }

    res.status(200).json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};
