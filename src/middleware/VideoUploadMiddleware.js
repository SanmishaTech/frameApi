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

    let uploadPath = path.join(__dirname, "../../uploads", uuid, "temp");
    if (process.env.IS_PRODUCTION === "true") {
      uploadPath = `/uploads/${uuid}/temp`;
    }
    // Target folder: /uploads/<uuid>/temp

    // Ensure the directory exists
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Use filename from req.body.filename if provided, otherwise generate unique
    let filename = req.body.filename;
    // console.log("Filename is :", filename);
    // console.log(`Filename is : ${filename}`);

    if (filename) {
      // console.log("Right");

      // Sanitize filename to avoid path traversal attacks
      filename = path.basename(filename);

      // If filename does not have extension, add original file's extension
      if (!path.extname(filename)) {
        filename += path.extname(file.originalname);
      }
    } else {
      // console.log("Wrong");
      // fallback to original logic if filename not provided
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      filename =
        req.params.uuid + "-" + uniqueSuffix + path.extname(file.originalname);
    }

    cb(null, filename);
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
