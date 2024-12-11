import bcrypt from "bcrypt";

import { Candidate } from "../model/candidateModel.js";
import generateToken from "../middleware/generateToken.js";
import { Interviewer } from "../model/interviewerModel.js";


export const registerCandidate = async (data, res) => {
  const { email, password } = data;

  const existingCandidate = await Candidate.findOne({ email });
  if (existingCandidate) {
    return res
      .status(400)
      .json({ success: false, message: "Candidate already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newCandidate = await Candidate.create({
    ...data,
    password: hashedPassword,
  });

  const token = generateToken(newCandidate);
  const { password: _, ...candidateDetails } = newCandidate.toObject();

  return res.status(201).json({
    success: true,
    token,
    candidate: candidateDetails,
  });
};
// Login candidate and generate JWT token
export const loginCandidate = async (data, res) => {
  const { email, password } = data;

  const candidate = await Candidate.findOne({ email });
  if (!candidate) {
    return res
      .status(404)
      .json({ success: false, message: "Candidate not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, candidate.password);
  if (!isPasswordValid) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const token = generateToken(candidate);
  const { password: _, ...candidateDetails } = candidate.toObject();

  return res.status(200).json({
    success: true,
    token,
    candidate: candidateDetails,
  });
};

// Get candidate profile excluding password
export const getProfile = async (candidateId, res) => {
  const candidate = await Candidate.findById(candidateId).select("-password");
  if (!candidate) {
    return res
      .status(404)
      .json({ success: false, message: "Profile not found" });
  }
  return res.status(200).json({ success: true, profile: candidate });
};

export const updateProfile = async (candidateId, data, res) => {
  try {
    const allowedUpdates = ["firstName", "lastName", "email", "jobTitle", "location", "mobile", "profilePhoto"];
    const updates = Object.keys(data);

    const isAllowed = updates.every((key) => allowedUpdates.includes(key));
    if (!isAllowed) {
      return res.status(400).json({ success: false, message: "Invalid updates!" });
    }

    const candidate = await Candidate.findByIdAndUpdate(candidateId, data, {
      new: true,
      runValidators: true,
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: "Profile update failed" });
    }

    return res.status(200).json({ success: true, updatedProfile: candidate });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete candidate profile
export const deleteProfile = async (candidateId, res) => {
  const candidate = await Candidate.findByIdAndDelete(candidateId);
  if (!candidate) {
    return res
      .status(404)
      .json({ success: false, message: "Profile deletion failed" });
  }
  return res
    .status(200)
    .json({ success: true, message: "Profile deleted successfully" });
};

// Import resume data
export const importFromResume = async (candidateId, resumeData, res) => {
  const candidate = await Candidate.findByIdAndUpdate(
    candidateId,
    { "profile.resume": resumeData },
    { new: true }
  );
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Import failed" });
  }
  return res.status(200).json({ success: true, updatedProfile: candidate });
};

// Import LinkedIn data
export const importFromLinkedIn = async (candidateId, linkedInData, res) => {
  const candidate = await Candidate.findByIdAndUpdate(
    candidateId,
    { "profile.linkedIn": linkedInData },
    { new: true }
  );
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Import failed" });
  }
  return res.status(200).json({ success: true, updatedProfile: candidate });
};


export const getInterviewers = async (res) => {
  const interviewers = await Interviewer.find().select(
    "firstName experience availability totalInterviews price profilePhoto"
  );
  if (!interviewers) {
    return res
      .status(404)
      .json({ success: false, message: "No interviewers found" });
  }
  return res.status(200).json({ success: true, interviewers });
};

// Schedule interview for a candidate
export const scheduleInterview = async (candidateId, interviewDetails, res) => {
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    return res
      .status(404)
      .json({ success: false, message: "Candidate not found" });
  }

  candidate.scheduledInterviews.push(interviewDetails);
  await candidate.save();
  return res
    .status(201)
    .json({ success: true, interviews: candidate.scheduledInterviews });
};

// Get all scheduled interviews for a candidate
export const getScheduledInterviews = async (candidateId, res) => {
  const candidate = await Candidate.findById(candidateId).populate(
    "scheduledInterviews.interviewerId"
  );
  if (!candidate) {
    return res
      .status(404)
      .json({ success: false, message: "No interviews found" });
  }
  return res
    .status(200)
    .json({ success: true, interviews: candidate.scheduledInterviews });
};
