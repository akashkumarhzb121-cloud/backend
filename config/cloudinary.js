const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Reusable factory — call with a Cloudinary folder name
const createUploader = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `interior-design/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1920, height: 1080, crop: 'limit', quality: 'auto' }],
    },
  });

  return multer({
    storage,
    limits: { fileSize: 150 * 1024 * 1024 }, // FIX: raised from 10MB → 150MB per file
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  });
};

module.exports = { cloudinary, createUploader };
