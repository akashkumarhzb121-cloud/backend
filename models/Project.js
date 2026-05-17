const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Residential', 'Commercial', 'Office', 'Hospitality', 'Retail', 'Other'],
      default: 'Residential',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
      default: null,
    },
    completionDate: {
      type: Date,
      default: null,
    },
    images: [
      {
        url:       { type: String, required: true },
        publicId:  { type: String, required: true }, // Cloudinary public_id for deletion
        caption:   { type: String, default: '' },
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    tags: [{ type: String, trim: true }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Full-text search index
projectSchema.index({ title: 'text', description: 'text', tags: 'text' });
// Common query indexes
projectSchema.index({ category: 1, featured: 1, isPublished: 1 });

module.exports = mongoose.model('Project', projectSchema);
