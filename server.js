const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const dotenv       = require('dotenv');
const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const AppError     = require('./utils/AppError');

// Load env variables FIRST
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://interiordesign15.vercel.app',
      'https://modplint.vercel.app',
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} is not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────────
// Body Parsing
// ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Interior Design API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/projects',     require('./routes/projectRoutes'));
app.use('/api/services',     require('./routes/serviceRoutes'));
app.use('/api/contact',      require('./routes/contactRoutes'));
app.use('/api/bookings',     require('./routes/bookingRoutes'));
app.use('/api/testimonials', require('./routes/testimonialRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// ─────────────────────────────────────────────
// Root route (prevents Vercel probe hitting `/` and returning 404)
// ─────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Interior Design API is running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      projects: '/api/projects',
      services: '/api/services',
      contact: '/api/contact',
      bookings: '/api/bookings',
      testimonials: '/api/testimonials',
    },
  });
});

// ─────────────────────────────────────────────
// 404 — Unmatched Routes
// ─────────────────────────────────────────────
app.all('*', (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404));
});

// ─────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

app.locals = { server };

// Handle unhandled promise rejections (e.g. DB connection drop)
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err.name, err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.name, err.message);
  process.exit(1);
});

module.exports = app;