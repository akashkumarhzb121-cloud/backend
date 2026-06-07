const express = require('express');
const { body } = require('express-validator');

const projectController = require('../controllers/projectController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createUploader } = require('../config/cloudinary');

const router = express.Router();
const upload = createUploader('projects');

const projectValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['Residential', 'Commercial', 'Office', 'Hospitality', 'Retail', 'Other'])
    .withMessage('Invalid category'),
];

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', projectController.getAllProjects);

// ── Admin GET /upload-signature — MUST be before GET /:id ────────────────────
// If registered after /:id, Express matches "upload-signature" as the :id param
// → 400 "Invalid _id: upload-signature". We apply protect inline here so this
// route stays admin-only while GET /:id below can remain fully public.
router.get(
  '/upload-signature',
  protect,
  restrictTo('admin', 'superadmin'),
  projectController.getUploadSignature,
);

// ── Public GET /:id ───────────────────────────────────────────────────────────
// No auth middleware — any visitor can view a project detail page without
// being redirected to /admin/login.
router.get('/:id', projectController.getProject);

// ── All routes below are admin-only ──────────────────────────────────────────
router.use(protect, restrictTo('admin', 'superadmin'));

// Create project with pre-uploaded Cloudinary URLs (JSON body, no files)
router.post(
  '/save-urls',
  projectValidation,
  validate,
  projectController.saveProjectUrls,
);

// Update project with pre-uploaded Cloudinary URLs (JSON body, no files)
router.put(
  '/:id/save-urls',
  validate,
  projectController.updateProjectUrls,
);

// Legacy multer routes (local dev only — hit Vercel 4.5 MB limit for large files)
router.post(
  '/',
  upload.array('images'),
  projectValidation,
  validate,
  projectController.createProject,
);

router.put(
  '/:id',
  upload.array('images'),
  validate,
  projectController.updateProject,
);

router.delete('/:id', projectController.deleteProject);

module.exports = router;
