const express = require('express');
const { body } = require('express-validator');
const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const testimonialController = require('../controllers/testimonialController');
const { protect, restrictTo } = require('../middleware/auth');
const validate               = require('../middleware/validate');
const { createUploader }     = require('../config/cloudinary');
const { generalRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const upload = createUploader('testimonials');

const testimonialValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('review').trim().notEmpty().withMessage('Review is required').isLength({ max: 1000 }),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
];

const optionalAuth = async (req, _res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('+isActive +role');
      if (user && user.isActive) req.user = user;
    }
  } catch { /* expired/invalid — treat as unauthenticated */ }
  next();
};

// Public
router.get('/',    optionalAuth, testimonialController.getAllTestimonials);
router.get('/:id', testimonialController.getTestimonial);

// Public review submission — multiple images/videos allowed
router.post(
  '/',
  generalRateLimiter,
  upload.array('media'),      // field name 'media' — supports images & videos
  testimonialValidation,
  validate,
  testimonialController.createTestimonial
);

// Admin-only
router.use(protect, restrictTo('admin', 'superadmin'));

router.post(
  '/admin-create',
  upload.array('media'),
  testimonialValidation,
  validate,
  testimonialController.createTestimonialAsAdmin
);

router.put('/:id',    upload.array('media'), validate, testimonialController.updateTestimonial);
router.delete('/:id', testimonialController.deleteTestimonial);

module.exports = router;
