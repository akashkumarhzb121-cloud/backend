const Project   = require('../models/Project');
const AppError  = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const { deleteImages } = require('../utils/cloudinaryHelpers');

// GET /api/projects
exports.getAllProjects = async (req, res, next) => {
  try {
    const { page, skip, limit } = getPagination(req.query);

    // Build filter
    const filter = {};
    if (req.query.category)   filter.category    = req.query.category;
    if (req.query.featured)   filter.featured     = req.query.featured === 'true';
    if (req.query.published !== undefined) {
      filter.isPublished = req.query.published !== 'false';
    } else {
      // Public endpoint shows only published; admin can override with ?published=false
      if (!req.user) filter.isPublished = true;
    }

    // Search
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort(req.query.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Project.countDocuments(filter),
    ]);

    sendResponse(res, 200, 'Projects fetched successfully', projects, buildMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).select('-__v');
    if (!project) return next(new AppError('Project not found.', 404));
    sendResponse(res, 200, 'Project fetched successfully', project);
  } catch (err) {
    next(err);
  }
};

// POST /api/projects  (admin)
exports.createProject = async (req, res, next) => {
  try {
    const { title, description, category, location, budget, completionDate, featured, isPublished, tags } = req.body;

    // Build images array from Multer/Cloudinary
    const images = (req.files || []).map((file) => ({
      url:      file.path,
      publicId: file.filename,
    }));

    const project = await Project.create({
      title, description, category, location,
      budget: budget ? Number(budget) : null,
      completionDate: completionDate || null,
      featured:    featured === 'true' || featured === true,
      isPublished: isPublished !== 'false' && isPublished !== false,
      tags:        tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      images,
      createdBy: req.user._id,
    });

    sendResponse(res, 201, 'Project created successfully', project);
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id  (admin)
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(new AppError('Project not found.', 404));

    const { title, description, category, location, budget, completionDate, featured, isPublished, tags } = req.body;

    // New uploads
    const newImages = (req.files || []).map((file) => ({
      url:      file.path,
      publicId: file.filename,
    }));

    // Merge new images with existing (client can send removeImages: ["publicId1", ...] to remove specific ones)
    let existingImages = project.images;
    if (req.body.removeImages) {
      const toRemove = Array.isArray(req.body.removeImages)
        ? req.body.removeImages
        : [req.body.removeImages];
      await deleteImages(toRemove);
      existingImages = existingImages.filter((img) => !toRemove.includes(img.publicId));
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        ...(title         !== undefined && { title }),
        ...(description   !== undefined && { description }),
        ...(category      !== undefined && { category }),
        ...(location      !== undefined && { location }),
        ...(budget        !== undefined && { budget: Number(budget) }),
        ...(completionDate !== undefined && { completionDate }),
        ...(featured      !== undefined && { featured: featured === 'true' || featured === true }),
        ...(isPublished   !== undefined && { isPublished: isPublished !== 'false' && isPublished !== false }),
        ...(tags          !== undefined && { tags: Array.isArray(tags) ? tags : [tags] }),
        images: [...existingImages, ...newImages],
      },
      { new: true, runValidators: true }
    );

    sendResponse(res, 200, 'Project updated successfully', updatedProject);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id  (admin)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(new AppError('Project not found.', 404));

    // Remove all images from Cloudinary
    await deleteImages(project.images.map((img) => img.publicId));
    await project.deleteOne();

    sendResponse(res, 200, 'Project deleted successfully');
  } catch (err) {
    next(err);
  }
};
