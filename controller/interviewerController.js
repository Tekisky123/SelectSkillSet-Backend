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
    const { dates } = req.body;
    if (!dates || !Array.isArray(dates)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid dates format." });
    }

    const dateObjects = dates.map((date) => ({
      date: new Date(date), // Ensuring date is in proper format
      status: "unavailable", // Add default status if required
    }));

    const updatedInterviewer = await Interviewer.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { "availability.dates": { $each: dateObjects } } },
      { new: true }
    );

    if (!updatedInterviewer) {
      return res
        .status(404)
        .json({ success: false, message: "Interviewer not found." });
    }

    res.status(200).json({
      success: true,
      availability: updatedInterviewer.availability, 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAvailability = async (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res
      .status(400)
      .json({ success: false, message: "Date is required" });
  }

  try {
    const dateToDelete = new Date(date);

    const result = await Interviewer.updateOne(
      { "availability.dates.date": dateToDelete }, 
      { $pull: { "availability.dates": { date: dateToDelete } } } 
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No availability found for the provided date: ${date}`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Availability deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAvailability = async (req, res) => {
  try {
    const availability = await getAvailabilityServices(req.user.id);

    if (!availability) {
      return res
        .status(404)
        .json({ success: false, message: "No availability found" });
    }

    return res.status(200).json({ success: true, availability });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInterviewerProfile = async (req, res) => {
  try {
    await updateInterviewerProfileServices(req.user.id, req.body, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getInterviewRequests = async (req, res) => {
  try {
    const interviewerId = req.user.id;

    const interviewer = await Interviewer.findById(interviewerId)
      .populate("interviewRequests.candidateId");

    if (!interviewer) {
      return res.status(404).json({ success: false, message: "Interviewer not found" });
    }

    if (interviewer.interviewRequests.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No interview requests available.",
      });
    }

    // Transform interview requests to include only the desired fields
    const formattedRequests = interviewer.interviewRequests.map(request => {
      const { candidateName, position, date } = request;
      // Format the date
      const formattedDate = new Date(date);
      const dayName = formattedDate.toLocaleString('en-IN', { weekday: 'long' }); // Get the day name
      const formattedDateStr = formattedDate.toLocaleDateString('en-IN'); // Format the date as dd/mm/yyyy
      
      return {
        candidateName,
        position,
        date: formattedDateStr,
        day: dayName,
      };
    });

    return res.status(200).json({
      success: true,
      interviewRequests: formattedRequests,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



export const updateInterviewRequest = async (req, res) => {
  try {
    const { interviewRequestId, status } = req.body;

    if (!interviewRequestId || !status) {
      return res.status(400).json({ success: false, message: "Interview request ID and status are required" });
    }

    // Validate status (either 'Approved' or 'Cancelled')
    if (!["Approved", "Cancelled"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // Find the interview request by ID
    const interviewRequest = await Interviewer.updateOne(
      { "interviewRequests._id": interviewRequestId },
      { $set: { "interviewRequests.$.status": status } }
    );

    if (interviewRequest.nModified === 0) {
      return res.status(404).json({ success: false, message: "Interview request not found" });
    }

    // If status is 'Approved', update candidate's scheduled interviews
    if (status === "Approved") {
      const interviewDetails = await Interviewer.findOne(
        { "interviewRequests._id": interviewRequestId },
        { "interviewRequests.$": 1 }
      );

      const candidate = await Candidate.findOneAndUpdate(
        { "scheduledInterviews._id": interviewRequestId },
        { $set: { "scheduledInterviews.$.status": "Scheduled" } },
        { new: true }
      );

      // Notify the candidate via any means you have for notifications (like email, etc.)
      if (candidate) {
        // Send notification to candidate about interview approval
      }
    } else {
      await Candidate.findOneAndUpdate(
        { "scheduledInterviews._id": interviewRequestId },
        { $set: { "scheduledInterviews.$.status": "Cancelled" } }
      );
    }

    return res.status(200).json({ success: true, message: "Interview request status updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
