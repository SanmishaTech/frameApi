const bcrypt = require("bcrypt");
const prisma = require("../config/db");
const { z } = require("zod");
const createError = require("http-errors");
const validateRequest = require("../utils/validateRequest");

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming `req.user` contains the authenticated user's data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ errors: { message: "User not found" } });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  // Define Zod schema for profile update validation
  const schema = z
    .object({
      name: z.string().optional(),
      email: z
        .string()
        .email("Email must be a valid email address.")
        .optional(),
    })
    .superRefine(async (data, ctx) => {
      const usrId = req.user.id; // Assuming `req.user` contains the authenticated user's data

      // Check if a user with the same email already exists, excluding the current user
      const existingUser = await prisma.user.findUnique({
        where: {
          email: data.email,
        },
        select: { id: true }, // We only need the id to compare
      });

      // If an existing user is found and it's not the current user
      if (existingUser && existingUser.id !== parseInt(usrId)) {
        ctx.addIssue({
          path: ["email"],
          message: `User with email ${data.email} already exists.`,
        });
      }
    });

  try {
    // Validate the request body using Zod
    const validationErrors = await validateRequest(schema, req.body, res);
    const userId = req.user.id; // Assuming `req.user` contains the authenticated user's data
    const { name, email } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  // Define Zod schema for password change validation
  const schema = z.object({
    currentPassword: z.string().nonempty("Current password is required."),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long.")
      .nonempty("New password is required."),
  });

  try {
    // Validate the request body using Zod
    const validationErrors = await validateRequest(schema, req.body, res);
    const userId = req.user.id; // Assuming `req.user` contains the authenticated user's data
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ errors: { message: "User not found" } });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ errors: { message: "Current password is incorrect" } });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
