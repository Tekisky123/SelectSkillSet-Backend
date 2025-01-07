import express from "express";
import multer from "multer";
import {
  addInterviewerFeedback,
  deleteCandidateProfile,
  getCandidateProfile,
  getCandidateStatistics,
  getInterviewerProfile,
  getInterviewers,
  getScheduledInterviews,
  importFromLinkedIn,
  importFromResume,
  loginCandidate,
  registerCandidate,
  scheduleInterview,
  updateCandidateProfile,
  verifyOtpAndRegister,
} from "../controller/candidateController.js";
import authenticate from "../middleware/authenticate.js";

const candidateRoutes = express.Router();

// Multer configuration for file uploads
const upload = multer({ storage: multer.memoryStorage() });

candidateRoutes.post("/register", registerCandidate);
candidateRoutes.post("/verifyOtpAndRegister", verifyOtpAndRegister);
candidateRoutes.post("/login", loginCandidate);
candidateRoutes.get("/getProfile", authenticate, getCandidateProfile);
candidateRoutes.put(
  "/updateProfile",
  authenticate,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ]),
  updateCandidateProfile
);

candidateRoutes.get(
  "/getInterviewerProfile/:id",
  authenticate,
  getInterviewerProfile
);
candidateRoutes.delete("/profile", deleteCandidateProfile);
candidateRoutes.post("/import/resume", importFromResume);
candidateRoutes.post("/import/linkedin", importFromLinkedIn);
candidateRoutes.get("/interviewers", getInterviewers);
candidateRoutes.post("/schedule", authenticate, scheduleInterview);
candidateRoutes.get("/myInterviews", authenticate, getScheduledInterviews);
candidateRoutes.post("/add-interviewer-feedback", addInterviewerFeedback);
candidateRoutes.get(
  "/get-candidate-statistics",
  authenticate,
  getCandidateStatistics
);

export default candidateRoutes;
