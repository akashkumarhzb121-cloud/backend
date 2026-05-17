const User    = require('../models/User');
const AppError = require('../utils/AppError');
const { createAndSendToken } = require('../utils/jwt');

// POST /api/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Prevent duplicate admins (optional: remove for multi-admin setups)
    const existing = await User.findOne({ email });
    if (existing) return next(new AppError('An account with this email already exists.', 409));

    const user = await User.create({ name, email, password });

    createAndSendToken(user, 201, res, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact support.', 403));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    createAndSendToken(user, 200, res, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = (_req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, message: 'Profile fetched', data: { user } });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/auth/update-password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect.', 401));
    }

    user.password          = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    createAndSendToken(user, 200, res, 'Password updated successfully');
  } catch (err) {
    next(err);
  }
};
