const { PrismaClient } = require("@prisma/client");
const validateRequest = require("../utils/validateRequest");
const prisma = new PrismaClient();
const { z } = require("zod");
const { v4: uuidv4 } = require("uuid");
const { sendEmail } = require("../services/emailService");
const config = require("../config/config");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const cleanupDoctorFolder = require("../utils/cleanupDoctorFolder");

// Get all doctors with pagination, sorting, and search
const getDoctors = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";
  const sortBy = req.query.sortBy || "id";
  const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

  try {
    const trimmedSearch = search?.trim();

    const whereClause = {
      OR: [
        { name: { contains: trimmedSearch } },
        { mobile: { contains: trimmedSearch } },
        { email: { contains: trimmedSearch } },
        { degree: { contains: trimmedSearch } },
        { designation: { contains: trimmedSearch } },
        { specialty: { contains: trimmedSearch } },
        { topic: { contains: trimmedSearch } },
      ],
    };

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalDoctors = await prisma.doctor.count({
      where: whereClause,
    });
    const totalPages = Math.ceil(totalDoctors / limit);

    res.json({
      doctors,
      page,
      totalPages,
      totalDoctors,
    });
  } catch (error) {
    return res.status(500).json({
      errors: {
        message: "Failed to fetch doctors",
        details: error.message,
      },
    });
  }
};

// Create a new doctor
const createDoctor = async (req, res) => {
  const schema = z.object({
    name: z
      .string()
      .min(1, "Name cannot be left blank.")
      .max(100, "Name must not exceed 100 characters."),
    mobile: z.string().min(1, "Mobile cannot be left blank."),
    email: z.string().email("Invalid email format."),
    degree: z.string().min(1, "Degree cannot be left blank."),
    designation: z.string().optional(),
    specialty: z.string().min(1, "Specialty cannot be left blank."),
    topic: z.string().min(1, "Topic cannot be left blank."),
    state: z.string().optional(),
    city: z.string().optional(),
  });
  const validationErrors = await validateRequest(schema, req.body, res);

  const {
    name,
    mobile,
    email,
    degree,
    designation,
    specialty,
    topic,
    state,
    city,
  } = req.body;

  try {
    const newDoctor = await prisma.doctor.create({
      data: {
        name,
        uuid: uuidv4(), // <-- Add this line to generate and store UUID
        mobile,
        email,
        degree,
        designation,
        specialty,
        topic,
        state,
        city,
      },
    });

    res.status(201).json(newDoctor);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create doctor",
      details: error.message,
    });
  }
};

// Get doctor by ID
const getDoctorById = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    res.status(200).json(doctor);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch doctor",
      details: error.message,
    });
  }
};

// Update doctor by ID
const updateDoctor = async (req, res) => {
  const schema = z.object({
    name: z
      .string()
      .min(1, "Name cannot be left blank.")
      .max(100, "Name must not exceed 100 characters."),
    mobile: z.string().min(1, "Mobile cannot be left blank."),
    email: z.string().email("Invalid email format."),
    degree: z.string().min(1, "Degree cannot be left blank."),
    designation: z.string().optional(),
    specialty: z.string().min(1, "Specialty cannot be left blank."),
    topic: z.string().min(1, "Topic cannot be left blank."),
    state: z.string().optional(),
    city: z.string().optional(),
  });
  const validationErrors = await validateRequest(schema, req.body, res);

  const { id } = req.params;
  const {
    name,
    mobile,
    email,
    degree,
    designation,
    specialty,
    topic,
    state,
    city,
  } = req.body;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: {
        name,
        mobile,
        email,
        degree,
        designation,
        specialty,
        topic,
        state,
        city,
      },
    });

    res.status(200).json(updatedDoctor);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update doctor",
      details: error.message,
    });
  }
};

// Delete doctor by ID
const deleteDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    var folderPath = path.resolve(__dirname, "../../uploads", doctor.uuid);
    if (process.env.IS_PRODUCTION === "true") {
      folderPath = path.resolve(__dirname, "/uploads", doctor.uuid);
    }

    // Delete the entire UUID folder if it exists
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log("Deleted folder and contents:", folderPath);
    }

    await prisma.doctor.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete doctor",
      details: error.message,
    });
  }
};

// Get all doctors without pagination
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany();
    res.status(200).json(doctors);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch doctors",
      details: error.message,
    });
  }
};

const sendDoctorEmail = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(doctorId) },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const link = `${config.frontendUrl}/doctors/record/${doctor.uuid}`;

    // Send the email
    await sendEmail(
      doctor.email,
      "Doctor Information Request",
      "doctorInfo", // template name, must match templates/doctor-info.ejs
      {
        name: doctor.name,
        email: doctor.email,
        topic: doctor.topic,
        link: link,
      }
    );

    return res.json({ message: `Email sent to ${doctor.email}` });
  } catch (error) {
    console.error("Error sending doctor email:", error);
    return res.status(500).json({ error });
  }
};

// Get all doctors without pagination
const fetchDoctorRecord = async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { uuid: req.params.uuid },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    res.status(200).json(doctor);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch doctor",
      details: error.message,
    });
  }
};

const DeleteDoctorVideo = async (req, res) => {
  try {
    const { id, filenameToDelete } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const fullFilePath = path.resolve(
      __dirname,
      process.env.IS_PRODUCTION === "true"
        ? `/uploads/${doctor.uuid}/${filenameToDelete}`
        : `../../uploads/${doctor.uuid}/${filenameToDelete}`
    );

    // 1. Delete file from disk if it exists
    if (fs.existsSync(fullFilePath)) {
      fs.unlinkSync(fullFilePath);
      // console.log(`🗑️ Deleted file: ${fullFilePath}`);
    }

    // 2. Remove from filepath JSON array
    const updatedFileList = (doctor.filepath || []).filter(
      (fp) => path.basename(fp) !== filenameToDelete
    );

    await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: {
        filepath: updatedFileList,
        uploadedAt: updatedFileList.length > 0 ? doctor.uploadedAt : null,
      },
    });

    return res.json({
      message: `Video '${filenameToDelete}' deleted successfully.`,
    });
  } catch (error) {
    console.error("❌ Delete error:", error);
    return res.status(500).json({
      message: "Delete failed",
      details: error.message,
    });
  }
};

const testData = async (req, res) => {
  const dirPath = path.resolve(__dirname, "/uploads");
  const readmePath = path.join(dirPath, "readme.txt");
  const content = "This folder stores doctor video files and related data.";

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(readmePath, content, "utf8");
    res.status(200).json({ message: "readme.txt created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create readme.txt", details: error.message });
  }
};

const cleanupDoctorVideos = async (req, res) => {
  try {
    const { uuid } = req.params;
    await cleanupDoctorFolder(uuid);

    return res.json({
      message: `Video cleanup Done.`,
    });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({
      message: "Cleanup failed",
      details: error.message,
    });
  }
};

const uploadDoctorVideo = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { stop } = req.body;
    console.log("stop variable is = ", stop);
    const doctor = await prisma.doctor.findUnique({ where: { uuid } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    let uploadedFilePath = path.resolve(
      __dirname,
      "../../uploads",
      uuid,
      "temp",
      req.file.filename
    );

    if (process.env.IS_PRODUCTION === "true") {
      uploadedFilePath = path.resolve(
        __dirname,
        "/uploads",
        uuid,
        "temp",
        req.file.filename
      );
    }

    const updatedFiles = doctor.tempFiles
      ? [...doctor.tempFiles, uploadedFilePath]
      : [uploadedFilePath];

    await prisma.doctor.update({
      where: { uuid },
      data: {
        tempFiles: updatedFiles,
        isVideoProcessing: true,
      },
    });

    // ✅ If `stop = true`, finalize immediately
    if (stop === "true") {
      req.body.orientation = req.body.orientation || "portrait";
      req.body.frameColor = req.body.frameColor || "#c0fbfd";

      await finishDoctorVideo(req, res); // 👈 call directly since in same file
      return; // prevent double response
    }

    // 🟢 Respond normally for chunk upload
    res.json({
      message: "Video chunk uploaded successfully",
      file: req.file.filename,
    });
  } catch (error) {
    console.error("❌ Upload error:", error.message);

    try {
      await cleanupDoctorFolder(uuid);
    } catch (cleanupErr) {
      console.error("❌ Cleanup also failed:", cleanupErr.message);
    }

    res.status(500).json({
      message: "Upload failed",
      details: error.message,
    });
  }
};

function wrapText(text, maxLen = 30) {
  const words = text.split(" ");
  let lines = [""];
  for (const word of words) {
    if ((lines[lines.length - 1] + " " + word).length > maxLen) {
      lines.push(word);
    } else {
      lines[lines.length - 1] += (lines[lines.length - 1] ? " " : "") + word;
    }
  }
  return lines.join("\n");
}

// const finishDoctorVideo = async (req, res) => {
//   const { uuid } = req.params;
//   const { orientation = "portrait", frameColor = "#c0fbfd" } = req.body;

//   try {
//     const doctor = await prisma.doctor.findUnique({ where: { uuid } });
//     if (!doctor || !doctor.tempFiles || doctor.tempFiles.length === 0) {
//       await cleanupDoctorFolder(uuid);
//       return res
//         .status(404)
//         .json({ message: "No video chunks found for merging" });
//     }

//     let chunksDir = path.resolve(__dirname, "../../uploads", uuid, "temp");
//     if (process.env.IS_PRODUCTION === "true") {
//       chunksDir = path.resolve(__dirname, "/uploads", uuid, "temp");
//     }

//     const fileListPath = path.resolve(chunksDir, `${uuid}-file-list.txt`);
//     const mergedMp4Path = path.resolve(chunksDir, `${uuid}-merged.mp4`);

//     const existingChunks = doctor.tempFiles
//       .map((file) => path.resolve(chunksDir, path.basename(file)))
//       .filter((filePath) => fs.existsSync(filePath));

//     if (existingChunks.length === 0) {
//       await cleanupDoctorFolder(uuid);
//       return res
//         .status(404)
//         .json({ message: "No valid chunks found on disk to merge" });
//     }

//     existingChunks.sort();
//     fs.writeFileSync(
//       fileListPath,
//       existingChunks.map((file) => `file '${file}'`).join("\n")
//     );

//     // Step 1: Merge chunks
//     await new Promise((resolve, reject) => {
//       const mergeCommand = `ffmpeg -f concat -safe 0 -i "${fileListPath}" -c:v libx264 -preset fast -crf 23 -c:a aac "${mergedMp4Path}"`;
//       exec(mergeCommand, (err) => (err ? reject(err) : resolve()));
//     });

//     // Step 2: Detect rotation metadata
//     const getRotation = () =>
//       new Promise((resolve) => {
//         exec(
//           `ffprobe -v error -select_streams v:0 -show_entries stream_tags=rotate -of default=nw=1:nk=1 "${mergedMp4Path}"`,
//           (err, stdout) => {
//             const angle = parseInt(stdout) || 0;
//             resolve(angle);
//           }
//         );
//       });

//     const rotation = await getRotation();

//     // Step 3: Setup dimensions and filters
//     const isPortrait = orientation === "portrait";
//     const videoWidth = isPortrait ? 720 : 1280;
//     const videoHeight = isPortrait ? 1280 : 720;
//     const textBoxHeight = isPortrait ? 90 : 60;

//     const rotationFilter =
//       rotation === 90 || (isPortrait && rotation === 0)
//         ? "transpose=1,"
//         : rotation === 270
//         ? "transpose=2,"
//         : "";

//     const nameText = wrapText(`${doctor?.name || "Unknown"}`, 30);
//     const topicText = `${doctor?.topic || "Unknown"}`;
//     const escape = (text) =>
//       text
//         .replace(/'/g, "\\'")
//         .replace(/:/g, "\\:")
//         .replace(/,/g, "\\,")
//         .replace(/\n/g, "\\n");

//     const ffmpegFilter = [
//       `${rotationFilter}scale=${videoWidth}:${videoHeight}:force_original_aspect_ratio=decrease`,
//       `pad=${videoWidth}:${videoHeight}:(ow-iw)/2:(oh-ih)/2:color=black`,
//       `drawbox=x=0:y=ih-${textBoxHeight + 80}:w=iw:h=${
//         textBoxHeight + 80
//       }:color=${frameColor}@1.0:t=fill`,
//       `drawbox=x=0:y=0:w=iw:h=ih:color=${frameColor}@1.0:t=30`,
//       `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${escape(
//         nameText
//       )}':fontcolor=black:fontsize=28:x=(w-text_w)/2:y=h-${
//         textBoxHeight + 55
//       }:box=0:shadowcolor=black:shadowx=2:shadowy=2`,
//       `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${escape(
//         topicText
//       )}':fontcolor=black:fontsize=24:x=(w-text_w)/2:y=h-${
//         textBoxHeight + 20
//       }:box=0:shadowcolor=black:shadowx=2:shadowy=2`,
//     ].join(",");

//     // Step 4: Convert with FFmpeg
//     const formatDateTime = () => {
//       const now = new Date();
//       const pad = (n) => (n < 10 ? "0" + n : n);
//       const padMs = (n) => n.toString().padStart(3, "0");
//       return `${pad(now.getDate())}_${pad(
//         now.getMonth() + 1
//       )}_${now.getFullYear()}_${pad(now.getHours())}_${pad(
//         now.getMinutes()
//       )}_${pad(now.getSeconds())}_${padMs(now.getMilliseconds())}`;
//     };

//     const safeName = (doctor.name || "Unknown").trim().replace(/\s+/g, "_");
//     const finalFilename = `${formatDateTime()}_${safeName}.mp4`;

//     let finalOutputDir = path.resolve(__dirname, "../../uploads", uuid);
//     if (process.env.IS_PRODUCTION === "true") {
//       finalOutputDir = path.resolve(__dirname, "/uploads", uuid);
//     }
//     const finalMp4Path = path.resolve(finalOutputDir, finalFilename);

//     await new Promise((resolve, reject) => {
//       const convertCommand = `ffmpeg -i "${mergedMp4Path}" -vf "${ffmpegFilter}" -c:v libx264 -preset fast -crf 23 -c:a aac "${finalMp4Path}"`;
//       exec(convertCommand, (err) => (err ? reject(err) : resolve()));
//     });

//     // Step 5: Save to DB and cleanup
//     const updatedFiles = doctor.filepath
//       ? [...doctor.filepath, path.basename(finalMp4Path)]
//       : [path.basename(finalMp4Path)];

//     await prisma.doctor.update({
//       where: { uuid },
//       data: {
//         filepath: updatedFiles,
//         tempFiles: [],
//         isVideoProcessing: false,
//         uploadedAt: new Date(),
//       },
//     });

//     await cleanupDoctorFolder(uuid);

//     return res.json({
//       message: `Video merged and converted successfully (${orientation})`,
//       file: path.basename(finalMp4Path),
//     });
//   } catch (error) {
//     console.error("❌ Finish error:", error.message);

//     try {
//       await cleanupDoctorFolder(uuid);
//     } catch (cleanupErr) {
//       console.error("❌ Cleanup failed:", cleanupErr.message);
//     }

//     return res.status(500).json({
//       message: "Merge failed",
//       details: error.message,
//     });
//   }
// };

const finishDoctorVideo = async (req, res) => {
  const { uuid } = req.params;
  const { orientation = "portrait", frameColor = "#c0fbfd" } = req.body;

  try {
    const doctor = await prisma.doctor.findUnique({ where: { uuid } });
    if (!doctor || !doctor.tempFiles || doctor.tempFiles.length === 0) {
      await cleanupDoctorFolder(uuid);
      return res
        .status(404)
        .json({ message: "No video chunks found for merging" });
    }

    let chunksDir = path.resolve(__dirname, "../../uploads", uuid, "temp");
    if (process.env.IS_PRODUCTION === "true") {
      chunksDir = path.resolve(__dirname, "/uploads", uuid, "temp");
    }

    const fileListPath = path.resolve(chunksDir, `${uuid}-file-list.txt`);
    const mergedMp4Path = path.resolve(chunksDir, `${uuid}-merged.mp4`);

    const existingChunks = doctor.tempFiles
      .map((file) => path.resolve(chunksDir, path.basename(file)))
      .filter((filePath) => fs.existsSync(filePath));

    if (existingChunks.length === 0) {
      await cleanupDoctorFolder(uuid);
      return res
        .status(404)
        .json({ message: "No valid chunks found on disk to merge" });
    }

    existingChunks.sort();
    fs.writeFileSync(
      fileListPath,
      existingChunks.map((file) => `file '${file}'`).join("\n")
    );

    // Step 1: Merge chunks
    await new Promise((resolve, reject) => {
      const mergeCommand = `ffmpeg -f concat -safe 0 -i "${fileListPath}" -c:v libx264 -preset fast -crf 23 -c:a aac "${mergedMp4Path}"`;
      exec(mergeCommand, (err) => (err ? reject(err) : resolve()));
    });

    // Step 2: Always create a final filename
    const formatDateTime = () => {
      const now = new Date();
      const pad = (n) => (n < 10 ? "0" + n : n);
      const padMs = (n) => n.toString().padStart(3, "0");
      return `${pad(now.getDate())}_${pad(
        now.getMonth() + 1
      )}_${now.getFullYear()}_${pad(now.getHours())}_${pad(
        now.getMinutes()
      )}_${pad(now.getSeconds())}_${padMs(now.getMilliseconds())}`;
    };

    const safeName = (doctor.name || "Unknown").trim().replace(/\s+/g, "_");
    const finalFilename = `${formatDateTime()}_${safeName}.mp4`;

    let finalOutputDir = path.resolve(__dirname, "../../uploads", uuid);
    if (process.env.IS_PRODUCTION === "true") {
      finalOutputDir = path.resolve(__dirname, "/uploads", uuid);
    }

    const finalMp4Path = path.resolve(finalOutputDir, finalFilename);

    // Step 3: Either edit or copy with conversion
    if (process.env.EDIT_VIDEO === "true") {
      const getRotation = () =>
        new Promise((resolve) => {
          exec(
            `ffprobe -v error -select_streams v:0 -show_entries stream_tags=rotate -of default=nw=1:nk=1 "${mergedMp4Path}"`,
            (err, stdout) => {
              const angle = parseInt(stdout) || 0;
              resolve(angle);
            }
          );
        });

      const rotation = await getRotation();

      const isPortrait = orientation === "portrait";
      const videoWidth = isPortrait ? 720 : 1280;
      const videoHeight = isPortrait ? 1280 : 720;
      const textBoxHeight = isPortrait ? 90 : 60;

      const rotationFilter =
        rotation === 90 || (isPortrait && rotation === 0)
          ? "transpose=1,"
          : rotation === 270
          ? "transpose=2,"
          : "";

      const nameText = wrapText(`${doctor?.name || "Unknown"}`, 30);
      const topicText = `${doctor?.topic || "Unknown"}`;
      const escape = (text) =>
        text
          .replace(/'/g, "\\'")
          .replace(/:/g, "\\:")
          .replace(/,/g, "\\,")
          .replace(/\n/g, "\\n");

      const ffmpegFilter = [
        `${rotationFilter}scale=${videoWidth}:${videoHeight}:force_original_aspect_ratio=decrease`,
        `pad=${videoWidth}:${videoHeight}:(ow-iw)/2:(oh-ih)/2:color=black`,
        `drawbox=x=0:y=ih-${textBoxHeight + 80}:w=iw:h=${
          textBoxHeight + 80
        }:color=${frameColor}@1.0:t=fill`,
        `drawbox=x=0:y=0:w=iw:h=ih:color=${frameColor}@1.0:t=30`,
        `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${escape(
          nameText
        )}':fontcolor=black:fontsize=28:x=(w-text_w)/2:y=h-${
          textBoxHeight + 55
        }:box=0:shadowcolor=black:shadowx=2:shadowy=2`,
        `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='${escape(
          topicText
        )}':fontcolor=black:fontsize=24:x=(w-text_w)/2:y=h-${
          textBoxHeight + 20
        }:box=0:shadowcolor=black:shadowx=2:shadowy=2`,
      ].join(",");

      // Convert with filters
      await new Promise((resolve, reject) => {
        const convertCommand = `ffmpeg -i "${mergedMp4Path}" -vf "${ffmpegFilter}" -c:v libx264 -preset fast -crf 23 -c:a aac "${finalMp4Path}"`;
        exec(convertCommand, (err) => (err ? reject(err) : resolve()));
      });
    } else {
      // No filters: just convert and rename
      await new Promise((resolve, reject) => {
        const copyCommand = `ffmpeg -i "${mergedMp4Path}" -c:v libx264 -preset fast -crf 23 -c:a aac "${finalMp4Path}"`;
        exec(copyCommand, (err) => (err ? reject(err) : resolve()));
      });
    }

    // Step 4: Save to DB
    const updatedFiles = doctor.filepath
      ? [...doctor.filepath, path.basename(finalMp4Path)]
      : [path.basename(finalMp4Path)];

    await prisma.doctor.update({
      where: { uuid },
      data: {
        filepath: updatedFiles,
        tempFiles: [],
        isVideoProcessing: false,
        uploadedAt: new Date(),
      },
    });

    await cleanupDoctorFolder(uuid);

    const recordAgainLink = `${config.frontendUrl}/doctors/record/${doctor.uuid}`;
    const videoLink = `${config.backendStaticUrl}/uploads/${uuid}/${finalFilename}`;
    // Send the email
    await sendEmail(
      doctor.email,
      "Video uploaded successfully",
      "videoProcessedEmail", // template name, must match templates/doctor-info.ejs
      {
        name: doctor.name,
        topic: doctor.topic,
        recordAgainLink: recordAgainLink,
        videoLink: videoLink,
      }
    );

    return res.json({
      message: `Video processed successfully.`,
    });
  } catch (error) {
    console.error("❌ Finish error:", error.message);
    try {
      await cleanupDoctorFolder(uuid);
    } catch (cleanupErr) {
      console.error("❌ Cleanup failed:", cleanupErr.message);
    }
    return res.status(500).json({
      message: "Merge failed",
      details: error.message,
    });
  }
};

module.exports = {
  getDoctors,
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  sendDoctorEmail,
  fetchDoctorRecord,
  DeleteDoctorVideo,
  uploadDoctorVideo,
  finishDoctorVideo,
  testData,
  cleanupDoctorVideos,
};
