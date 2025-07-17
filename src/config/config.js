module.exports = {
  appName: process.env.APP_NAME || "Frame",
  defaultUserRole: process.env.DEFAULT_USER_ROLE || "user",
  allowRegistration: process.env.ALLOW_REGISTRATION ?? false,
  frontendUrl: process.env.FRONTEND_URL || "https://frame.saaaws.co.in",
};
