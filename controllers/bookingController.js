const Booking  = require('../models/Booking');
const AppError = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');

// POST /api/bookings  (public)
exports.createBooking = async (req, res, next) => {
  try {
    const { name, email, phone, date, time, projectType, budget, message } = req.body;

    const booking = await Booking.create({ name, email, phone, date, time, projectType, budget, message });

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
