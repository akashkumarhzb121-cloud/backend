const crypto    = require('crypto');
const Project   = require('../models/Project');
const AppError  = require('../utils/AppError');
const { sendResponse, getPagination, buildMeta } = require('../utils/response');
const { deleteImages } = require('../utils/cloudinaryHelpers');
const { cloudinary } = require('../config/cloudinary');

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

    if (req.query.page || req.query.limit) {
      const { page, skip, limit } = getPagination(req.query);
      const [projects, total] = await Promise.all([
        Project.find(filter).sort(sortOrder).skip(skip).limit(limit).select('-__v'),
        Project.countDocuments(filter),
      ]);
      return sendResponse(res, 200, 'Projects fetched successfully', projects, buildMeta(page, limit, total));
    }

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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/upload-signature  (admin)
//
// WHY THIS EXISTS:
//   Vercel Hobby has a hard 4.5 MB request-body limit.  When admins upload
//   photos from a phone camera (3–8 MB each) the POST /api/projects request
//   is rejected by Vercel before it ever reaches the Express handler.
//
// THE FIX — direct browser → Cloudinary upload:
//   1. Frontend calls this endpoint to get a short-lived signed signature.
//   2. Frontend uploads each file directly to Cloudinary's REST API
//      (https://api.cloudinary.com/v1_1/<cloud>/auto/upload).
//      That request goes straight to Cloudinary — it never touches Vercel.
//   3. Cloudinary returns a secure_url + public_id for each file.
//   4. Frontend calls POST /api/projects/save-urls (or PUT /:id/save-urls)
//      with only the JSON URLs — tiny payload, no files, no Vercel limit hit.
// ─────────────────────────────────────────────────────────────────────────────
exports.getUploadSignature = (req, res, next) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder    = 'interior-design/projects';

    // Parameters that MUST be signed (must match what the browser sends)
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
      .digest('hex');

    sendResponse(res, 200, 'Signature generated', {
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey:    process.env.CLOUDINARY_API_KEY,
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/projects/save-urls  (admin)
//
// Body (JSON):
//   {
//     title, description, category, location, budget, completionDate,
//     featured, isPublished, tags,
//     images: [{ url, publicId, resourceType }]   ← from Cloudinary responses
//   }
//
// No files — no Vercel body-size issue.
// ─────────────────────────────────────────────────────────────────────────────
exports.saveProjectUrls = async (req, res, next) => {
  try {
    const {
      title, description, category, location, budget,
      completionDate, featured, isPublished, tags, images,
    } = req.body;

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
      images:         Array.isArray(images) ? images : [],
      createdBy:      req.user._id,
    });

    sendResponse(res, 201, 'Project created successfully', project);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/projects/:id/save-urls  (admin)
//
// Same idea as saveProjectUrls but for edits.  Body (JSON):
//   {
//     title, description, …,
//     images:       [{ url, publicId, resourceType }],  ← new uploads
//     removeImages: ["publicId1", "publicId2"],          ← to delete
//     keepImages:   [{ url, publicId, resourceType }],  ← existing kept ones
//   }
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProjectUrls = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return next(new AppError('Project not found.', 404));

    const {
      title, description, category, location, budget,
      completionDate, featured, isPublished, tags,
      images = [], keepImages = [], removeImages = [],
    } = req.body;

    // Delete removed images from Cloudinary
    const toRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
    if (toRemove.length) await deleteImages(toRemove);

    // Final image array = kept existing + newly uploaded
    const keptArr = Array.isArray(keepImages) ? keepImages : [];
    const newArr  = Array.isArray(images)     ? images     : [];
    const finalImages = [...keptArr, ...newArr];

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
        images: finalImages,
      },
      { new: true, runValidators: true },
    );

    sendResponse(res, 200, 'Project updated successfully', updatedProject);
  } catch (err) { next(err); }
};

// POST /api/projects  (admin) — kept for backward compat / local dev
exports.createProject = async (req, res, next) => {
  try {
    const { title, description, category, location, budget, completionDate, featured, isPublished, tags } = req.body;

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

// PUT /api/projects/:id  (admin) — kept for backward compat / local dev
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
