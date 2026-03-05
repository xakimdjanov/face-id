const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: `"Auth System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Tasdiqlash kodi",
    html: `
      <div style="font-family:Arial,sans-serif;">
        <h3>Tasdiqlash kodi</h3>
        <p>Sizning tasdiqlash kodingiz:</p>
        <h1 style="letter-spacing:2px;">${otp}</h1>
        <p>Kod 5 daqiqa amal qiladi.</p>
      </div>
    `,
  });
};
