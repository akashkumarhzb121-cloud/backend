const express = require('express');
const { body } = require('express-validator');

const testimonialController = require('../controllers/testimonialController');
const { protect, restrictTo } = require('../middleware/auth');
const validate              = require('../middleware/validate');
const { createUploader }    = require('../config/cloudinary');
const { generalRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const upload = createUploader('testimonials');

const testimonialValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('review').trim().notEmpty().withMessage('Review is required').isLength({ max: 1000 }),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
];

// Public
router.get('/', testimonialController.getAllTestimonials);
router.get('/:id', testimonialController.getTestimonial);
router.post(
  '/',
  generalRateLimiter,
  upload.single('image'),
  testimonialValidation,
  validate,
  testimonialController.createTestimonial
);

// Admin only
router.use(protect, restrictTo('admin', 'superadmin'));
router.put('/:id',    upload.single('image'), validate, testimonialController.updateTestimonial);
router.delete('/:id', testimonialController.deleteTestimonial);

module.exports = router;
