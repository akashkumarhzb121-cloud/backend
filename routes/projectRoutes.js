const express = require('express');
const { body } = require('express-validator');

const projectController = require('../controllers/projectController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createUploader } = require('../config/cloudinary');

const router = express.Router();
const upload = createUploader('projects');

// Validation for the metadata fields
const projectValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['Residential', 'Commercial', 'Office', 'Hospitality', 'Retail', 'Other'])
    .withMessage('Invalid category'),
];

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProject);

// ── Admin only ────────────────────────────────────────────────────────────────
router.use(protect, restrictTo('admin', 'superadmin'));

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Direct-upload flow (browser → Cloudinary → these endpoints)
//      Bypasses Vercel's 4.5 MB body limit entirely.
// ─────────────────────────────────────────────────────────────────────────────

// Step 1 — get a signed upload signature so the browser can upload directly
router.get('/upload-signature', projectController.getUploadSignature);

// Step 2a — create project with pre-uploaded Cloudinary URLs (JSON body, no files)
router.post(
  '/save-urls',
  projectValidation,
  validate,
  projectController.saveProjectUrls,
);

// Step 2b — update project with pre-uploaded Cloudinary URLs (JSON body, no files)
router.put(
  '/:id/save-urls',
  validate,
  projectController.updateProjectUrls,
);

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY: Old multer / file-in-body routes — kept for local dev & backward compat.
//         These still work locally but will hit Vercel's 4.5 MB limit in prod
//         for large files.  The frontend now uses the /save-urls routes instead.
// ─────────────────────────────────────────────────────────────────────────────
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
