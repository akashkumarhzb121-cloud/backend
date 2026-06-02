const { cloudinary } = require('../config/cloudinary');

/**
 * Deletes a single asset from Cloudinary.
 * Tries image first, then video — handles both resource types transparently.
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    // Try image first
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (result.result === 'not found') {
      // Try video
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    }
  } catch (err) {
    console.warn(`[Cloudinary] Could not delete asset ${publicId}:`, err.message);
  }
};

/**
 * Deletes multiple assets from Cloudinary (images or videos).
 */
const deleteImages = async (publicIds = []) => {
  await Promise.allSettled(publicIds.filter(Boolean).map(deleteImage));
};

module.exports = { deleteImage, deleteImages };
