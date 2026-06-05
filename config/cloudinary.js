const cloudinary = require('cloudinary').v2;
const multer     = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
// WHY WE REPLACED multer-storage-cloudinary
// ─────────────────────────────────────────────────────────────────────────────
// multer-storage-cloudinary@4.0.0 + cloudinary@1.x has a known bug:
//   resource_type inside the async `params()` callback is SILENTLY IGNORED.
//   The library resolves the params then re-wraps the upload call with its own
//   hardcoded defaults, overwriting resource_type back to 'image'.
//
// Result: every video uploaded through multer gets stored as resource_type
//   'image' in Cloudinary, which makes the URL return a 400 error when the
//   browser tries to play it — videos appear completely broken.
//
// Fix: use a custom multer StorageEngine that calls
//   cloudinary.uploader.upload_stream() directly. This low-level API always
//   respects whatever options we pass, including resource_type:'auto'.
// ─────────────────────────────────────────────────────────────────────────────

class CloudinaryStreamStorage {
  /**
   * @param {{ folder: string }} options
   */
  constructor(options) {
    this._folder = options.folder;
  }

  // Called by multer for every incoming file
  _handleFile(req, file, cb) {
    const folder  = this._folder;
    const isVideo = file.mimetype.startsWith('video/');

    const uploadOptions = {
      folder,
      // 'auto' → Cloudinary detects images AND videos from the binary stream.
      // This is the only value that works reliably for mixed uploads.
      resource_type:    'auto',
      allowed_formats:  ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'avi', 'webm', 'mkv'],
      // Transform images to cap resolution; pass videos through untouched
      ...(isVideo
        ? {}
        : { transformation: [{ width: 3840, height: 2160, crop: 'limit', quality: 'auto:best' }] }),
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        return cb(new Error(`Cloudinary upload failed: ${error.message}`));
      }
      // Expose the same properties that multer-storage-cloudinary exposes so
      // existing controllers (file.path, file.filename, file.mimetype) still work.
      cb(null, {
        fieldname:     file.fieldname,
        originalname:  file.originalname,
        encoding:      file.encoding,
        mimetype:      file.mimetype,
        path:          result.secure_url,   // ← used as `url` in controllers
        filename:      result.public_id,    // ← used as `publicId` in controllers
        size:          result.bytes,
        resource_type: result.resource_type, // 'image' | 'video'
      });
    });

    file.stream.pipe(uploadStream);
  }

  // Called by multer when a file needs to be removed (error path)
  _removeFile(_req, file, cb) {
    const resourceType = (file.mimetype || '').startsWith('video/') ? 'video' : 'image';
    cloudinary.uploader.destroy(file.filename, { resource_type: resourceType }, cb);
  }
}

/**
 * createUploader(folder)
 *
 * Returns a configured multer instance for the given Cloudinary sub-folder.
 *
 * Usage in routes:
 *   const upload = createUploader('projects');
 *   router.post('/', upload.array('images'), controller.create);
 *
 * No file count limit — pass no second arg to .array() for unlimited files.
 * File size limit: 500 MB (handles 4K video footage).
 */
const createUploader = (folder) => {
  const storage = new CloudinaryStreamStorage({
    folder: `interior-design/${folder}`,
  });

  return multer({
    storage,
    limits: {
      fileSize: 500 * 1024 * 1024, // 500 MB
    },
    fileFilter(_req, file, cb) {
      if (/^(image|video)\//.test(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(`Unsupported file type "${file.mimetype}". Only images and videos are allowed.`),
          false,
        );
      }
    },
  });
};

module.exports = { cloudinary, createUploader };
