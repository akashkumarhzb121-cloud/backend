const { wrapEmail, infoRow, ctaButton, BRAND } = require('./emailBase');

/**
 * Customer-facing inquiry reply email.
 */
function inquiryReplyEmail({ name, adminNotes, originalSubject }) {
  const websiteUrl = process.env.FRONTEND_URL || 'https://modplintinteriors.com';

  const body = `
    <!-- Icon -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#D4AF37 0%,#c9a227 100%);text-align:center;line-height:72px;">
        <span style="font-size:32px;">✉</span>
      </div>
    </div>

    <!-- Headline -->
    <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#1a1a1a;text-align:center;line-height:1.2;">
      We've Got Your Answer
    </h1>
    <p style="margin:0 0 36px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#7a6e60;text-align:center;letter-spacing:0.3px;">
      A response to your interior design enquiry
    </p>

    <!-- Greeting -->
    <p style="margin:0 0 20px;font-family:'Inter',Arial,sans-serif;font-size:16px;color:#1a1a1a;line-height:1.6;">
      Dear <strong>${name}</strong>,
    </p>
    <p style="margin:0 0 28px;font-family:'Inter',Arial,sans-serif;font-size:15px;color:#4a4540;line-height:1.7;">
      Thank you for reaching out to <strong style="color:#1a1a1a;">${BRAND.name}</strong>. 
      We appreciate your interest in our services. Our design team has reviewed your enquiry 
      and prepared the following response:
    </p>

    <!-- Original subject (if present) -->
    ${originalSubject ? `
    <p style="margin:0 0 8px;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#9a8c7a;text-transform:uppercase;letter-spacing:1.5px;">
      Re: ${originalSubject}
    </p>` : ''}

    <!-- Reply box -->
    <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2a251f 100%);border-radius:16px;padding:32px;margin-bottom:32px;position:relative;overflow:hidden;">
      <!-- Decorative quote mark -->
      <div style="position:absolute;top:16px;left:24px;font-family:Georgia,serif;font-size:60px;color:rgba(212,175,55,0.12);line-height:1;">&ldquo;</div>
      <!-- Gold accent -->
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#D4AF37,#c9a227,#D4AF37);"></div>

      <p style="margin:0 0 6px;font-family:'Inter',Arial,sans-serif;font-size:11px;color:#D4AF37;text-transform:uppercase;letter-spacing:3px;position:relative;">
        Response from our team
      </p>
      <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:15px;color:rgba(255,255,255,0.88);line-height:1.8;position:relative;white-space:pre-wrap;">
        ${adminNotes || 'Thank you for your enquiry. Our team will follow up with more details shortly.'}
      </p>
    </div>

    <!-- Follow-up nudge -->
    <div style="background:#faf8f4;border:1px solid #e8e0d0;border-radius:12px;padding:24px 28px;margin-bottom:32px;">
      <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:13px;font-weight:600;color:#9a8c7a;text-transform:uppercase;letter-spacing:2px;">Have More Questions?</p>
      <p style="margin:0 0 16px;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#4a4540;line-height:1.6;">
        We are always here to help. You can reply directly to this email, call us, or book a 
        no-obligation consultation to speak with one of our designers in person.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td width="20" style="vertical-align:top;padding-top:1px;"><span style="font-size:14px;">📞</span></td>
          <td style="padding-left:8px;"><p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;color:#4a4540;">${BRAND.phone}</p></td>
        </tr>
        <tr><td colspan="2" style="height:8px;"></td></tr>
        <tr>
          <td width="20" style="vertical-align:top;padding-top:1px;"><span style="font-size:14px;">📧</span></td>
          <td style="padding-left:8px;"><p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:13px;"><a href="mailto:${BRAND.email}" style="color:#D4AF37;">${BRAND.email}</a></p></td>
        </tr>
      </table>
    </div>

    <!-- CTA buttons -->
    <div style="text-align:center;margin-bottom:16px;">
      ${ctaButton('Book a Free Consultation', `${websiteUrl}/booking`)}
    </div>
    <div style="text-align:center;margin-bottom:32px;">
      ${ctaButton('View Our Services', `${websiteUrl}/services`, 'secondary')}
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
    preheader: `You have a reply from ${BRAND.name} regarding your interior design enquiry.`,
    body,
  });
}

/**
 * Admin notification when a new contact inquiry arrives.
 */
function contactAdminEmail({ name, email, phone, subject, message, ip }) {
  const body = `
    <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;color:#1a1a1a;">📬 New Contact Inquiry</h1>
    <div style="background:#faf8f4;border:1px solid #e8e0d0;border-radius:12px;padding:28px 32px;margin-bottom:24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        ${infoRow('Name', name)}
        ${infoRow('Email', `<a href="mailto:${email}" style="color:#D4AF37;">${email}</a>`)}
        ${infoRow('Phone', phone || '—')}
        ${infoRow('Subject', subject || '—')}
      </table>
    </div>
    <div style="background:#faf8f4;border:1px solid #e8e0d0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#9a8c7a;text-transform:uppercase;letter-spacing:1px;">Message</p>
      <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap;">${message}</p>
    </div>
    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:12px;color:#9a8c7a;">IP: ${ip || '—'}</p>
  `;
  return wrapEmail({ preheader: `New enquiry from ${name}: ${subject || 'No subject'}`, body });
}

module.exports = { inquiryReplyEmail, contactAdminEmail };
