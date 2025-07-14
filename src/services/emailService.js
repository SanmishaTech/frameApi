const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

let transporter;

// Configure the transporter based on the EMAIL_TRANSPORTER environment variable
switch (process.env.EMAIL_TRANSPORTER) {
  case "sendgrid":
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    break;
  case "mailtrap":
    transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
    break;
  case "sendmail":
    transporter = nodemailer.createTransport({
      sendmail: true,
      newline: "unix",
      path: "/usr/sbin/sendmail", // default path, adjust if necessary
    });
    break;
  case "smtp":
  default:
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    break;
}

// Function to read and compile the EJS template
const compileTemplate = (templateName, data) => {
  const filePath = path.join(
    __dirname,
    "..",
    "templates",
    `${templateName}.ejs`
  );
  const source = fs.readFileSync(filePath, "utf8");
  return ejs.render(source, data);
};

const sendEmail = async (to, subject, templateName, templateData) => {
  const html = compileTemplate(templateName, templateData);

  try {
    if (process.env.EMAIL_TRANSPORTER === "sendgrid") {
      // Send email using SendGrid
      await sgMail.send({
        to,
        from: process.env.SENDGRID_EMAIL_FROM,
        subject,
        html,
      });
      console.log("Email sent successfully using SendGrid");
    } else {
      // Send email using SMTP, Mailtrap, or Sendmail
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      console.log("Email sent using fallback transporter");
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmail };
