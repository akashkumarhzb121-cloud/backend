const mongoose = require('mongoose');

const mediaSchema = {
  url:          { type: String, required: true },
  publicId:     { type: String, required: true },
  resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
  caption:      { type: String, default: '' },
};

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    profession: { type: String, trim: true, default: '' },
    review: {
      type: String,
      required: [true, 'Review is required'],
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    // Legacy single image field (kept for backward compat)
    image: {
      url:      { type: String, default: null },
      publicId: { type: String, default: null },
    },
    // New: multiple images and/or videos attached to the review
    media: [mediaSchema],
    isApproved: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
  },
  { timestamps: true }
);

testimonialSchema.index({ isApproved: 1, isFeatured: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
