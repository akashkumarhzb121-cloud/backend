const express = require('express');
const { body } = require('express-validator');

const projectController = require('../controllers/projectController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createUploader } = require('../config/cloudinary');

const router = express.Router();
const upload = createUploader('projects');

// Validation
const projectValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['Residential', 'Commercial', 'Office', 'Hospitality', 'Retail', 'Other'])
    .withMessage('Invalid category'),
];

// Public
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProject);

// Admin only
router.use(protect, restrictTo('admin', 'superadmin'));

router.post(
  '/',
  upload.array('images', 10), // up to 10 images
  projectValidation,
  validate,
  projectController.createProject
);

router.put(
  '/:id',
  upload.array('images', 10),
  validate,
  projectController.updateProject
);

router.delete('/:id', projectController.deleteProject);

module.exports = router;
