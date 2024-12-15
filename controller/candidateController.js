import generateOtp from "../helper/generateOtp.js";
import { otpStorage, sendOtp } from "../helper/sendOtp.js";
import {
  registerCandidate as registerCandidateService,
  loginCandidate as loginCandidateService,
  getProfile,
  updateProfile,
  deleteProfile,
  importFromResume as importFromResumeService,
  importFromLinkedIn as importFromLinkedInService,
  getInterviewers as getInterviewersService,
  scheduleInterview as scheduleInterviewService,
  getScheduledInterviews as getScheduledInterviewsService,
} from "../services/candidateService.js";

// Register candidate and send OTP
export const registerCandidate = async (req, res) => {
  try {
    const { email } = req.body;

    // Generate OTP
    const otp = generateOtp();

    // Send OTP to the email
    await sendOtp(email, otp);

    return res.status(200).json({
      success: true,
      message:
        "OTP sent to your email. Please verify to complete registration.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP and complete registration
export const verifyOtpAndRegister = async (req, res) => {
  try {
    const { otp, email, password, ...rest } = req.body;
    const normalizedEmail = email;

    const storedOtp = otpStorage[normalizedEmail];

    if (!storedOtp) {
      return res
        .status(400)
        .json({ success: false, message: "OTP not sent or expired" });
    }

    if (otp !== storedOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const { token, candidateDetails } = await registerCandidateService({
      email,
      password,
      ...rest,
    });

    delete otpStorage[normalizedEmail];

    return res
      .status(201)
      .json({ success: true, token, candidate: candidateDetails });
  } catch (error) {
    console.error("Error during OTP verification:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Login candidate
export const loginCandidate = async (req, res) => {
  try {
    await loginCandidateService(req.body, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get candidate profile
export const getCandidateProfile = async (req, res) => {
  try {
    await getProfile(req.user.id, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update candidate profile
export const updateCandidateProfile = async (req, res) => {
  try {
    await updateProfile(req.user.id, req.body, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete candidate profile
export const deleteCandidateProfile = async (req, res) => {
  try {
    await deleteProfile(req.user.id, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Import resume data to profile
export const importFromResume = async (req, res) => {
  try {
    await importFromResumeService(req.user.id, req.body.resumeData, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Import LinkedIn data to profile
export const importFromLinkedIn = async (req, res) => {
  try {
    await importFromLinkedInService(req.user.id, req.body.linkedInData, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get list of interviewers
export const getInterviewers = async (req, res) => {
  try {
    await getInterviewersService(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Schedule interview for a candidate
export const scheduleInterview = async (req, res) => {
  const data = req.body;

  try {
    await scheduleInterviewService(req.user.id, data, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all scheduled interviews for a candidate
export const getScheduledInterviews = async (req, res) => {
  try {
    await getScheduledInterviewsService(req.user.id, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
