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

// ─── optionalAuth ─────────────────────────────────────────────────────────────
// Attaches req.user if a valid Bearer token is present — never blocks the request.
// This lets GET /testimonials return:
//   - approved-only  to the public  (no token)
//   - ALL records    to admins      (valid token)
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
  } catch {
    // expired / invalid token — silently ignore, treat as unauthenticated
  }
  next();
};

// ─── Public routes ────────────────────────────────────────────────────────────

// FIX: optionalAuth added — admin token now reaches req.user in controller
// Public visitors: only approved shown | Admin: all (pending + approved) shown
router.get('/',    optionalAuth, testimonialController.getAllTestimonials);
router.get('/:id', testimonialController.getTestimonial);

// User-submitted review — saves with isApproved: false, waits for admin approval
router.post(
  '/',
  generalRateLimiter,
  upload.single('image'),
  testimonialValidation,
  validate,
  testimonialController.createTestimonial
);

// ─── Admin-only routes ────────────────────────────────────────────────────────
router.use(protect, restrictTo('admin', 'superadmin'));

// FIX: separate admin creation route — saves with isApproved: true (live immediately)
router.post(
  '/admin-create',
  upload.single('image'),
  testimonialValidation,
  validate,
  testimonialController.createTestimonialAsAdmin
);

router.put('/:id',    upload.single('image'), validate, testimonialController.updateTestimonial);
router.delete('/:id', testimonialController.deleteTestimonial);

module.exports = router;
