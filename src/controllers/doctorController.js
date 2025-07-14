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
  const schema = z
    .object({
      name: z
        .string()
        .min(1, "Name cannot be left blank.")
        .max(100, "Name must not exceed 100 characters.")
        .refine((val) => /^[A-Za-z\s\u0900-\u097F]+$/.test(val), {
          message: "Name can only contain letters.",
        }),
      mobile: z.string().min(1, "Mobile cannot be left blank."),
      email: z.string().email("Invalid email format."),
      degree: z.string().min(1, "Degree cannot be left blank."),
      designation: z.string().optional(),
      specialty: z.string().min(1, "Specialty cannot be left blank."),
      topic: z.string().min(1, "Topic cannot be left blank."),
    })
    .superRefine(async (data, ctx) => {
      const existingDoctor = await prisma.doctor.findFirst({
        where: {
          email: data.email,
        },
      });

      const existingDoctorMobile = await prisma.doctor.findFirst({
        where: {
          mobile: data.mobile,
        },
      });

      if (existingDoctor) {
        ctx.addIssue({
          path: ["email"],
          message: `Doctor with email ${data.email} already exists.`,
        });
      }

      if (existingDoctorMobile) {
        ctx.addIssue({
          path: ["mobile"],
          message: `Doctor with mobile ${data.mobile} already exists.`,
        });
      }
    });

  const validationErrors = await validateRequest(schema, req.body, res);

  const { name, mobile, email, degree, designation, specialty, topic } =
    req.body;

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
  const schema = z
    .object({
      name: z
        .string()
        .min(1, "Name cannot be left blank.")
        .max(100, "Name must not exceed 100 characters.")
        .refine((val) => /^[A-Za-z\s\u0900-\u097F]+$/.test(val), {
          message: "Name can only contain letters.",
        }),
      mobile: z.string().min(1, "Mobile cannot be left blank."),
      email: z.string().email("Invalid email format."),
      degree: z.string().min(1, "Degree cannot be left blank."),
      designation: z.string().optional(),
      specialty: z.string().min(1, "Specialty cannot be left blank."),
      topic: z.string().min(1, "Topic cannot be left blank."),
    })
    .superRefine(async (data, ctx) => {
      const { id } = req.params;

      const existingDoctor = await prisma.doctor.findFirst({
        where: {
          email: data.email,
        },
        select: { id: true },
      });

      const existingDoctorMobile = await prisma.doctor.findFirst({
        where: {
          mobile: data.mobile,
        },
        select: { id: true },
      });

      if (existingDoctor && existingDoctor.id !== parseInt(id)) {
        ctx.addIssue({
          path: ["email"],
          message: `Doctor with email ${data.email} already exists.`,
        });
      }

      if (existingDoctorMobile && existingDoctorMobile.id !== parseInt(id)) {
        ctx.addIssue({
          path: ["mobile"],
          message: `Doctor with mobile ${data.mobile} already exists.`,
        });
      }
    });

  const validationErrors = await validateRequest(schema, req.body, res);

  const { id } = req.params;
  const { name, mobile, email, degree, designation, specialty, topic } =
    req.body;

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

    // If a file path exists, delete the file
    if (doctor.filepath) {
      const filepath = path.resolve(
        __dirname,
        "../../uploads",
        doctor.filepath.trim()
      );
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
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
    const { uuid } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { uuid },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // If a file path exists, delete the file
    if (doctor.filepath) {
      const filepath = path.resolve(
        __dirname,
        "../../uploads",
        doctor.filepath.trim()
      );
      console.log("Deleting file:", filepath);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Clear the file path and uploadedAt timestamp
    await prisma.doctor.update({
      where: { uuid },
      data: {
        filepath: null, // or "" if you prefer empty string
        uploadedAt: null,
      },
    });

    res.json({ message: "Video deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      message: "Delete failed",
      details: error.message,
    });
  }
};

// const uploadDoctorVideo = async (req, res) => {
//   try {
//     const { uuid } = req.params;

//     const doctor = await prisma.doctor.findUnique({ where: { uuid } });
//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     const newFileName = req.file.filename;

//     // Append the new file to the files array
//     const updatedFiles = doctor.files
//       ? [...doctor.files, newFileName]
//       : [newFileName];

//     await prisma.doctor.update({
//       where: { uuid },
//       data: {
//         files: updatedFiles,
//       },
//     });

//     res.json({
//       message: "Video chunk uploaded successfully",
//       file: newFileName,
//     });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ message: "Upload failed", details: error.message });
//   }
// };
const uploadDoctorVideo = async (req, res) => {
  try {
    const { uuid } = req.params;

    const doctor = await prisma.doctor.findUnique({ where: { uuid } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const uploadedFilePath = path.resolve(
      __dirname,
      "../../uploads",
      req.file.filename
    );

    console.log("Uploaded file:", uploadedFilePath);

    // Validate the uploaded file using ffmpeg
    const validateCommand = `ffmpeg -v error -i "${uploadedFilePath}" -f null -`;
    exec(validateCommand, (validateError) => {
      if (validateError) {
        console.error("Validation error:", validateError);
        fs.unlinkSync(uploadedFilePath); // Delete invalid file
        return res.status(400).json({
          message: "Invalid video file uploaded",
          details: validateError.message,
        });
      }

      const reEncodedFileName = `${uuid}-${Date.now()}-chunk.mp4`;
      const reEncodedFilePath = path.resolve(
        __dirname,
        "../../uploads",
        reEncodedFileName
      );

      // Re-encode the uploaded chunk to mp4 with h264 codec
      const command = `ffmpeg -i "${uploadedFilePath}" -c:v libx264 -preset fast -crf 23 -c:a aac -strict experimental "${reEncodedFilePath}"`;

      exec(command, async (error) => {
        if (error) {
          console.error("Re-encode error:", error);
          fs.unlinkSync(uploadedFilePath); // Delete original file
          return res
            .status(500)
            .json({ message: "Re-encode failed", details: error.message });
        }

        // Append the re-encoded file to the files array
        const updatedFiles = doctor.files
          ? [...doctor.files, reEncodedFileName]
          : [reEncodedFileName];

        await prisma.doctor.update({
          where: { uuid },
          data: {
            files: updatedFiles,
          },
        });

        // Delete the original uploaded file
        fs.unlinkSync(uploadedFilePath);

        res.json({
          message: "Video chunk uploaded and re-encoded successfully",
          file: reEncodedFileName,
        });
      });
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", details: error.message });
  }
};

// const finishDoctorVideo = async (req, res) => {
//   try {
//     const { uuid } = req.params;

//     const doctor = await prisma.doctor.findUnique({ where: { uuid } });
//     if (!doctor || !doctor.files || doctor.files.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No video chunks found for merging" });
//     }

//     const outputFileName = `${uuid}-merged-video.mp4`;
//     const outputFilePath = path.resolve(
//       __dirname,
//       "../../uploads",
//       outputFileName
//     );

//     // Use ffmpeg to merge and re-encode video chunks
//     const inputFiles = doctor.files.map((file) =>
//       path.resolve(__dirname, "../../uploads", file)
//     );

//     const fileListPath = path.resolve(
//       __dirname,
//       "../../uploads",
//       `${uuid}-file-list.txt`
//     );
//     fs.writeFileSync(
//       fileListPath,
//       inputFiles.map((file) => `file '${file}'`).join("\n")
//     );

//     // Re-encode all chunks to ensure compatibility
//     const command = `ffmpeg -f concat -safe 0 -i "${fileListPath}" -vf "scale=640:480" -c:v libx264 -preset fast -crf 23 -c:a aac -strict experimental "${outputFilePath}"`;

//     exec(command, async (error) => {
//       if (error) {
//         console.error("Merge error:", error);
//         return res
//           .status(500)
//           .json({ message: "Merge failed", details: error.message });
//       }

//       // Update the doctor record with the merged file path
//       await prisma.doctor.update({
//         where: { uuid },
//         data: {
//           filepath: outputFileName,
//           files: null, // Clear the files array after merging
//         },
//       });

//       // Clean up temporary file list
//       fs.unlinkSync(fileListPath);

//       res.json({ message: "Video merged successfully", file: outputFileName });
//     });
//   } catch (error) {
//     console.error("Merge error:", error);
//     res.status(500).json({ message: "Merge failed", details: error.message });
//   }
// };

const finishDoctorVideo = async (req, res) => {
  try {
    const { uuid } = req.params;

    const doctor = await prisma.doctor.findUnique({ where: { uuid } });
    if (!doctor || !doctor.files || doctor.files.length === 0) {
      return res
        .status(404)
        .json({ message: "No video chunks found for merging" });
    }

    const outputFileName = `${uuid}-merged-video.mp4`;
    const outputFilePath = path.resolve(
      __dirname,
      "../../uploads",
      outputFileName
    );

    const inputFiles = doctor.files.map((file) =>
      path.resolve(__dirname, "../../uploads", file)
    );

    const fileListPath = path.resolve(
      __dirname,
      "../../uploads",
      `${uuid}-file-list.txt`
    );
    fs.writeFileSync(
      fileListPath,
      inputFiles.map((file) => `file '${file}'`).join("\n")
    );

    // Merge the chunks into a single mp4 file
    const command = `ffmpeg -f concat -safe 0 -i "${fileListPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -strict experimental "${outputFilePath}"`;

    exec(command, async (error) => {
      if (error) {
        console.error("Merge error:", error);
        return res
          .status(500)
          .json({ message: "Merge failed", details: error.message });
      }

      // Update the doctor record with the merged file path
      await prisma.doctor.update({
        where: { uuid },
        data: {
          filepath: outputFileName,
          files: null, // Clear the files array after merging
        },
      });

      // Clean up temporary file list
      fs.unlinkSync(fileListPath);

      res.json({ message: "Video merged successfully", file: outputFileName });
    });
  } catch (error) {
    console.error("Merge error:", error);
    res.status(500).json({ message: "Merge failed", details: error.message });
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
};
