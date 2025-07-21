const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cleanupDoctorFolder = async (uuid) => {
  try {
    var baseUploadDir = path.resolve(__dirname, "../../uploads", uuid);
    if (process.env.IS_PRODUCTION === "true") {
      baseUploadDir = path.resolve(__dirname, "/uploads", uuid);
    }
    const tempDir = path.join(baseUploadDir, "temp");

    const doctor = await prisma.doctor.findUnique({ where: { uuid } });
    if (!doctor) {
      console.warn(`Doctor not found: ${uuid}`);
      return;
    }

    // 1. Remove entire /temp folder and clear tempFiles in DB
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`🧹 Temp folder removed for ${uuid}`);
    }

    if (doctor.tempFiles && Array.isArray(doctor.tempFiles)) {
      await prisma.doctor.update({
        where: { uuid },
        data: { tempFiles: [] },
      });
      console.log(`🧼 Cleared tempFiles field for ${uuid}`);
    }

    // // 2. Smart cleanup in /uploads/uuid folder (excluding temp)
    // const storedFiles = Array.isArray(doctor.filepath) ? doctor.filepath : [];
    // const existingDirFiles = fs.existsSync(baseUploadDir)
    //   ? fs.readdirSync(baseUploadDir).filter((f) => f !== "temp")
    //   : [];

    // // Files from DB that actually exist on disk
    // const validFiles = storedFiles.filter((filename) =>
    //   existingDirFiles.includes(filename)
    // );

    // // Files that are on disk but NOT in DB -> delete them
    // const filesToDelete = existingDirFiles.filter(
    //   (f) => !validFiles.includes(f)
    // );

    // for (const file of filesToDelete) {
    //   const filePath = path.join(baseUploadDir, file);
    //   try {
    //     fs.unlinkSync(filePath);
    //     console.log(`🗑️ Deleted unused file: ${file}`);
    //   } catch (err) {
    //     console.error(`❌ Could not delete file ${file}:`, err.message);
    //   }
    // }

    // // If any DB-stored files were missing, update DB
    // if (storedFiles.length !== validFiles.length) {
    //   await prisma.doctor.update({
    //     where: { uuid },
    //     data: { filepath: validFiles },
    //   });
    //   console.log(`✅ Updated filepath column for ${uuid}`);
    // }
  } catch (err) {
    console.error(`❌ Cleanup failed for ${uuid}:`, err.message);
  }
};

module.exports = cleanupDoctorFolder;
