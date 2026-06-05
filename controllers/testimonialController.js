const Testimonial = require('../models/Testimonial');
const AppError    = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const { deleteImage, deleteImages } = require('../utils/cloudinaryHelpers');

// GET /api/testimonials
exports.getAllTestimonials = async (req, res, next) => {
  try {
    const filter = {};
    if (!req.user) {
      filter.isApproved = true;
    } else if (req.query.approved !== undefined) {
      filter.isApproved = req.query.approved === 'true';
    }
    if (req.query.featured) filter.isFeatured = req.query.featured === 'true';

    // ── FIX ─────────────────────────────────────────────────────────────────
    // Same pagination bug as services & projects: the old code always applied
    // getPagination() with a default limit of 10, even when the frontend sent
    // no ?page or ?limit params. This silently capped testimonials at 10.
    // Now we only paginate on explicit request.
    // ────────────────────────────────────────────────────────────────────────
    if (req.query.page || req.query.limit) {
      const { page, skip, limit } = getPagination(req.query);
      const [testimonials, total] = await Promise.all([
        Testimonial.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
        Testimonial.countDocuments(filter),
      ]);
      return sendResponse(res, 200, 'Testimonials fetched successfully', testimonials, buildMeta(page, limit, total));
    }

    // No pagination → return all testimonials
    const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 }).select('-__v');
    sendResponse(res, 200, 'Testimonials fetched successfully', testimonials);
  } catch (err) { next(err); }
};

// GET /api/testimonials/:id
exports.getTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id).select('-__v');
    if (!testimonial) return next(new AppError('Testimonial not found.', 404));
    sendResponse(res, 200, 'Testimonial fetched successfully', testimonial);
  } catch (err) { next(err); }
};

// POST /api/testimonials  (public submission — pending approval)
exports.createTestimonial = async (req, res, next) => {
  try {
    const { name, profession, review, rating, project } = req.body;
    const files = req.files || (req.file ? [req.file] : []);

    const media = files.map(file => ({
      url:          file.path,
      publicId:     file.filename,
      resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

    const firstImage = files.find(f => !f.mimetype.startsWith('video/'));
    const image = firstImage
      ? { url: firstImage.path, publicId: firstImage.filename }
      : { url: null, publicId: null };

    const testimonial = await Testimonial.create({
      name,
      profession: profession || '',
      review,
      rating:     Number(rating),
      image,
      media,
      project:    project || null,
      isApproved: false,
    });

    sendResponse(
      res,
      201,
      'Thank you! Your testimonial has been submitted and is pending review.',
      { id: testimonial._id },
    );
  } catch (err) { next(err); }
};

// POST /api/testimonials/admin-create  (admin — published immediately)
exports.createTestimonialAsAdmin = async (req, res, next) => {
  try {
    const { name, profession, review, rating, project } = req.body;
    const files = req.files || (req.file ? [req.file] : []);

    const media = files.map(file => ({
      url:          file.path,
      publicId:     file.filename,
      resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

    const firstImage = files.find(f => !f.mimetype.startsWith('video/'));
    const image = firstImage
      ? { url: firstImage.path, publicId: firstImage.filename }
      : { url: null, publicId: null };

    const testimonial = await Testimonial.create({
      name,
      profession: profession || '',
      review,
      rating:     Number(rating),
      image,
      media,
      project:    project || null,
      isApproved: true,
    });

    sendResponse(res, 201, 'Testimonial created and published successfully.', testimonial);
  } catch (err) { next(err); }
};

// PUT /api/testimonials/:id  (admin)
exports.updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return next(new AppError('Testimonial not found.', 404));

    const { name, profession, review, rating, isApproved, isFeatured, removeMedia } = req.body;
    const files = req.files || (req.file ? [req.file] : []);

    let existingMedia = testimonial.media || [];
    if (removeMedia) {
      const toRemove = Array.isArray(removeMedia) ? removeMedia : [removeMedia];
      await deleteImages(toRemove);
      existingMedia = existingMedia.filter(m => !toRemove.includes(m.publicId));
    }

    const newMedia = files.map(file => ({
      url:          file.path,
      publicId:     file.filename,
      resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

    const allMedia = [...existingMedia, ...newMedia];

    const firstImage = allMedia.find(m => m.resourceType === 'image');
    const image = firstImage
      ? { url: firstImage.url, publicId: firstImage.publicId }
      : testimonial.image;

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
        media: allMedia,
      },
      { new: true, runValidators: true },
    );

    sendResponse(res, 200, 'Testimonial updated successfully', updated);
  } catch (err) { next(err); }
};

// DELETE /api/testimonials/:id  (admin)
exports.deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return next(new AppError('Testimonial not found.', 404));
    if (testimonial.image?.publicId) await deleteImage(testimonial.image.publicId);
    await deleteImages((testimonial.media || []).map(m => m.publicId));
    await testimonial.deleteOne();
    sendResponse(res, 200, 'Testimonial deleted successfully');
  } catch (err) { next(err); }
};
