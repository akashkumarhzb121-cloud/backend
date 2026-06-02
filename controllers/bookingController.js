const Booking  = require('../models/Booking');
const AppError = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const sendEmail = require('../utils/sendEmail');
const { bookingConfirmedEmail, bookingCancelledEmail, bookingAdminEmail } = require('../utils/emailTemplates/bookingEmail');

// POST /api/bookings  (public)
exports.createBooking = async (req, res, next) => {
  try {
    const { name, email, phone, date, time, projectType, budget, message } = req.body;
    const booking = await Booking.create({ name, email, phone, date, time, projectType, budget, message });

    // Admin notification
    await sendEmail({
      to: process.env.NOTIFY_EMAIL || 'modplint@gmail.com',
      subject: `📋 New Consultation Booking — ${name}`,
      text: `New booking from ${name} (${email}) on ${date} at ${time} for ${projectType}.`,
      html: bookingAdminEmail({ name, email, phone, date, time, projectType, budget, message }),
      replyTo: email,
    });

    sendResponse(res, 201, 'Consultation booked successfully! We will confirm your appointment shortly.', {
      id: booking._id, date: booking.date, time: booking.time,
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

    if (status === 'confirmed' || status === 'cancelled') {
      const isCancelled = status === 'cancelled';
      const emailHtml = isCancelled
        ? bookingCancelledEmail({ name: booking.name, date: booking.date, time: booking.time, projectType: booking.projectType, adminNotes: adminNotes ?? booking.adminNotes })
        : bookingConfirmedEmail({ name: booking.name, date: booking.date, time: booking.time, projectType: booking.projectType, adminNotes: adminNotes ?? booking.adminNotes });

      await sendEmail({
        to: booking.email,
        subject: isCancelled
          ? `Booking Update | Modplint Interiors`
          : `Your Consultation is Confirmed | Modplint Interiors`,
        text: isCancelled
          ? `Hi ${booking.name}, your booking on ${booking.date} at ${booking.time} has been cancelled.`
          : `Hi ${booking.name}, your consultation on ${booking.date} at ${booking.time} is confirmed!`,
        html: emailHtml,
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
