/**
 * seed.js — Run ONCE to create the first admin account.
 *
 * Usage:
 *   node seed.js
 *
 * It reads MONGO_URI from your .env file (same as the main server).
 * Safe to run multiple times — skips creation if the email already exists.
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');

dotenv.config();

// ─── Admin credentials — change these before running ───────────────────────
const ADMIN_NAME     = 'Modplint Admin';
const ADMIN_EMAIL    = 'modplint@gmail.com';  // your email
const ADMIN_PASSWORD = 'nandu@12345';       // change to a strong password
const ADMIN_ROLE     = 'superadmin';
// ───────────────────────────────────────────────────────────────────────────

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('❌  MONGO_URI is not set in your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  MongoDB connected');

    // Inline the schema so this script has zero extra dependencies
    const userSchema = new mongoose.Schema({
      name:              { type: String, required: true, trim: true },
      email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
      password:          { type: String, required: true, select: false },
      role:              { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
      isActive:          { type: Boolean, default: true },
      lastLogin:         { type: Date, default: null },
      passwordChangedAt: Date,
    }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Check if already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`ℹ️   Admin already exists: ${ADMIN_EMAIL}`);
      console.log('    No changes made.');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: hashedPassword,
      role:     ADMIN_ROLE,
      isActive: true,
    });

    console.log('');
    console.log('🎉  Admin account created successfully!');
    console.log('──────────────────────────────────────');
    console.log(`    Email    : ${ADMIN_EMAIL}`);
    console.log(`    Password : ${ADMIN_PASSWORD}`);
    console.log(`    Role     : ${ADMIN_ROLE}`);
    console.log('──────────────────────────────────────');
    console.log('    ⚠️  Change your password after first login.');
    console.log('');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
}

seed();