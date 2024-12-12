import nodemailer from "nodemailer";
import dotenv from "dotenv";
import generateOtp from "./generateOtp.js";
import otpEmailTemplate from "../templates/otpEmailTemplate.js";

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
    html: otpEmailTemplate(otp),
  };

  await transporter.sendMail(mailOptions);
};

export let otpStorage = {};  

export const sendOtp = async (email) => {
  try {
    const otp = generateOtp(); 
    otpStorage[email] = otp;  

    console.log(`Generated OTP for ${email}: ${otp}`);

    await sendOtpEmail(email, otp);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.log("Error sending OTP: ", error);
  }
};



