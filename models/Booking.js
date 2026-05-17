const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Preferred date is required'],
    },
    time: {
      type: String,
      required: [true, 'Preferred time is required'],
      trim: true,
    },
    projectType: {
      type: String,
      required: [true, 'Project type is required'],
      enum: ['Residential', 'Commercial', 'Office', 'Hospitality', 'Retail', 'Other'],
    },
    budget: {
      type: String,
      enum: ['Under $10k', '$10k–$25k', '$25k–$50k', '$50k–$100k', '$100k+', 'Not sure'],
      default: 'Not sure',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

bookingSchema.index({ status: 1, date: 1 });
bookingSchema.index({ email: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
