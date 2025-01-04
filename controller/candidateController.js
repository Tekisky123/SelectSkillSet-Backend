import generateOtp from "../helper/generateOtp.js";
import { otpStorage, sendOtp } from "../helper/sendOtp.js";
import { Interviewer } from "../model/interviewerModel.js";
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
  getScheduledInterviewsService,
} from "../services/candidateService.js";
import AWS from "aws-sdk";

export const registerCandidate = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOtp();
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

export const loginCandidate = async (req, res) => {
  try {
    await loginCandidateService(req.body, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCandidateProfile = async (req, res) => {
  try {
    await getProfile(req.user.id, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const s3 = new AWS.S3({
  accessKeyId: process.env.AWSS_OPEN_KEY,
  secretAccessKey: process.env.AWSS_SEC_KEY,
  region: process.env.AWSS_REGION,
});

// Helper function to upload a file to S3
const uploadToS3 = async (file, folder) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${folder}/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await s3.upload(params).promise();
    return result.Location; // S3 file URL
  } catch (error) {
    console.error("S3 Upload Error: ", error);
    throw error; // Rethrow the error for the caller to handle
  }
};

// Update Candidate Profile
export const updateCandidateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { resume, profilePhoto } = req.files;

    // Upload files to S3 if present
    const updates = { ...req.body };
    if (resume) {
      updates.resume = await uploadToS3(resume[0], "resumes");
    }
    if (profilePhoto) {
      updates.profilePhoto = await uploadToS3(
        profilePhoto[0],
        "profile-photos"
      );
    }

    // Perform update
    await updateProfile(id, updates, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterviewerProfile = async (req, res) => {
  const id = req.params.id;
  try {
    const interviewer = await Interviewer.findById(id).select(
      "firstName lastName jobTitle profilePhoto experience totalInterviews price skills"
    );

    if (!interviewer) {
      return res.status(404).json({ message: "Interviewer not found" });
    }

    // Send the interviewer data in the response
    res.status(200).json(interviewer);
  } catch (error) {
    console.error("Error fetching interviewer profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteCandidateProfile = async (req, res) => {
  try {
    await deleteProfile(req.user.id, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importFromResume = async (req, res) => {
  try {
    await importFromResumeService(req.user.id, req.body.resumeData, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importFromLinkedIn = async (req, res) => {
  try {
    await importFromLinkedInService(req.user.id, req.body.linkedInData, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterviewers = async (req, res) => {
  try {
    await getInterviewersService(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const scheduleInterview = async (req, res) => {
  const data = req.body;

  try {
    await scheduleInterviewService(req.user.id, data, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getScheduledInterviews = async (req, res) => {
  try {
    const result = await getScheduledInterviewsService(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
