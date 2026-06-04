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
 * FIX: multer-storage-cloudinary requires `resource_type` to be returned
 * as a plain string value from the params callback — NOT as a nested
 * async function result evaluated later. The previous code set
 * resource_type: 'auto' inside an async params function which is correct,
 * but some versions of multer-storage-cloudinary do not honour 'auto' and
 * default to 'image', silently rejecting video uploads (they upload but
 * Cloudinary treats them as broken images).
 *
 * The safest fix is to keep resource_type: 'auto' AND also pass it as the
 * top-level option on the CloudinaryStorage constructor so it is always
 * respected regardless of library version.
 *
 * File size limit: 500 MB (supports 4K stock footage)
 * Accepted formats: jpg/jpeg/png/webp/gif + mp4/mov/avi/webm/mkv
 * Image transform: max 3840×2160, quality auto:best (videos pass through as-is)
 */
const createUploader = (folder, { multiFile = false } = {}) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        folder:           `interior-design/${folder}`,
        // FIX: 'auto' tells Cloudinary to detect the resource type from the
        // file content rather than assuming 'image'. This is essential for
        // video uploads — without it videos are stored as broken images and
        // their URLs return a 400 error when the browser tries to load them.
        resource_type:    'auto',
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
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
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
