const multer = require("multer");
const path = require("path");

// ✅ Allowed video MIME types
const allowedMimeTypes = [
  "video/webm",
  "video/mp4",
  "video/ogg",
  "video/x-matroska", // mkv
  "video/quicktime", // mov
  "video/avi", // avi
];

// ✅ Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/uploads"); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      req.params.uuid + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// ✅ File filter to check MIME type
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Only video files are allowed."));
  }
};

// ✅ Multer config with limits and filter
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

module.exports = upload;
