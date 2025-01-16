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
import { interviewerFeedbackTemplate } from "../templates/interviewerFeedbackTemplate.js";
import { sendEmail } from "../helper/emailService.js";
import { Candidate } from "../model/candidateModel.js";

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

const uploadToS3 = async (file, folder) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${folder}/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    console.error("S3 Upload Error: ", error);
    throw error;
  }
};

export const updateCandidateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { resume, profilePhoto } = req.files;

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

    await updateProfile(id, updates, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterviewerProfile = async (req, res) => {
  const id = req.params.id;

  try {
    const interviewer = await Interviewer.findById(id).select(
      "firstName lastName email location countryCode jobTitle profilePhoto experience totalInterviews price skills availability dates statistics.averageRating statistics.totalFeedbackCount statistics.feedbacks"
    );

    if (!interviewer) {
      return res.status(404).json({ message: "Interviewer not found" });
    }

    // Format response data
    const response = {
      firstName: interviewer.firstName,
      lastName: interviewer.lastName,
      email: interviewer.email,
      location: interviewer.location || "N/A",
      countryCode: interviewer.countryCode || "N/A",
      jobTitle: interviewer.jobTitle || "N/A",
      profilePhoto: interviewer.profilePhoto || "https://default-profile-image.com",
      experience: interviewer.experience || "Not specified",
      totalInterviews: interviewer.totalInterviews || "0",
      price: interviewer.price || "Not specified",
      skills: interviewer.skills || [],
      availability: interviewer.availability.dates || [],
      averageRating: interviewer.statistics?.averageRating || 0,
      totalFeedbackCount: interviewer.statistics?.totalFeedbackCount || 0,
      feedbacks: interviewer.statistics?.feedbacks.map((feedback) => ({
        interviewRequestId: feedback.interviewRequestId,
        feedbackData: feedback.feedbackData,
        rating: feedback.rating,
      })) || [],
    };

    
    res.status(200).json(response);
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

export const addInterviewerFeedback = async (req, res) => {
  const { interviewerId, interviewRequestId, feedback } = req.body;

  if (
    !interviewerId ||
    !interviewRequestId ||
    !feedback ||
    typeof feedback !== "object"
  ) {
    return res
      .status(400)
      .json({ message: "Missing or invalid required fields." });
  }

  try {
    const interviewer = await Interviewer.findById(interviewerId);
    if (!interviewer) {
      return res.status(404).json({ message: "Interviewer not found." });
    }

    const existingFeedback = interviewer.statistics.feedbacks.find(
      (item) => item.interviewRequestId?.toString() === interviewRequestId
    );

    if (existingFeedback) {
      return res
        .status(400)
        .json({ message: "Feedback for this interview already exists." });
    }

    const averageRating = calculateAverageRating(feedback);

    interviewer.statistics.feedbacks.push({
      interviewRequestId,
      feedbackData: feedback,
      rating: averageRating,
    });

    interviewer.statistics.completedInterviews += 1;
    interviewer.statistics.totalAccepted += 1;
    interviewer.statistics.totalFeedbackCount += 1;

    const totalAccepted = interviewer.statistics.totalAccepted;
    const currentAverage = interviewer.statistics.averageRating;

    interviewer.statistics.averageRating =
      (currentAverage * (totalAccepted - 1) + averageRating) / totalAccepted;

    await interviewer.save();

    const latestFeedbacks = interviewer.statistics.feedbacks
      .slice(-3)
      .map((item) => {
        const feedbackData = item.feedbackData;
        return Object.entries(feedbackData).map(([section, data]) => ({
          section,
          comment: data.comments || "No comment provided",
          rating: data.rating || 0,
        }));
      });

    const feedbackForEmail = latestFeedbacks.flat();

    const url = process.env.WEBSITE_URL

    const emailContent = interviewerFeedbackTemplate(
      interviewer.firstName,
      feedbackForEmail,
      url
    );
    await sendEmail(
      interviewer.email,
      "Feedback Received for Your Interview",
      "Feedback for your interview has been submitted.",
      emailContent
    );

    return res
      .status(200)
      .json({ message: "Feedback added and email sent successfully." });
  } catch (error) {
    console.error("Error adding feedback:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};

const calculateAverageRating = (feedback) => {
  const ratings = Object.values(feedback).map((item) => item.rating || 0);
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
};

export const getCandidateStatistics = async (req, res) => {
  try {
    const candidateId = req.user.id;

    if (!candidateId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    const { statistics } = candidate;

    // Enrich feedbacks with interview details
    const enrichedFeedbacks = await Promise.all(
      statistics.feedbacks.map(async (feedback) => {
        // Find the scheduled interview details
        const scheduledInterview = candidate.scheduledInterviews.find(
          (interview) =>
            interview._id.toString() === feedback.interviewRequestId.toString()
        );

        if (scheduledInterview) {
          // Find the interviewer's details
          const interviewer = await Interviewer.findById(
            scheduledInterview.interviewerId
          ).select("firstName lastName profilePhoto");

          return {
            ...feedback._doc, // Spread feedback fields
            interviewDate: scheduledInterview.date,
            interviewer: interviewer
              ? {
                  firstName: interviewer.firstName,
                  lastName: interviewer.lastName,
                  profilePhoto: interviewer.profilePhoto,
                }
              : null,
          };
        }

        return feedback;
      })
    );

    return res.status(200).json({
      message: "Candidate statistics retrieved successfully.",
      statistics: {
        completedInterviews: statistics.completedInterviews,
        averageRating: statistics.averageRating,
        totalFeedbackCount: statistics.totalFeedbackCount,
        feedbacks: enrichedFeedbacks,
      },
    });
  } catch (error) {
    console.error("Error fetching candidate statistics:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};
