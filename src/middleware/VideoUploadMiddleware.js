const fs = require("fs");
const path = require("path");
const multer = require("multer");

const allowedMimeTypes = [
  "video/webm",
  "video/mp4",
  "video/ogg",
  "video/x-matroska",
  "video/quicktime",
  "video/avi",
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uuid = req.params.uuid;
    var uploadPath = path.join(__dirname, "../../uploads", uuid);
    if (process.env.IS_PRODUCTION === "true") {
      uploadPath = `/uploads/${uuid}`;
    }
    // Target folder: /uploads/<uuid>

    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      req.params.uuid + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Only video files are allowed."));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter,
});

module.exports = upload;
