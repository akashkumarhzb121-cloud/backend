const Testimonial = require('../models/Testimonial');
const AppError    = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const { deleteImage } = require('../utils/cloudinaryHelpers');

// GET /api/testimonials  (public — approved only; admin sees all)
exports.getAllTestimonials = async (req, res, next) => {
  try {
    const { page, skip, limit } = getPagination(req.query);

    const filter = {};
    if (!req.user) {
      filter.isApproved = true; // public: approved only
    } else if (req.query.approved !== undefined) {
      filter.isApproved = req.query.approved === 'true';
    }
    if (req.query.featured) filter.isFeatured = req.query.featured === 'true';

    const [testimonials, total] = await Promise.all([
      Testimonial.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
      Testimonial.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Testimonials fetched successfully', testimonials, buildMeta(page, limit, total));
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

// POST /api/testimonials  (public — submitted by user)
exports.createTestimonial = async (req, res, next) => {
  try {
    const { name, profession, review, rating, project } = req.body;

    const image = req.file
      ? { url: req.file.path, publicId: req.file.filename }
      : { url: null, publicId: null };

    const testimonial = await Testimonial.create({
      name, profession, review,
      rating: Number(rating),
      image,
      project: project || null,
      isApproved: false, // pending admin approval
    });

    sendResponse(res, 201, 'Thank you! Your testimonial has been submitted and is pending review.', {
      id: testimonial._id,
    });
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
      await deleteImage(testimonial.image?.publicId);
      image = { url: req.file.path, publicId: req.file.filename };
    }

    const updated = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        ...(name        !== undefined && { name }),
        ...(profession  !== undefined && { profession }),
        ...(review      !== undefined && { review }),
        ...(rating      !== undefined && { rating: Number(rating) }),
        ...(isApproved  !== undefined && { isApproved: isApproved === 'true' || isApproved === true }),
        ...(isFeatured  !== undefined && { isFeatured: isFeatured === 'true' || isFeatured === true }),
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

    await deleteImage(testimonial.image?.publicId);
    await testimonial.deleteOne();

    sendResponse(res, 200, 'Testimonial deleted successfully');
  } catch (err) {
    next(err);
  }
};
