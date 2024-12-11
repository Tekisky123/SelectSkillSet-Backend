import express from "express";
import authenticate from "../middleware/authenticate.js";
import {
  addAvailability,
  getAvailability,
  getInterviewerProfile,
  loginInterviewer,
  registerInterviewer,
  updateInterviewerProfile,
} from "../controller/interviewerController.js";

const interviewerRoutes = express.Router();

interviewerRoutes.post("/register", registerInterviewer);
interviewerRoutes.post("/login", loginInterviewer);
interviewerRoutes.get("/getProfile", authenticate, getInterviewerProfile);
interviewerRoutes.post("/addAvailability", authenticate, addAvailability);
interviewerRoutes.get("/getAvailability", authenticate, getAvailability);
interviewerRoutes.put("/updateProfile", authenticate, updateInterviewerProfile);
// interviewerRoutes.delete("/profile", deleteCandidateProfile);

export default interviewerRoutes;
