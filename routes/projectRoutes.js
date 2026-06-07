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

// ── Public GET /:id — MUST be before router.use(protect, ...) ────────────────
// If this route is placed after router.use(protect), Express applies the auth
// middleware to it as well, causing unauthenticated visitors to get a 401,
// which the axios interceptor then redirects to /admin/login.
router.get('/:id', projectController.getProject);

// ── Admin only ────────────────────────────────────────────────────────────────
// IMPORTANT: The named routes below (upload-signature, save-urls) MUST be
// registered after the public GET /:id above, but they are still matched
// correctly because they are POST/PUT/DELETE — not GET — so there is no
// conflict with GET /:id.
router.use(protect, restrictTo('admin', 'superadmin'));

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
