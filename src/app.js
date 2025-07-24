const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const createError = require("http-errors");
require("dotenv").config();
const roleRoutes = require("./routes/roles");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const doctorRoutes = require("./routes/doctor");
const swaggerRouter = require("./swagger");
const stateRoutes = require("./routes/state");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/report");
const path = require("path");
const config = require("./config/config");
const app = express();
app.use(morgan("dev"));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource loading
  })
);
// app.use(
//   cors({
//     origin: "*", // Allow requests from all origins
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Allowed HTTP methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
//   })
// );
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For application/x-www-form-urlencoded (optional, but common)
var uploadsPath = path.join(__dirname, "..", "uploads");
if (process.env.IS_PRODUCTION === "true") {
  uploadsPath = "/uploads";
}
console.log(`Serving static files from: ${uploadsPath}`); // Verify this path on startup!
app.use("/uploads", express.static(uploadsPath));
app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use(swaggerRouter); // Add this line to include Swagger documentation

app.use((req, res, next) => {
  next(createError(404));
});

module.exports = app;
