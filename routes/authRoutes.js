const express = require('express');
const { body } = require('express-validator');

const authController    = require('../controllers/authController');
const { protect }       = require('../middleware/auth');
const validate          = require('../middleware/validate');
const { authRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation chains
const signupValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/signup', authRateLimiter, signupValidation, validate, authController.signup);
router.post('/login',  authRateLimiter, loginValidation,  validate, authController.login);
router.post('/logout', authController.logout);

// Protected
router.use(protect);
router.get('/me', authController.getMe);
router.patch(
  '/update-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  authController.updatePassword
);

module.exports = router;
