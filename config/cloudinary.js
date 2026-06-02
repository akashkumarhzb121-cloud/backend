const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Creates a multer/cloudinary uploader for a given folder.
 *
 * Changes vs original:
 * - Accepts images AND videos (mp4, mov, avi, webm, mkv)
 * - No MP resolution gate — any file size/resolution is accepted
 * - File size limit raised to 500 MB (supports 4K stock footage)
 * - Videos are uploaded as resource_type: 'auto' so Cloudinary auto-detects
 */
const createUploader = (folder, { multiFile = false } = {}) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        folder:           `interior-design/${folder}`,
        resource_type:    'auto',           // handles both image and video
        allowed_formats:  ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'avi', 'webm', 'mkv'],
        // Only transform images; let videos pass through as-is
        ...(isVideo ? {} : {
          transformation: [{ width: 3840, height: 2160, crop: 'limit', quality: 'auto:best' }],
        }),
      };
    },
  });

  return multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB — handles 4K stock footage
    fileFilter: (_req, file, cb) => {
      const allowed = /^(image|video)\//;
      if (allowed.test(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only image and video files are allowed'), false);
      }
    },
  });
};

module.exports = { cloudinary, createUploader };
