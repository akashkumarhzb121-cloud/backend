const Project   = require('../models/Project');
const AppError  = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const { deleteImages } = require('../utils/cloudinaryHelpers');

// GET /api/projects
exports.getAllProjects = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category  = req.query.category;
    if (req.query.featured) filter.featured  = req.query.featured === 'true';
    if (req.query.published !== undefined) {
      filter.isPublished = req.query.published !== 'false';
    } else {
      if (!req.user) filter.isPublished = true;
    }
    if (req.query.search) filter.$text = { $search: req.query.search };

    const sortOrder = req.query.search
      ? { score: { $meta: 'textScore' } }
      : { createdAt: -1 };

    // ── FIX ─────────────────────────────────────────────────────────────────
    // Only paginate when the caller explicitly passes ?page or ?limit.
    // Without this guard, the old code fell into the paginated branch due to
    // the way getPagination() returns defaults, silently limiting results to
    // 10 documents. Adding a 6th or 7th project would succeed in MongoDB but
    // the frontend would never see it because the API capped the response at 10.
    // ────────────────────────────────────────────────────────────────────────
    if (req.query.page || req.query.limit) {
      const { page, skip, limit } = getPagination(req.query);
      const [projects, total] = await Promise.all([
        Project.find(filter).sort(sortOrder).skip(skip).limit(limit).select('-__v'),
        Project.countDocuments(filter),
      ]);
      return sendResponse(res, 200, 'Projects fetched successfully', projects, buildMeta(page, limit, total));
    }

    // No pagination → return ALL matching projects
    const projects = await Project.find(filter).sort(sortOrder).select('-__v');
    sendResponse(res, 200, 'Projects fetched successfully', projects);
  } catch (err) { next(err); }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).select('-__v');
    if (!project) return next(new AppError('Project not found.', 404));
    sendResponse(res, 200, 'Project fetched successfully', project);
  } catch (err) { next(err); }
};

// POST /api/projects  (admin)
exports.createProject = async (req, res, next) => {
  try {
    const { title, description, category, location, budget, completionDate, featured, isPublished, tags } = req.body;

    // Each file from our custom CloudinaryStreamStorage has:
    //   file.path      → secure_url  (used as `url`)
    //   file.filename  → public_id   (used as `publicId`)
    //   file.mimetype  → original MIME type
    const images = (req.files || []).map((file) => ({
      url:          file.path,
      publicId:     file.filename,
      resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

    const project = await Project.create({
      title,
      description,
      category,
      location,
      budget:         budget         ? Number(budget) : null,
      completionDate: completionDate || null,
      featured:       featured  === 'true'  || featured  === true,
      isPublished:    isPublished !== 'false' && isPublished !== false,
      tags:           tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      images,
      createdBy: req.user._id,
    });

    sendResponse(res, 201, 'Project created successfully', project);
  } catch (err) { next(err); }
};

// PUT /api/projects/:id  (admin)
exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(new AppError('Project not found.', 404));

    const { title, description, category, location, budget, completionDate, featured, isPublished, tags } = req.body;

    const newImages = (req.files || []).map((file) => ({
      url:          file.path,
      publicId:     file.filename,
      resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
    }));

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
        ...(title          !== undefined && { title }),
        ...(description    !== undefined && { description }),
        ...(category       !== undefined && { category }),
        ...(location       !== undefined && { location }),
        ...(budget         !== undefined && { budget: Number(budget) }),
        ...(completionDate !== undefined && { completionDate }),
        ...(featured       !== undefined && { featured: featured === 'true' || featured === true }),
        ...(isPublished    !== undefined && { isPublished: isPublished !== 'false' && isPublished !== false }),
        ...(tags           !== undefined && { tags: Array.isArray(tags) ? tags : [tags] }),
        images: [...existingImages, ...newImages],
      },
      { new: true, runValidators: true },
    );

    sendResponse(res, 200, 'Project updated successfully', updatedProject);
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id  (admin)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(new AppError('Project not found.', 404));
    await deleteImages(project.images.map((img) => img.publicId));
    await project.deleteOne();
    sendResponse(res, 200, 'Project deleted successfully');
  } catch (err) { next(err); }
};
