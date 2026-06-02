const { wrapEmail, infoRow, ctaButton, BRAND } = require('./emailBase');

/**
 * Customer-facing booking confirmation email.
 */
function bookingConfirmedEmail({ name, date, time, projectType, adminNotes }) {
  const websiteUrl = process.env.FRONTEND_URL || 'https://modplintinteriors.com';

  // Format the date nicely
  const formattedDate = (() => {
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch {
      return String(date);
    }
  })();

  const body = `
    <!-- Calendar icon -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:72px;height:72px;border-radius:12px;background:#1a1a1a;text-align:center;line-height:72px;">
        <span style="font-size:36px;">📅</span>
      </div>
    </div>

    <!-- Headline -->
    <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#1a1a1a;text-align:center;line-height:1.2;">
      Consultation Confirmed
    </h1>
    <p style="margin:0 0 36px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#7a6e60;text-align:center;letter-spacing:0.3px;">
      Your booking with ${BRAND.name} is all set
    </p>

    <!-- Greeting -->
    <p style="margin:0 0 20px;font-family:'Inter',Arial,sans-serif;font-size:16px;color:#1a1a1a;line-height:1.6;">
      Dear <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 32px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#4a4540;line-height:1.7;">
      Wonderful news — your design consultation has been <strong style="color:#1a1a1a;">confirmed</strong>. 
      We are excited to explore your vision and begin crafting a space that reflects your unique 
      taste and lifestyle.
    </p>

    <!-- Appointment summary card -->
    <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2820 100%);border-radius:16px;padding:32px;margin-bottom:32px;text-align:center;position:relative;overflow:hidden;">
      <!-- Gold top border -->
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#D4AF37,#c9a227,#D4AF37);"></div>
      
      <p style="margin:0 0 6px;font-family:'Inter',Arial,sans-serif;font-size:11px;color:#D4AF37;text-transform:uppercase;letter-spacing:3px;">Your Appointment</p>
      
      <div style="margin:16px 0;">
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:26px;color:#ffffff;font-weight:700;">${formattedDate}</p>
        <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:18px;color:#D4AF37;font-weight:500;">${time}</p>
      </div>

      <div style="border-top:1px solid rgba(212,175,55,0.2);margin:20px 0;"></div>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="text-align:center;padding:0 10px;">
            <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Project Type</p>
            <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#ffffff;font-weight:500;">${projectType}</p>
          </td>
        </tr>
      </table>

      ${adminNotes ? `
      <div style="border-top:1px solid rgba(212,175,55,0.2);margin:20px 0;padding-top:16px;">
        <p style="margin:0 0 8px;font-family:'Inter',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;">Message from our team</p>
        <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:rgba(255,255,255,0.8);font-style:italic;line-height:1.6;">"${adminNotes}"</p>
      </div>` : ''}
    </div>

    <!-- Prep tips -->
    <div style="background:#faf8f4;border:1px solid #e8e0d0;border-radius:12px;padding:24px 28px;margin-bottom:32px;">
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:13px;font-weight:600;color:#9a8c7a;text-transform:uppercase;letter-spacing:2px;">How to Prepare</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        ${[
          ['🏠', 'Gather photos or inspiration images of spaces you love (Pinterest boards welcome!)'],
          ['📐', 'Note down approximate room dimensions if available'],
          ['💡', 'Think about your must-haves, budget range, and timeline'],
          ['🎨', 'Have a rough idea of your preferred colour palette or style direction'],
        ].map(([icon, text]) => `
          <tr>
            <td width="30" style="vertical-align:top;padding:5px 0;">
              <span style="font-size:16px;">${icon}</span>
            </td>
            <td style="vertical-align:top;padding:5px 0 5px 8px;">
              <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#4a4540;line-height:1.5;">${text}</p>
            </td>
          </tr>`).join('')}
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      ${ctaButton('View Our Work', `${websiteUrl}/projects`)}
    </div>

    <!-- Signature -->
    <div style="border-left:3px solid #D4AF37;padding-left:18px;">
      <p style="margin:0 0 4px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#1a1a1a;">Warm regards,</p>
      <p style="margin:0;font-family:Georgia,serif;font-size:16px;font-weight:700;color:#1a1a1a;">The ${BRAND.name} Team</p>
      <p style="margin:4px 0 0;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#9a8c7a;">${BRAND.email} &nbsp;|&nbsp; ${BRAND.phone}</p>
    </div>
  `;

  return wrapEmail({
    preheader: `Your consultation on ${formattedDate} at ${time} is confirmed!`,
    body,
  });
}

/**
 * Customer-facing booking CANCELLATION email.
 */
function bookingCancelledEmail({ name, date, time, projectType, adminNotes }) {
  const websiteUrl = process.env.FRONTEND_URL || 'https://modplintinteriors.com';
  const formattedDate = (() => {
    try {
      return new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return String(date); }
  })();

  const body = `
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;color:#1a1a1a;text-align:center;">Booking Update</h1>
    <p style="margin:0 0 36px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#7a6e60;text-align:center;">Regarding your consultation with ${BRAND.name}</p>

    <p style="margin:0 0 20px;font-family:'Inter',Arial,sans-serif;font-size:16px;color:#1a1a1a;">Dear <strong>${name}</strong>,</p>
    <p style="margin:0 0 28px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#4a4540;line-height:1.7;">
      We regret to inform you that your consultation booking for <strong>${formattedDate}</strong> at 
      <strong>${time}</strong> (${projectType}) has been cancelled.
    </p>
    ${adminNotes ? `
    <div style="background:#faf8f4;border:1px solid #e8e0d0;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 8px;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#9a8c7a;text-transform:uppercase;letter-spacing:1px;">Note from our team</p>
      <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">${adminNotes}</p>
    </div>` : ''}
    <p style="margin:0 0 32px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#4a4540;line-height:1.7;">
      We apologise for any inconvenience. Please feel free to book a new consultation at a time that suits you.
    </p>
    <div style="text-align:center;margin-bottom:32px;">
      ${ctaButton('Book a New Consultation', `${websiteUrl}/booking`)}
    </div>
    <div style="border-left:3px solid #D4AF37;padding-left:18px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:15px;color:#1a1a1a;">The ${BRAND.name} Team</p>
      <p style="margin:4px 0 0;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#9a8c7a;">${BRAND.email}</p>
    </div>
  `;

  return wrapEmail({ preheader: `Booking update regarding your consultation on ${formattedDate}`, body });
}

/**
 * Admin notification for a new booking.
 */
function bookingAdminEmail({ name, email, phone, date, time, projectType, budget, message }) {
  const formattedDate = (() => {
    try {
      return new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return String(date); }
  })();

  const body = `
    <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;color:#1a1a1a;">📋 New Consultation Booking</h1>
    <div style="background:#faf8f4;border:1px solid #e8e0d0;border-radius:12px;padding:28px 32px;margin-bottom:24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        ${infoRow('Name', name)}
        ${infoRow('Email', email)}
        ${infoRow('Phone', phone || '—')}
        ${infoRow('Date', formattedDate, true)}
        ${infoRow('Time', time, true)}
        ${infoRow('Project Type', projectType)}
        ${infoRow('Budget', budget || 'Not specified')}
      </table>
    </div>
    ${message ? `
    <div style="background:#faf8f4;border:1px solid #e8e0d0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#9a8c7a;text-transform:uppercase;letter-spacing:1px;">Client Message</p>
      <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.6;">${message}</p>
    </div>` : ''}
    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#7a6e60;">Log in to your admin panel to confirm or manage this booking.</p>
  `;
  return wrapEmail({ preheader: `New booking from ${name} on ${formattedDate} at ${time}`, body });
}

module.exports = { bookingConfirmedEmail, bookingCancelledEmail, bookingAdminEmail };
