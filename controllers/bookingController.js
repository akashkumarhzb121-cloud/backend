const Booking  = require('../models/Booking');
const AppError = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const sendEmail = require('../utils/sendEmail');

// POST /api/bookings  (public)
exports.createBooking = async (req, res, next) => {
  try {
    const { name, email, phone, date, time, projectType, budget, message } = req.body;

    const booking = await Booking.create({ name, email, phone, date, time, projectType, budget, message });

    await sendEmail({
      to: process.env.NOTIFY_EMAIL || 'modplint@gmail.com',
      subject: 'New Consultation Booking',
      text:
        `You received a new consultation booking.\n\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone}\n` +
        `Date: ${date}\n` +
        `Time: ${time}\n` +
        `Project Type: ${projectType}\n` +
        `Budget: ${budget}\n` +
        `Message:\n${message || ''}\n`,
      html:
        `<p>You received a <b>new consultation booking</b>.</p>` +
        `<ul>` +
        `<li><b>Name:</b> ${name}</li>` +
        `<li><b>Email:</b> ${email}</li>` +
        `<li><b>Phone:</b> ${phone}</li>` +
        `<li><b>Date:</b> ${date}</li>` +
        `<li><b>Time:</b> ${time}</li>` +
        `<li><b>Project Type:</b> ${projectType}</li>` +
        `<li><b>Budget:</b> ${budget}</li>` +
        `</ul>` +
        `<p><b>Message</b></p>` +
        `<pre style="white-space:pre-wrap;">${message || ''}</pre>`,
      replyTo: email,
    });

    sendResponse(res, 201, 'Consultation booked successfully! We will confirm your appointment shortly.', {
      id: booking._id,
      date: booking.date,
      time: booking.time,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings  (admin)
exports.getAllBookings = async (req, res, next) => {
  try {
    const { page, skip, limit } = getPagination(req.query);

    const filter = {};
    if (req.query.status)      filter.status      = req.query.status;
    if (req.query.projectType) filter.projectType  = req.query.projectType;

    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) filter.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo)   filter.date.$lte = new Date(req.query.dateTo);
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter).sort({ date: 1, createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
      Booking.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Bookings fetched successfully', bookings, buildMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id  (admin)
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).select('-__v');
    if (!booking) return next(new AppError('Booking not found.', 404));
    sendResponse(res, 200, 'Booking fetched successfully', booking);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/bookings/:id/status  (admin)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(adminNotes !== undefined && { adminNotes }) },
      { new: true, runValidators: true }
    );

    if (!booking) return next(new AppError('Booking not found.', 404));

    // Visitor notification only for the accepted/positive step
    // (confirmed / cancelled)
    if (status === 'confirmed' || status === 'cancelled' || booking.status === 'confirmed' || booking.status === 'cancelled') {
      const isCancelled = (status || booking.status) === 'cancelled';

      await sendEmail({
        to: booking.email,
        subject: isCancelled
          ? 'Your Consultation Booking Update'
          : 'Your Consultation Booking Confirmed',
        text:
          `Hi ${booking.name},\n\n` +
          (isCancelled
            ? 'We are sorry to inform you that your consultation booking has been cancelled.\n\n'
            : 'Good news! Your consultation booking has been confirmed.\n\n') +
          `Date: ${booking.date}\n` +
          `Time: ${booking.time}\n` +
          `Project Type: ${booking.projectType}\n\n` +
          `Notes: ${adminNotes !== undefined ? adminNotes : booking.adminNotes || ''}\n\n` +
          '— Interior Design Team',
        html:
          `<p>Hi <b>${booking.name}</b>,</p>` +
          `<p>${isCancelled ? 'We are sorry to inform you that your consultation booking has been cancelled.' : 'Good news! Your consultation booking has been confirmed.'}</p>` +
          `<ul>` +
          `<li><b>Date:</b> ${booking.date}</li>` +
          `<li><b>Time:</b> ${booking.time}</li>` +
          `<li><b>Project Type:</b> ${booking.projectType}</li>` +
          `</ul>` +
          `<p><b>Notes:</b> ${adminNotes !== undefined ? adminNotes : booking.adminNotes || ''}</p>` +
          `<p>— Interior Design Team</p>`,
      });
    }

    sendResponse(res, 200, 'Booking updated successfully', booking);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/bookings/:id  (admin)
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return next(new AppError('Booking not found.', 404));
    sendResponse(res, 200, 'Booking deleted successfully');
  } catch (err) {
    next(err);
  }
};
