import { Interviewer } from "../model/interviewerModel.js";
import {
  getAvailabilityServices,
  getInterviewerProfileServices,
  loginInterviewerService,
  registerInterviewerService,
  updateInterviewerProfileServices,
} from "../services/interviewerServices.js";

export const registerInterviewer = async (req, res) => {
  try {
    await registerInterviewerService(req.body, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginInterviewer = async (req, res) => {
  try {
    await loginInterviewerService(req.body, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterviewerProfile = async (req, res) => {
  try {
    await getInterviewerProfileServices(req.user.id, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addAvailability = async (req, res) => {
  try {
    const { dateFrom, dateTo, timeFrom, timeTo, status } = req.body;

    const updatedInterviewer = await Interviewer.findByIdAndUpdate(
      req.user.id,
      {
        availability: { dateFrom, dateTo, timeFrom, timeTo, status },
      },
      { new: true }
    );

    if (!updatedInterviewer) {
      return res
        .status(404)
        .json({ success: false, message: "Interviewer not found" });
    }

    res.status(200).json({
      success: true,
      availability: updatedInterviewer.availability,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAvailability = async (req, res) => {
  try {
    await getAvailabilityServices(req.user.id, res);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message })
  }
};

export const updateInterviewerProfile = async (req, res) => {
  try {
    await updateInterviewerProfileServices(req.user.id, req.body, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
