import express from "express";
import authenticate from "../middleware/authenticate.js";
import {
  addAvailability,
  deleteAvailability,
  getAvailability,
  getInterviewerProfile,
  getInterviewRequests,
  loginInterviewer,
  registerInterviewer,
  updateInterviewerProfile,
  updateInterviewRequest,
} from "../controller/interviewerController.js";

const interviewerRoutes = express.Router();

interviewerRoutes.post("/register", registerInterviewer);
interviewerRoutes.post("/login", loginInterviewer);
interviewerRoutes.get("/getProfile", authenticate, getInterviewerProfile);
interviewerRoutes.post("/addAvailability", authenticate, addAvailability);
interviewerRoutes.get("/getAvailability", authenticate, getAvailability);
interviewerRoutes.delete("/deleteAvailability", authenticate, deleteAvailability);
interviewerRoutes.put("/updateProfile", authenticate, updateInterviewerProfile);
interviewerRoutes.get("/getInterviewRequests", authenticate, getInterviewRequests);
interviewerRoutes.put("/updateInterviewRequest", authenticate, updateInterviewRequest);


// interviewerRoutes.delete("/profile", deleteCandidateProfile);

export default interviewerRoutes;
