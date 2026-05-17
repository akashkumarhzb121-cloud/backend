const Contact  = require('../models/Contact');
const AppError = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');

// POST /api/contact  (public)
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    const inquiry = await Contact.create({
      name, email, phone, message,
      ipAddress: req.ip,
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
      { $set: { status: 'read' } }, // Mark as read on open
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
