const Razorpay = require('razorpay');
const crypto = require('crypto');
// Assuming you have a sendEmail utility from your previous SMTP setup
const sendEmail = require('../utils/sendEmail'); 

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { amount, serviceName } = req.body;

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (multiply by 100)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { serviceName }
    };

    const order = await razorpay.orders.create(options);
    
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
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
      amount 
    } = req.body;

    // Verify the payment signature to ensure it's authentic
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment is successful and verified
      // Send SMTP Email Notification to Admin
      const message = `
        New Payment Received!
        
        Service: ${serviceName}
        Amount: ₹${amount}
        Customer: ${customerName} (${customerEmail})
        Payment ID: ${razorpay_payment_id}
        Order ID: ${razorpay_order_id}
      `;

      await sendEmail({
        email: 'your-admin-email@example.com', // Replace with your email
        subject: `New Payment Received for ${serviceName}`,
        message,
      });

      res.status(200).json({ success: true, message: 'Payment verified and email sent' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};