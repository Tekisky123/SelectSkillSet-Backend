import express from "express";
import {
  deleteCandidateProfile,
  getCandidateProfile,
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

candidateRoutes.post('/register', registerCandidate);
candidateRoutes.post('/verifyOtpAndRegister', verifyOtpAndRegister);
candidateRoutes.post("/login", loginCandidate);
candidateRoutes.get("/getProfile", authenticate, getCandidateProfile);
candidateRoutes.put("/updateProfile", authenticate, updateCandidateProfile);
candidateRoutes.delete("/profile", deleteCandidateProfile);

// Importing data
candidateRoutes.post("/import/resume", importFromResume);
candidateRoutes.post("/import/linkedin", importFromLinkedIn);

// Interviewers and scheduling
candidateRoutes.get("/interviewers", getInterviewers);
candidateRoutes.post("/schedule", scheduleInterview);
candidateRoutes.get("/interviews", getScheduledInterviews);

export default candidateRoutes;
