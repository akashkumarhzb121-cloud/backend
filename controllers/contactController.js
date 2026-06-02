const Contact  = require('../models/Contact');
const AppError = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const sendEmail = require('../utils/sendEmail');
const { inquiryReplyEmail, contactAdminEmail } = require('../utils/emailTemplates/contactEmail');

// POST /api/contact  (public)
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const inquiry = await Contact.create({ name, email, phone, subject, message, ipAddress: req.ip });

    await sendEmail({
      to: process.env.NOTIFY_EMAIL || 'modplint@gmail.com',
      subject: subject ? `📬 New Enquiry: ${subject}` : '📬 New Contact Inquiry',
      text: `New enquiry from ${name} (${email}): ${message}`,
      html: contactAdminEmail({ name, email, phone, subject, message, ip: req.ip }),
      replyTo: email,
    });

    sendResponse(res, 201, 'Your message has been sent successfully. We will get back to you shortly.', { id: inquiry._id });
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
      req.params.id, { $set: { status: 'read' } }, { new: true }
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

    if (status === 'replied') {
      await sendEmail({
        to: contact.email,
        subject: `Re: ${contact.subject || 'Your Interior Design Enquiry'} | Modplint Interiors`,
        text: `Hi ${contact.name},\n\nThank you for reaching out. Here is our reply:\n\n${adminNotes || contact.adminNotes || ''}\n\n— Modplint Interiors Team`,
        html: inquiryReplyEmail({
          name: contact.name,
          adminNotes: adminNotes || contact.adminNotes,
          originalSubject: contact.subject,
        }),
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
