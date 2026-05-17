const express = require('express');
const { body } = require('express-validator');

const contactController     = require('../controllers/contactController');
const { protect, restrictTo } = require('../middleware/auth');
const validate              = require('../middleware/validate');
const { generalRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('phone').optional().trim(),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }),
];

// Public — rate-limited
router.post('/', generalRateLimiter, contactValidation, validate, contactController.submitContact);

// Admin only
router.use(protect, restrictTo('admin', 'superadmin'));
router.get('/',             contactController.getAllContacts);
router.get('/:id',          contactController.getContact);
router.patch('/:id/status', contactController.updateContactStatus);
router.delete('/:id',       contactController.deleteContact);

module.exports = router;
