const nodemailer = require('nodemailer');

if (!process.env.EMAIL_HOST) {
  // Allow the app to boot without email configured (e.g., local dev).
  console.warn('EMAIL_HOST is not set. Email notifications are disabled.');
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : false,
  auth: process.env.EMAIL_USER
    ? {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    : undefined,
});

module.exports = { transporter };

