import generateToken from "../middleware/generateToken.js";
import bcrypt from "bcrypt";

import { Interviewer } from "../model/interviewerModel.js";

export const registerInterviewerService = async (data, res) => {
  const { email, password } = data;

  const existingInterviewer = await Interviewer.findOne({ email });
  if (existingInterviewer) {
    return res
      .status(400)
      .json({ success: false, message: "Interviewer already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newInterviewer = await Interviewer.create({
    ...data,
    password: hashedPassword,
  });

  const token = generateToken(newInterviewer);
  const { password: _, ...interviewerDetails } = newInterviewer.toObject();

  return res.status(201).json({
    success: true,
    token,
    interviewer: interviewerDetails,
  });
};

export const loginInterviewerService = async (data, res) => {
  const { email, password } = data;

  const interviewer = await Interviewer.findOne({ email });
  if (!interviewer) {
    return res
      .status(404)
      .json({ success: false, message: "interviewer not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, interviewer.password);
  if (!isPasswordValid) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  const token = generateToken(interviewer);
  const { password: _, ...interviewerDetails } = interviewer.toObject();

  return res.status(200).json({
    success: true,
    token,
    interviewer: interviewerDetails,
  });
};

export const getInterviewerProfileServices = async (interviewerId, res) => {
  const interviewer = await Interviewer.findById(interviewerId).select(
    "-password"
  );
  if (!interviewer) {
    return res
      .status(404)
      .json({ success: false, message: "Profile not found" });
  }
  return res.status(200).json({ success: true, profile: interviewer });
};

export const getAvailabilityServices = async (interviewerId, res) => {
  const availability = await Interviewer.findById(interviewerId).select(
    "availability"
  );
  if (!availability) {
    return res.status(404).json({ success: false, message: "unavalable" });
  }
  return res.status(200).json({ success: true, profile: availability });
  
};

export const updateInterviewerProfileServices = async (
  interviewerId,
  data,
  res
) => {
  try {
    const allowedUpdates = [
      "firstName",
      "lastName",
      "email",
      "jobTitle",
      "location",
      "mobile",
      "profilePhoto",
      "experience",
      "price",
    ];
    const updates = Object.keys(data);

    const isAllowed = updates.every((key) => allowedUpdates.includes(key));
    if (!isAllowed) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid updates!" });
    }

    const interviewer = await Interviewer.findByIdAndUpdate(
      interviewerId,
      data,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!interviewer) {
      return res
        .status(404)
        .json({ success: false, message: "Profile update failed" });
    }

    return res.status(200).json({ success: true, updatedProfile: interviewer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
