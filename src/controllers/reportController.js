const { PrismaClient } = require("@prisma/client");
const ExcelJS = require("exceljs");

const prisma = new PrismaClient();

const doctorReport = async (req, res, next) => {
  const { fromDate, toDate, state } = req.body;
  const startOfDay = (dateStr) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const endOfDay = (dateStr) => {
    const date = new Date(dateStr);
    date.setHours(23, 59, 59, 999);
    return date;
  };

  try {
    const whereClause = {
      ...(fromDate &&
        toDate && {
          uploadedAt: {
            gte: startOfDay(fromDate),
            lte: endOfDay(toDate),
          },
        }),
      ...(state && {
        state: {
          equals: state,
        },
      }),
    };

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      orderBy: {
        uploadedAt: "asc",
      },
    });

    // 1. Create Excel workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Doctor Report");

    // 2. Add header row
    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Mobile", key: "mobile", width: 20 },
      { header: "Degree", key: "degree", width: 20 },
      { header: "Specialty", key: "specialty", width: 25 },
      { header: "Topic", key: "topic", width: 40 },
      { header: "State", key: "state", width: 15 },
      { header: "City", key: "city", width: 15 },
      { header: "Uploaded at", key: "uploadedAt", width: 20 },
    ];

    // 3. Add rows
    doctors.forEach((doc) => {
      worksheet.addRow({
        name: doc.name,
        email: doc.email,
        mobile: doc.mobile,
        degree: doc.degree,
        specialty: doc.specialty,
        topic: doc.topic,
        state: doc.state || "",
        city: doc.city || "",
        uploadedAt: doc.uploadedAt
          ? new Date(doc.uploadedAt).toLocaleString()
          : "",
      });
    });

    // 4. Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Doctor_Report.xlsx"
    );

    // 5. Send Excel buffer
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel report generation failed:", error);
    return res.status(500).json({
      errors: {
        message: "Failed to generate doctors report",
        details: error.message,
      },
    });
  }
};

module.exports = {
  doctorReport,
};
