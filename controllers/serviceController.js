const Service  = require('../models/Service');
const AppError = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const { deleteImage } = require('../utils/cloudinaryHelpers');

// GET /api/services
exports.getAllServices = async (req, res, next) => {
  try {
    const { page, skip, limit } = getPagination(req.query);

    const filter = {};
    if (!req.user) filter.isActive = true; // public: active only

    const [services, total] = await Promise.all([
      Service.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).select('-__v'),
      Service.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Services fetched successfully', services, buildMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
};

// GET /api/services/:id
exports.getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).select('-__v');
    if (!service) return next(new AppError('Service not found.', 404));
    sendResponse(res, 200, 'Service fetched successfully', service);
  } catch (err) {
    next(err);
  }
};

// POST /api/services  (admin)
exports.createService = async (req, res, next) => {
  try {
    const { title, description, pricing, features, isActive, order } = req.body;

    const image = req.file
      ? { url: req.file.path, publicId: req.file.filename }
      : { url: null, publicId: null };

    const service = await Service.create({
      title,
      description,
      image,
      pricing: pricing ? (typeof pricing === 'string' ? JSON.parse(pricing) : pricing) : undefined,
      features: features ? (Array.isArray(features) ? features : [features]) : [],
      isActive: isActive !== 'false' && isActive !== false,
      order:    order ? Number(order) : 0,
      createdBy: req.user._id,
    });

    sendResponse(res, 201, 'Service created successfully', service);
  } catch (err) {
    next(err);
  }
};

// PUT /api/services/:id  (admin)
exports.updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return next(new AppError('Service not found.', 404));

    const { title, description, pricing, features, isActive, order } = req.body;

    let image = service.image;
    if (req.file) {
      // Delete old image from Cloudinary
      await deleteImage(service.image?.publicId);
      image = { url: req.file.path, publicId: req.file.filename };
    }

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
      },
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, 'Service updated successfully', updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/services/:id  (admin)
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return next(new AppError('Service not found.', 404));

    await deleteImage(service.image?.publicId);
    await service.deleteOne();

    sendResponse(res, 200, 'Service deleted successfully');
  } catch (err) {
    next(err);
  }
};
