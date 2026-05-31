const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

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
      amount: Math.round(Number(amount) * 100), // paise
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
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerName,
      customerEmail,
      serviceName,
      amount,
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

    // Send email to admin
    // FIX: sendEmail expects `to`, not `email`
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    const htmlBody = `
      <h2 style="color:#D4AF37;">New Payment Received!</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;">
        <tr><td style="padding:8px;font-weight:bold;">Service</td><td style="padding:8px;">${serviceName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Amount</td><td style="padding:8px;">₹${amount}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Customer</td><td style="padding:8px;">${customerName}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${customerEmail}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Payment ID</td><td style="padding:8px;">${razorpay_payment_id}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Order ID</td><td style="padding:8px;">${razorpay_order_id}</td></tr>
      </table>
    `;

    const textBody = `
New Payment Received!

Service: ${serviceName}
Amount: ₹${amount}
Customer: ${customerName} (${customerEmail})
Payment ID: ${razorpay_payment_id}
Order ID: ${razorpay_order_id}
    `;

    await sendEmail({
      to: adminEmail,           // FIX: was `email:` — sendEmail utility expects `to:`
      subject: `New Payment Received – ${serviceName} (₹${amount})`,
      text: textBody,
      html: htmlBody,
    });

    // Also send confirmation to customer
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: 'Payment Confirmed – Modplint Interiors',
        text: `Hi ${customerName},\n\nThank you for your payment of ₹${amount} for ${serviceName}.\nWe will contact you shortly.\n\nWarm regards,\nModplint Interiors`,
        html: `
          <h2 style="color:#D4AF37;">Payment Confirmed!</h2>
          <p>Hi <strong>${customerName}</strong>,</p>
          <p>Thank you for your payment of <strong>₹${amount}</strong> for <strong>${serviceName}</strong>.</p>
          <p>Our team will get in touch with you shortly.</p>
          <p>Warm regards,<br/><strong>Modplint Interiors</strong></p>
        `,
      });
    }

    res.status(200).json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};
