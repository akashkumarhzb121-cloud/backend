const Contact  = require('../models/Contact');
const AppError = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const sendEmail = require('../utils/sendEmail');

// POST /api/contact  (public)
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const inquiry = await Contact.create({
      name, email, phone, subject, message,
      ipAddress: req.ip,
    });

    // Email notification to your inbox
    await sendEmail({
      to: process.env.NOTIFY_EMAIL || 'modplint@gmail.com',
      subject: subject ? `New Contact Inquiry: ${subject}` : 'New Contact Inquiry',
      text:
        `You received a new contact inquiry.\n\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone || ''}\n` +
        `Subject: ${subject || ''}\n` +
        `IP: ${req.ip}\n\n` +
        `Message:\n${message}\n`,
      html:
        `<p>You received a <b>new contact inquiry</b>.</p>` +
        `<ul>` +
        `<li><b>Name:</b> ${name}</li>` +
        `<li><b>Email:</b> ${email}</li>` +
        `<li><b>Phone:</b> ${phone || ''}</li>` +
        `<li><b>Subject:</b> ${subject || ''}</li>` +
        `<li><b>IP:</b> ${req.ip}</li>` +
        `</ul>` +
        `<p><b>Message</b></p>` +
        `<pre style="white-space:pre-wrap;">${message}</pre>`,
      replyTo: email,
    });

    sendResponse(res, 201, 'Your message has been sent successfully. We will get back to you shortly.', {
      id: inquiry._id,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/contact  (admin)
exports.getAllContacts = async (req, res, next) => {
  try {
    const { page, skip, limit } = getPagination(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
      Contact.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Inquiries fetched successfully', contacts, buildMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
};

// GET /api/contact/:id  (admin)
exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'read' } },
      { new: true }
    ).select('-__v');

    if (!contact) return next(new AppError('Inquiry not found.', 404));
    sendResponse(res, 200, 'Inquiry fetched successfully', contact);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/contact/:id/status  (admin)
exports.updateContactStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(adminNotes !== undefined && { adminNotes }) },
      { new: true, runValidators: true }
    );

    if (!contact) return next(new AppError('Inquiry not found.', 404));

    if (status === 'replied' || contact.status === 'replied') {
      await sendEmail({
        to: contact.email,
        subject: 'Your Interior Design Inquiry Update',
        text:
          `Hi ${contact.name},\n\n` +
          `Thanks for reaching out to us. Here is our reply:\n\n` +
          `${adminNotes || contact.adminNotes || '(No reply message provided by admin)'}\n\n` +
          `— Interior Design Team`,
        html:
          `<p>Hi <b>${contact.name}</b>,</p>` +
          `<p>Thanks for reaching out to us. Here is our reply:</p>` +
          `<pre style="white-space:pre-wrap;">${adminNotes || contact.adminNotes || '(No reply message provided by admin)'}</pre>` +
          `<p>— Interior Design Team</p>`,
      });
    }

    sendResponse(res, 200, 'Inquiry updated successfully', contact);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/contact/:id  (admin)
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return next(new AppError('Inquiry not found.', 404));
    sendResponse(res, 200, 'Inquiry deleted successfully');
  } catch (err) {
    next(err);
  }
};
