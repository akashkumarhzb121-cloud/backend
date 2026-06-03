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

// ─── CORS ─────────────────────────────────────────────────────────────────
// Hard-coded fallback origins. Override at runtime via CLIENT_URL env var
// (comma-separated list, e.g. "https://www.modplintinteriors.com,https://modplintinteriors.com")
const FALLBACK_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  // Custom domain — both www and apex
  'https://modplintinteriors.com',
  'https://www.modplintinteriors.com',
  // Vercel preview / old deployments
  'https://interiordesign15.vercel.app',
  'https://modplint.vercel.app',
];

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : FALLBACK_ORIGINS;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, mobile apps, curl)
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

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Interior Design API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/projects',     require('./routes/projectRoutes'));
app.use('/api/services',     require('./routes/serviceRoutes'));
app.use('/api/contact',      require('./routes/contactRoutes'));
app.use('/api/bookings',     require('./routes/bookingRoutes'));
app.use('/api/testimonials', require('./routes/testimonialRoutes'));
app.use('/api/payments',     require('./routes/paymentRoutes'));

// ─── Root ──────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Modplint Interiors API is running',
    domain: 'https://www.modplintinteriors.com',
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

// ─── 404 ───────────────────────────────────────────────────────────────────
app.all('*', (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404));
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

app.locals = { server };

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err.name, err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.name, err.message);
  process.exit(1);
});

module.exports = app;
