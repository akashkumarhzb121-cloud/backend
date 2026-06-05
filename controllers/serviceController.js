const Service  = require('../models/Service');
const AppError = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const { deleteImage, deleteImages } = require('../utils/cloudinaryHelpers');

// GET /api/services
exports.getAllServices = async (req, res, next) => {
  try {
    const filter = {};
    if (!req.user) filter.isActive = true;

    // ── FIX ─────────────────────────────────────────────────────────────────
    // The previous version ALWAYS called getPagination() which applies a
    // default limit of 10. So even when the frontend sent no ?page or ?limit
    // params, the query returned at most 10 services and silently dropped the
    // rest. This meant you could only ever see 10 services on the website no
    // matter how many you added in the admin panel.
    //
    // Fix: only paginate when the caller explicitly asks for it via ?page or
    // ?limit query params. Otherwise return every document in one shot.
    // ────────────────────────────────────────────────────────────────────────
    if (req.query.page || req.query.limit) {
      const { page, skip, limit } = getPagination(req.query);
      const [services, total] = await Promise.all([
        Service.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
        Service.countDocuments(filter),
      ]);
      return sendResponse(res, 200, 'Services fetched successfully', services, buildMeta(page, limit, total));
    }

    // No pagination params → return ALL services (no limit)
    const services = await Service.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select('-__v');

    sendResponse(res, 200, 'Services fetched successfully', services);
  } catch (err) { next(err); }
};

// GET /api/services/:id
exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).select('-__v');
    if (!service) return next(new AppError('Service not found.', 404));
    sendResponse(res, 200, 'Service fetched successfully', service);
  } catch (err) { next(err); }
};

// POST /api/services  (admin)
exports.createService = async (req, res, next) => {
  try {
    const { title, description, pricing, features, isActive, order } = req.body;
    const files = req.files || (req.file ? [req.file] : []);

    // Build media array — images and videos
    const media = files.map(file => ({
      url:          file.path,
      publicId:     file.filename,
      resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

    // Legacy single image field — first image in the upload
    const firstImage = files.find(f => !f.mimetype.startsWith('video/'));
    const image = firstImage
      ? { url: firstImage.path, publicId: firstImage.filename }
      : { url: null, publicId: null };

    const service = await Service.create({
      title,
      description,
      image,
      media,
      pricing:  pricing  ? (typeof pricing  === 'string' ? JSON.parse(pricing)  : pricing)  : undefined,
      features: features ? (Array.isArray(features)      ? features              : [features]) : [],
      isActive: isActive !== 'false' && isActive !== false,
      order:    order ? Number(order) : 0,
      createdBy: req.user._id,
    });

    sendResponse(res, 201, 'Service created successfully', service);
  } catch (err) { next(err); }
};

// PUT /api/services/:id  (admin)
exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return next(new AppError('Service not found.', 404));

    const { title, description, pricing, features, isActive, order, removeMedia } = req.body;
    const files = req.files || (req.file ? [req.file] : []);

    // Handle media removal
    let existingMedia = service.media || [];
    if (removeMedia) {
      const toRemove = Array.isArray(removeMedia) ? removeMedia : [removeMedia];
      await deleteImages(toRemove);
      existingMedia = existingMedia.filter(m => !toRemove.includes(m.publicId));
    }

    // New uploads
    const newMedia = files.map(file => ({
      url:          file.path,
      publicId:     file.filename,
      resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

    const allMedia = [...existingMedia, ...newMedia];

    // Sync legacy image field with first image in the combined set
    const firstImage = allMedia.find(m => m.resourceType === 'image');
    const image = firstImage
      ? { url: firstImage.url, publicId: firstImage.publicId }
      : service.image;

    const updated = await Service.findByIdAndUpdate(
      req.params.id,
      {
        ...(title       !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(pricing     !== undefined && { pricing: typeof pricing === 'string' ? JSON.parse(pricing) : pricing }),
        ...(features    !== undefined && { features: Array.isArray(features) ? features : [features] }),
        ...(isActive    !== undefined && { isActive: isActive !== 'false' && isActive !== false }),
        ...(order       !== undefined && { order: Number(order) }),
        image,
        media: allMedia,
      },
      { new: true, runValidators: true },
    );

    sendResponse(res, 200, 'Service updated successfully', updated);
  } catch (err) { next(err); }
};

// DELETE /api/services/:id  (admin)
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return next(new AppError('Service not found.', 404));
    await deleteImage(service.image?.publicId);
    await deleteImages((service.media || []).map(m => m.publicId));
    await service.deleteOne();
    sendResponse(res, 200, 'Service deleted successfully');
  } catch (err) { next(err); }
};
