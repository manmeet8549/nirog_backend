const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "nirogorganic@gmail.com",
    pass: "epbxusswdraedbam"  // Remove all spaces just to be sure
  }
});

const mailOptions = {
  from: "nirogorganic@gmail.com",
  to: "manmeet8549singh@gmail.com",
  subject: "Test Email from Nodemailer",
  text: "This is a test email from your Node.js app"
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log("❌ Error:", error);
  }
  console.log("✅ Email sent:", info.response);
});
