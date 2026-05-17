const { cloudinary } = require('../config/cloudinary');

/**
 * Delete one image from Cloudinary by its public_id.
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error(`Failed to delete Cloudinary image (${publicId}):`, err.message);
  }
};

/**
 * Delete multiple images from Cloudinary.
 * @param {Array<string>} publicIds
 */
const deleteImages = async (publicIds = []) => {
  await Promise.allSettled(publicIds.map(deleteImage));
};

module.exports = { deleteImage, deleteImages };
