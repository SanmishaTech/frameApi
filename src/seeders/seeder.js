// src/seeders/seeder.js
const { PrismaClient } = require("@prisma/client");
const { TOP, DIAMOND, INACTIVE } = require("../config/data");
const { MEMBER, ADMIN } = require("../config/roles");
require("dotenv").config();
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

async function seed() {
  try {
    // Create user
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@gmail.com",
        mobile: "1234567890",
        password: await bcrypt.hash("abcd123", 10),
        role: ADMIN,
        active: true,
      },
    });

    console.log("✅ Seeding completed.");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
