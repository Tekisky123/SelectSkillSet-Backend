import { Interviewer } from "../model/interviewerModel.js";
import { Candidate } from "../model/candidateModel.js";
import {
  getAvailabilityServices,
  getInterviewerProfileServices,
  loginInterviewerService,
  registerInterviewerService,
  updateInterviewerProfileServices,
} from "../services/interviewerServices.js";
import dotenv from "dotenv";
import { sendEmail } from "../helper/emailService.js";
import { interviewerTemplate } from "../templates/interviewerTemplate.js";
import { candidateTemplate } from "../templates/candidateTemplate.js";


dotenv.config();
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

    // Convert string dates to Date objects and ensure the payload is valid
    const dateObjects = dates.map((date) => {
      const parsedDate = new Date(date.date); // Convert string to Date object
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid date format for ${date.date}`);
      }
      return {
        date: parsedDate, // Store the parsed date
        from: date.from, // Keep the 'from' and 'to' time as-is
        to: date.to,
      };
    });

    // Update the Interviewer's availability
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

    const interviewer = await Interviewer.findById(interviewerId).populate(
      "interviewRequests.candidateId"
    );

    if (!interviewer) {
      return res
        .status(404)
        .json({ success: false, message: "Interviewer not found" });
    }

    if (interviewer.interviewRequests.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No interview requests available.",
      });
    }

    const formattedRequests = interviewer.interviewRequests.map((request) => {
      const { _id, candidateName, position, date, status } = request;
      const formattedDate = new Date(date);
      const dayName = formattedDate.toLocaleString("en-IN", {
        weekday: "long",
      });
      const formattedDateStr = formattedDate.toLocaleDateString("en-IN");

      return {
        id: _id,
        candidateName,
        position,
        date: formattedDateStr,
        day: dayName,
        status,
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
      return res.status(400).json({
        success: false,
        message: "Interview request ID and status are required",
      });
    }

    if (!["Approved", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Only 'Approved' or 'Cancelled' are allowed.",
      });
    }

    const updateResult = await Interviewer.updateOne(
      { "interviewRequests._id": interviewRequestId },
      {
        $set: {
          "interviewRequests.$.status": status,
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Interview request not found",
      });
    }

    if (status === "Approved") {
      const googleMeetLinks = [
        "https://meet.google.com/xbn-baxk-deo",
        "https://meet.google.com/xbn-baxk-deo",
      ];
      const meetLink =
        googleMeetLinks[Math.floor(Math.random() * googleMeetLinks.length)];

      const interviewer = await Interviewer.findOne(
        { "interviewRequests._id": interviewRequestId },
        { email: 1, firstName: 1, "interviewRequests.$": 1 }
      );

      if (!interviewer || !interviewer.email) {
        console.error(
          "Interviewer not found or email is missing:",
          interviewer
        );
        return res.status(404).json({
          success: false,
          message: "Interviewer not found or email is missing.",
        });
      }

      const interviewRequest = interviewer.interviewRequests[0];
      const candidate = await Candidate.findById(interviewRequest.candidateId);

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: "Candidate not found",
        });
      }

      const formatDateTime = (date) => {
        const options = {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        };
        return new Date(date).toLocaleString("en-US", options);
      };

      const formattedDate = formatDateTime(interviewRequest.date);

      // Generate email content using templates
      const interviewerEmail = interviewerTemplate(
        interviewer.firstName,
        candidate.firstName,
        formattedDate,
        meetLink
      );

      const candidateEmail = candidateTemplate(
        candidate.firstName,
        formattedDate,
        meetLink
      );

      try {
        await sendEmail(
          interviewer.email,
          "Interview Scheduled",
          "",
          interviewerEmail
        );
        console.log("Interviewer email sent successfully.");

        await sendEmail(
          candidate.email,
          "Interview Scheduled",
          "",
          candidateEmail
        );
        console.log("Candidate email sent successfully.");
      } catch (emailError) {
        console.error("Error sending emails:", emailError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Interview request ${
        status === "Approved" ? "approved" : "cancelled"
      } successfully`,
    });
  } catch (error) {
    console.error("Error updating interview request:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
