import nodemailer from "nodemailer";
import dotenv from "dotenv";
import generateOtp from "./generateOtp.js";

dotenv.config();

export const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  };

  await transporter.sendMail(mailOptions);
};

export let otpStorage = {};  // This is shared globally

export const sendOtp = async (email) => {
  try {
    const otp = generateOtp();  // Generate the OTP
    otpStorage[email] = otp;  // Store OTP against the email

    // Log for debugging
    console.log(`Generated OTP for ${email}: ${otp}`);

    // Send OTP email
    await sendOtpEmail(email, otp);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.log("Error sending OTP: ", error);
  }
};



