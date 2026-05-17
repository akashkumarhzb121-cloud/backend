const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    image: {
      url:      { type: String, default: null },
      publicId: { type: String, default: null },
    },
    pricing: {
      type: {
        type: String,
        enum: ['fixed', 'hourly', 'project-based', 'contact'],
        default: 'contact',
      },
      amount:   { type: Number, default: null },
      currency: { type: String, default: 'USD' },
      note:     { type: String, default: '' },
    },
    features: [{ type: String, trim: true }],
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0, // for manual sorting on the frontend
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

serviceSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model('Service', serviceSchema);
