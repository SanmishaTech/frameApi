module.exports = {
  appName: process.env.APP_NAME || "Frame",
  defaultUserRole: process.env.DEFAULT_USER_ROLE || "user",
  allowRegistration: process.env.ALLOW_REGISTRATION ?? false,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  backendStaticUrl: process.env.BACKEND_STATIC_URL || "http://localhost:3000",
};
