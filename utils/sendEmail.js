const { transporter } = require('../config/email');

const sendEmail = async ({
  to,
  subject,
  text,
  html,
  replyTo,
}) => {
  const fromName = process.env.EMAIL_FROM_NAME || 'Interior Design';
  const fromAddress = process.env.EMAIL_USER;

  if (!transporter || !process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    // Fail gracefully if email isn't configured.
    console.warn('Email transport not configured. Skipping email send.');
    return { skipped: true };
  }

  const message = {
    from: fromAddress
      ? `${fromName} <${fromAddress}>`
      : `${fromName} <no-reply@localhost>`,
    to,
    subject,
    text,
    html,
    replyTo,
  };

  return transporter.sendMail(message);
};

module.exports = sendEmail;

