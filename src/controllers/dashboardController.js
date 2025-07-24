const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all doctors with pagination, sorting, and search
const getLatestVideos = async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 10;
  const sortBy = req.query.sortBy || "id";
  const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";

  try {
    const whereClause = {
      uploadedAt: { not: null }, // exclude null uploadedAt
    };

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    res.json({
      doctors,
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

module.exports = {
  getLatestVideos,
};
