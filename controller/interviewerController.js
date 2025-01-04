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
import moment from "moment";

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

    // Store the dates exactly as received (no parsing or modification)
    const dateObjects = dates.map((date) => {
      return {
        date: date.date, // Keep the original string format for the date
        from: date.from, // Keep the original string format for the 'from' time
        to: date.to, // Keep the original string format for the 'to' time
      };
    });

    // Save the availability data in the database
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

    // Send the exact format of the dates back in the response
    res.status(200).json({
      success: true,
      availability: {
        dates: updatedInterviewer.availability.dates.map((item) => ({
          date: item.date, // Send date as a string
          from: item.from, // Send 'from' time as a string
          to: item.to, // Send 'to' time as a string
          _id: item._id, // Include _id if necessary
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAvailability = async (req, res) => {
  const { id } = req.body; // Use id instead of date

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Availability ID is required" });
  }

  try {
    const result = await Interviewer.updateOne(
      { "availability.dates._id": id }, // Match by _id
      { $pull: { "availability.dates": { _id: id } } } // Pull the availability with that id
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No availability found for the provided ID`,
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

const formatDateTime = (date, from, to) => {
  const options = {
    weekday: "long", // Day of the week
    year: "numeric",
    month: "numeric", // Numeric month
    day: "numeric", // Numeric day
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short", // Include time zone info
  };

  const formattedDate = new Date(date).toLocaleString("en-US", options);

  // Convert start and end time to GMT
  const formatTime = (time) => {
    return new Date(`1970-01-01T${time}Z`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "GMT",
    });
  };

  const formattedFromTime = from ? formatTime(from) : "N/A";
  const formattedToTime = to ? formatTime(to) : "N/A";

  return {
    formattedDate,
    formattedFromTime,
    formattedToTime,
  };
};

export const getInterviewRequests = async (req, res) => {
  try {
    const interviewerId = req.user.id;

    const interviewer = await Interviewer.findById(interviewerId).populate(
      "interviewRequests.candidateId",
      "firstName lastName profilePhoto"
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
      const { _id, candidateId, position, date, time, status } = request;

      console.log(request, "hiiiiii");

      // Ensure date is in ISO format
      const formattedDate = new Date(date);
      const dayName = formattedDate.toLocaleString("en-IN", {
        weekday: "long",
      });
      const formattedDateStr = formattedDate.toLocaleDateString("en-IN");

      // Function to format individual time parts (e.g., "02:00 PM")
      const formatTimePart = (timePart) => {
        if (!timePart || typeof timePart !== "string") return "N/A";
        const parsedTime = new Date(`1970-01-01T${timePart}Z`);
        if (isNaN(parsedTime.getTime())) return timePart; // Return as-is if not in valid ISO format
        return parsedTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "GMT",
        });
      };

      // Split time into start and end if it's valid
      let timeRange = "N/A";
      if (time && typeof time === "string") {
        const [start, end] = time.split(" - ").map(formatTimePart);
        timeRange = `${start} - ${end}`;
      }

      const firstName = candidateId?.firstName || "N/A";
      const lastName = candidateId?.lastName || "";
      const shortName = `${firstName} ${lastName.charAt(0).toUpperCase()}...`;

      return {
        id: _id,
        name: shortName,
        profilePhoto: candidateId?.profilePhoto || null,
        position: position || "N/A",
        date: formattedDateStr,
        day: dayName,
        time: timeRange,
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
        message: "Interview request not found in Interviewer model",
      });
    }

    const candidateUpdateResult = await Candidate.updateOne(
      { "scheduledInterviews._id": interviewRequestId },
      {
        $set: {
          "scheduledInterviews.$.status": status,
        },
      }
    );

    if (candidateUpdateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Interview request not found in Candidate model",
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
        return res.status(404).json({
          success: false,
          message: "Interviewer not found or email is missing.",
        });
      }

      const interviewRequest = interviewer.interviewRequests[0];

      if (
        !interviewRequest ||
        !interviewRequest.date ||
        !interviewRequest.time
      ) {
        return res.status(400).json({
          success: false,
          message: "Incomplete interview request data (date or time missing).",
        });
      }

      const candidate = await Candidate.findById(interviewRequest.candidateId);

      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: "Candidate not found",
        });
      }

      const [emailFromTime, emailToTime] = interviewRequest.time.split(" - ");
      const rawDate = new Date(interviewRequest.date).toDateString();
      const emailDate = rawDate.replace(/GMT.*$/, "GMT");

      const date = `${emailDate} `;
      const time = `from ${emailFromTime} to ${emailToTime}`;

      // Send the interviewer's ID to the candidate and the candidate's ID to the interviewer
      const interviewerEmail = interviewerTemplate(
        interviewer.firstName,
        candidate.firstName,
        date,
        time,
        meetLink,
        interviewRequest._id, // Sending interview request ID to interviewer
        candidate._id // Sending candidate ID to interviewer
      );

      const candidateEmail = candidateTemplate(
        candidate.firstName,
        date,
        time,
        meetLink,
        interviewRequest._id, // Sending interview request ID to candidate
        interviewer._id // Sending interviewer ID to candidate
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
