const express = require('express');
const { body } = require('express-validator');

const bookingController     = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/auth');
const validate              = require('../middleware/validate');
const { generalRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const bookingValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('date').isISO8601().withMessage('Please provide a valid date').toDate(),
  body('time').trim().notEmpty().withMessage('Preferred time is required'),
  body('projectType')
    .isIn(['Residential', 'Commercial', 'Office', 'Hospitality', 'Retail', 'Other'])
    .withMessage('Invalid project type'),
];

// Public — rate-limited
router.post('/', generalRateLimiter, bookingValidation, validate, bookingController.createBooking);

// Admin only
router.use(protect, restrictTo('admin', 'superadmin'));
router.get('/',                   bookingController.getAllBookings);
router.get('/:id',                bookingController.getBooking);
router.patch('/:id/status',       bookingController.updateBookingStatus);
router.delete('/:id',             bookingController.deleteBooking);

module.exports = router;
