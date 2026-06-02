const { wrapEmail, infoRow, ctaButton, BRAND } = require('./emailBase');

/**
 * Generates a beautifully branded payment confirmation email for the customer.
 */
function paymentConfirmedEmail({ customerName, amount, serviceName, paymentId, orderId }) {
  const websiteUrl = process.env.FRONTEND_URL || 'https://modplintinteriors.com';

  const body = `
    <!-- Checkmark badge -->
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#D4AF37,#c9a227);text-align:center;line-height:72px;">
        <span style="font-size:32px;color:#1a1a1a;">✓</span>
      </div>
    </div>

    <!-- Headline -->
    <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;color:#1a1a1a;text-align:center;line-height:1.2;">
      Payment Confirmed!
    </h1>
    <p style="margin:0 0 36px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#7a6e60;text-align:center;letter-spacing:0.3px;">
      Thank you for choosing ${BRAND.name}
    </p>

    <!-- Greeting -->
    <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:16px;color:#1a1a1a;line-height:1.6;">
      Dear <strong>${customerName}</strong>,
    </p>
    <p style="margin:0 0 32px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#4a4540;line-height:1.7;">
      We are delighted to confirm receipt of your payment. Your trust in 
      <strong style="color:#1a1a1a;">${BRAND.name}</strong> means the world to us, 
      and we are committed to delivering an exceptional interior design experience tailored 
      exclusively to your vision.
    </p>

    <!-- Payment details card -->
    <div style="background:#faf8f4;border:1px solid #e8e0d0;border-radius:12px;padding:28px 32px;margin-bottom:32px;">
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:13px;font-weight:600;color:#9a8c7a;text-transform:uppercase;letter-spacing:2px;">
        Payment Receipt
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        ${infoRow('Service', serviceName)}
        ${infoRow('Amount Paid', `&#8377;${Number(amount).toLocaleString('en-IN')}`, true)}
        ${infoRow('Payment ID', paymentId)}
        ${infoRow('Order ID', orderId)}
        ${infoRow('Date', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }))}
        ${infoRow('Status', '<span style="background:#d4edda;color:#155724;padding:2px 10px;border-radius:20px;font-size:12px;">&#10003; Confirmed</span>')}
      </table>
    </div>

    <!-- What happens next -->
    <div style="background:#1a1a1a;border-radius:12px;padding:28px 32px;margin-bottom:32px;">
      <p style="margin:0 0 18px;font-family:Georgia,serif;font-size:13px;font-weight:600;color:#D4AF37;text-transform:uppercase;letter-spacing:2px;">
        What Happens Next
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="36" style="vertical-align:top;padding-top:2px;">
            <div style="width:26px;height:26px;border-radius:50%;background:#D4AF37;text-align:center;line-height:26px;font-family:'Inter',Arial,sans-serif;font-size:12px;font-weight:700;color:#1a1a1a;">1</div>
          </td>
          <td style="padding-left:12px;padding-bottom:14px;">
            <p style="margin:0 0 2px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;">Our team will reach out</p>
            <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;">
              A dedicated design consultant will contact you within 24 business hours to schedule your onboarding call.
            </p>
          </td>
        </tr>
        <tr>
          <td width="36" style="vertical-align:top;padding-top:2px;">
            <div style="width:26px;height:26px;border-radius:50%;background:#D4AF37;text-align:center;line-height:26px;font-family:'Inter',Arial,sans-serif;font-size:12px;font-weight:700;color:#1a1a1a;">2</div>
          </td>
          <td style="padding-left:12px;padding-bottom:14px;">
            <p style="margin:0 0 2px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;">Discovery consultation</p>
            <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;">
              We'll deeply understand your lifestyle, aesthetic preferences, and project goals.
            </p>
          </td>
        </tr>
        <tr>
          <td width="36" style="vertical-align:top;">
            <div style="width:26px;height:26px;border-radius:50%;background:#D4AF37;text-align:center;line-height:26px;font-family:'Inter',Arial,sans-serif;font-size:12px;font-weight:700;color:#1a1a1a;">3</div>
          </td>
          <td style="padding-left:12px;">
            <p style="margin:0 0 2px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;">Design journey begins</p>
            <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;">
              Our designers craft a bespoke concept board and mood deck exclusively for your space.
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      ${ctaButton('Explore Our Portfolio', `${websiteUrl}/projects`)}
    </div>

    <!-- Signature -->
    <div style="border-left:3px solid #D4AF37;padding-left:18px;">
      <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">
        Warm regards,
      </p>
      <p style="margin:0;font-family:Georgia,serif;font-size:16px;font-weight:700;color:#1a1a1a;">
        The ${BRAND.name} Team
      </p>
      <p style="margin:4px 0 0;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#9a8c7a;">
        ${BRAND.email} &nbsp;|&nbsp; ${BRAND.phone}
      </p>
    </div>
  `;

  return wrapEmail({
    preheader: `Payment of ₹${amount} for ${serviceName} is confirmed. Welcome to Modplint Interiors!`,
    body,
  });
}

/**
 * Admin notification email when a payment is received.
 */
function paymentAdminEmail({ customerName, customerEmail, amount, serviceName, paymentId, orderId }) {
  const body = `
    <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:24px;color:#1a1a1a;">
      💰 New Payment Received
    </h1>
    <p style="margin:0 0 24px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#4a4540;line-height:1.7;">
      A new payment has been successfully processed on your platform.
    </p>
    <div style="background:#faf8f4;border:1px solid #e8e0d0;border-radius:12px;padding:28px 32px;margin-bottom:24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        ${infoRow('Customer', customerName)}
        ${infoRow('Email', customerEmail)}
        ${infoRow('Service', serviceName)}
        ${infoRow('Amount', `&#8377;${Number(amount).toLocaleString('en-IN')}`, true)}
        ${infoRow('Payment ID', paymentId)}
        ${infoRow('Order ID', orderId)}
        ${infoRow('Date & Time', new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' }))}
      </table>
    </div>
    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#7a6e60;">
      Log into your admin panel to view full transaction details.
    </p>
  `;
  return wrapEmail({
    preheader: `New payment: ₹${amount} from ${customerName} for ${serviceName}`,
    body,
  });
}

module.exports = { paymentConfirmedEmail, paymentAdminEmail };
