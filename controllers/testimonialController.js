const Testimonial = require('../models/Testimonial');
const AppError    = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const { deleteImage } = require('../utils/cloudinaryHelpers');

// GET /api/testimonials
// Public (no token)  → approved only, all of them
// Admin  (with token) → ALL records including pending — req.user set by optionalAuth
exports.getAllTestimonials = async (req, res, next) => {
  try {
    const filter = {};

    if (!req.user) {
      // Public visitor — only show approved
      filter.isApproved = true;
    } else if (req.query.approved !== undefined) {
      // Admin passed explicit ?approved=true/false filter
      filter.isApproved = req.query.approved === 'true';
    }
    // Admin with no filter → no isApproved constraint → returns ALL

    if (req.query.featured) filter.isFeatured = req.query.featured === 'true';

    // FIX: only paginate when caller explicitly passes ?page or ?limit
    // Without those params (normal page loads) return every record — no 10-item cap
    if (req.query.page || req.query.limit) {
      const { page, skip, limit } = getPagination(req.query);
      const [testimonials, total] = await Promise.all([
        Testimonial.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
        Testimonial.countDocuments(filter),
      ]);
      return sendResponse(res, 200, 'Testimonials fetched successfully', testimonials, buildMeta(page, limit, total));
    }

    const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 }).select('-__v');
    sendResponse(res, 200, 'Testimonials fetched successfully', testimonials);
  } catch (err) {
    next(err);
  }
};

// GET /api/testimonials/:id
exports.getTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id).select('-__v');
    if (!testimonial) return next(new AppError('Testimonial not found.', 404));
    sendResponse(res, 200, 'Testimonial fetched successfully', testimonial);
  } catch (err) {
    next(err);
  }
};

// POST /api/testimonials  (public — website visitor submits a review)
// Saved as isApproved: false — admin must approve it before it shows publicly
exports.createTestimonial = async (req, res, next) => {
  try {
    const { name, profession, review, rating, project } = req.body;

    const image = req.file
      ? { url: req.file.path, publicId: req.file.filename }
      : { url: null, publicId: null };

    const testimonial = await Testimonial.create({
      name,
      profession: profession || '',
      review,
      rating:     Number(rating),
      image,
      project:    project || null,
      isApproved: false,
    });

    sendResponse(res, 201, 'Thank you! Your testimonial has been submitted and is pending review.', {
      id: testimonial._id,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/testimonials/admin-create  (admin only)
// FIX: admin-created testimonials go live immediately with isApproved: true
exports.createTestimonialAsAdmin = async (req, res, next) => {
  try {
    const { name, profession, review, rating, project } = req.body;

    const image = req.file
      ? { url: req.file.path, publicId: req.file.filename }
      : { url: null, publicId: null };

    const testimonial = await Testimonial.create({
      name,
      profession: profession || '',
      review,
      rating:     Number(rating),
      image,
      project:    project || null,
      isApproved: true,  // immediately live on the website
    });

    sendResponse(res, 201, 'Testimonial created and published successfully.', testimonial);
  } catch (err) {
    next(err);
  }
};

// PUT /api/testimonials/:id  (admin)
exports.updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return next(new AppError('Testimonial not found.', 404));

    const { name, profession, review, rating, isApproved, isFeatured } = req.body;

    let image = testimonial.image;
    if (req.file) {
      if (testimonial.image?.publicId) await deleteImage(testimonial.image.publicId);
      image = { url: req.file.path, publicId: req.file.filename };
    }

    const updated = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        ...(name       !== undefined && { name }),
        ...(profession !== undefined && { profession }),
        ...(review     !== undefined && { review }),
        ...(rating     !== undefined && { rating: Number(rating) }),
        ...(isApproved !== undefined && { isApproved: isApproved === 'true' || isApproved === true }),
        ...(isFeatured !== undefined && { isFeatured: isFeatured === 'true' || isFeatured === true }),
        image,
      },
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, 'Testimonial updated successfully', updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/testimonials/:id  (admin)
exports.deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return next(new AppError('Testimonial not found.', 404));

    if (testimonial.image?.publicId) await deleteImage(testimonial.image.publicId);
    await testimonial.deleteOne();

    sendResponse(res, 200, 'Testimonial deleted successfully');
  } catch (err) {
    next(err);
  }
};
