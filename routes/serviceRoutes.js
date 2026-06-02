const express = require('express');
const { body } = require('express-validator');
const serviceController     = require('../controllers/serviceController');
const { protect, restrictTo } = require('../middleware/auth');
const validate              = require('../middleware/validate');
const { createUploader }    = require('../config/cloudinary');

const router = express.Router();
const upload = createUploader('services');

const serviceValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Description is required'),
];

// Public
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getService);

// Admin only
router.use(protect, restrictTo('admin', 'superadmin'));

// Use array() to support multiple images + videos (unlimited)
router.post('/', upload.array('media'), serviceValidation, validate, serviceController.createService);
router.put('/:id', upload.array('media'), validate, serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

module.exports = router;
