const express = require('express');
const { body } = require('express-validator');

const bookingController       = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/auth');
const validate                = require('../middleware/validate');
const { generalRateLimiter }  = require('../middleware/rateLimiter');

const router = express.Router();

const VALID_PROJECT_TYPES = ['Residential', 'Commercial', 'Office', 'Hospitality', 'Retail', 'Other'];

const bookingValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('date').isISO8601().withMessage('Please provide a valid date').toDate(),
  body('time').trim().notEmpty().withMessage('Preferred time is required'),
  body('projectType')
    .trim()
    .notEmpty()
    .withMessage('Project type is required')
    .customSanitizer((val) => {
      if (!val) return val;
      return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    })
    .isIn(VALID_PROJECT_TYPES)
    .withMessage(`Project type must be one of: ${VALID_PROJECT_TYPES.join(', ')}`),
  body('budget')
    .optional()
    .isIn(['Under 10k', '10k–25k', '25k–50k', '50k–100k', '100k+', 'Not sure'])
    .withMessage('Invalid budget range'),
  body('message').optional().trim().isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
];

// Public — rate-limited
router.post('/', generalRateLimiter, bookingValidation, validate, bookingController.createBooking);

// Admin only
router.use(protect, restrictTo('admin', 'superadmin'));
router.get('/',             bookingController.getAllBookings);
router.get('/:id',          bookingController.getBooking);
router.patch('/:id/status', bookingController.updateBookingStatus);
router.delete('/:id',       bookingController.deleteBooking);

module.exports = router;
