/**
 * Modplint Interiors – Shared Email Base Template
 * Professional HTML email wrapper used by all transactional emails.
 */

const BRAND = {
  name: 'Modplint Interiors',
  tagline: 'Luxury Interior Design',
  email: process.env.EMAIL_USER || 'modplint@gmail.com',
  website: process.env.FRONTEND_URL || 'https://modplintinteriors.com',
  phone: process.env.CONTACT_PHONE || '+91 98765 43210',
  address: process.env.CONTACT_ADDRESS || 'Mumbai, Maharashtra, India',
  // Inline SVG logo – renders in all email clients without external image requests
  logoSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="40" viewBox="0 0 140 40">
    <rect width="140" height="40" rx="4" fill="#1a1a1a"/>
    <text x="12" y="15" font-family="Georgia, serif" font-size="8" fill="#D4AF37" letter-spacing="2">MODPLINT</text>
    <line x1="12" y1="18" x2="128" y2="18" stroke="#D4AF37" stroke-width="0.5" opacity="0.6"/>
    <text x="12" y="30" font-family="Georgia, serif" font-size="11" font-weight="bold" fill="#ffffff" letter-spacing="1">INTERIORS</text>
  </svg>`,
};

/**
 * Wraps content in a full branded email shell.
 * @param {object} opts
 * @param {string} opts.preheader  - Short preview text shown in inbox list
 * @param {string} opts.body       - Inner HTML content (between header and footer)
 * @param {string} [opts.accentColor] - Override accent (default: gold #D4AF37)
 */
function wrapEmail({ preheader, body, accentColor = '#D4AF37' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>${BRAND.name}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0;mso-table-rspace:0}
    img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block}
    body{margin:0;padding:0;background-color:#f4f1eb;font-family:'Inter',Arial,sans-serif}
    .preheader{display:none;max-width:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f1eb;opacity:0}
    a{color:${accentColor};text-decoration:none}
    @media only screen and (max-width:620px){
      .email-container{width:100%!important}
      .stack-column{display:block!important;width:100%!important;padding:0!important}
      .mobile-pad{padding:30px 20px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f1eb;">
  <!-- Preheader text -->
  <div class="preheader" style="display:none;max-width:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f1eb;opacity:0;">
    ${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Email wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f1eb;">
    <tr>
      <td align="center" style="padding:40px 10px;">
        <!-- Email container -->
        <table class="email-container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;margin:0 auto;">

          <!-- ── TOP LOGO BAR ── -->
          <tr>
            <td style="background:#1a1a1a;border-radius:12px 12px 0 0;padding:24px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <!-- Text-based logo (renders everywhere) -->
                    <div style="display:inline-block;border:1px solid rgba(212,175,55,0.4);border-radius:4px;padding:8px 14px;">
                      <div style="font-family:Georgia,'Times New Roman',serif;font-size:7px;color:${accentColor};letter-spacing:4px;text-transform:uppercase;margin-bottom:3px;">MODPLINT</div>
                      <div style="width:100%;height:0.5px;background:${accentColor};opacity:0.5;margin-bottom:4px;"></div>
                      <div style="font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:bold;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">INTERIORS</div>
                    </div>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:1.5px;text-transform:uppercase;">Luxury Interior Design</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── GOLD ACCENT BAR ── -->
          <tr>
            <td style="background:linear-gradient(90deg,${accentColor} 0%,#c9a227 50%,${accentColor} 100%);height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ── MAIN BODY ── -->
          <tr>
            <td class="mobile-pad" style="background:#ffffff;padding:48px 48px 40px;">
              ${body}
            </td>
          </tr>

          <!-- ── DIVIDER ── -->
          <tr>
            <td style="background:#ffffff;padding:0 48px;">
              <div style="border-top:1px solid #e8e0d0;"></div>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#1a1a1a;border-radius:0 0 12px 12px;padding:32px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <!-- Footer links -->
                    <p style="margin:0 0 14px;font-family:'Inter',Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:0.5px;">
                      <a href="${BRAND.website}" style="color:${accentColor};text-decoration:none;">Visit Website</a>
                      &nbsp;&bull;&nbsp;
                      <a href="mailto:${BRAND.email}" style="color:${accentColor};text-decoration:none;">Contact Us</a>
                      &nbsp;&bull;&nbsp;
                      <a href="${BRAND.website}/booking" style="color:${accentColor};text-decoration:none;">Book Consultation</a>
                    </p>
                    <p style="margin:0 0 6px;font-family:'Inter',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.35);">
                      ${BRAND.address} &nbsp;|&nbsp; ${BRAND.phone}
                    </p>
                    <p style="margin:0;font-family:'Inter',Arial,sans-serif;font-size:10px;color:rgba(255,255,255,0.2);">
                      &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.<br/>
                      You received this email because you interacted with us. 
                      <a href="${BRAND.website}" style="color:rgba(255,255,255,0.3);">Unsubscribe</a>
                    </p>
                  </td>
                  <td align="right" style="vertical-align:bottom;">
                    <p style="margin:0;font-family:Georgia,serif;font-size:18px;color:${accentColor};font-style:italic;opacity:0.7;">MI</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom spacer -->
          <tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Renders a labelled info row (used in detail tables).
 */
function infoRow(label, value, highlight = false) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ebe0;vertical-align:top;">
        <span style="font-family:'Inter',Arial,sans-serif;font-size:12px;color:#9a8c7a;text-transform:uppercase;letter-spacing:1px;">${label}</span>
      </td>
      <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f0ebe0;text-align:right;vertical-align:top;">
        <span style="font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:${highlight ? '700' : '500'};color:${highlight ? '#D4AF37' : '#1a1a1a'};">${value}</span>
      </td>
    </tr>`;
}

/**
 * Renders a CTA button.
 */
function ctaButton(label, href, style = 'primary') {
  const bg = style === 'primary' ? '#D4AF37' : '#1a1a1a';
  const fg = style === 'primary' ? '#1a1a1a' : '#ffffff';
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="border-radius:50px;background:${bg};">
          <a href="${href}" style="display:inline-block;padding:14px 36px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:600;color:${fg};text-decoration:none;letter-spacing:0.5px;border-radius:50px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

module.exports = { wrapEmail, infoRow, ctaButton, BRAND };
