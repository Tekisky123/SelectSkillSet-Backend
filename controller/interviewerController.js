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
import { candidateFeedbackTemplate } from "../templates/candidateFeedbackTemplate.js";

dotenv.config();

const url = process.env.WEBSITE_URL;
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
        if (isNaN(parsedTime.getTime())) return timePart;
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

      const interviewerEmail = interviewerTemplate(
        interviewer.firstName,
        candidate.firstName,
        date,
        time,
        meetLink,
        interviewRequest._id,
        candidate._id,
        url
      );

      const candidateEmail = candidateTemplate(
        candidate.firstName,
        date,
        time,
        meetLink,
        interviewRequest._id,
        interviewer._id,
        url
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

export const addCandidateFeedback = async (req, res) => {
  const { candidateId, interviewRequestId, feedback } = req.body;

  if (!candidateId || !interviewRequestId || !feedback) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found." });
    }

    const candidateName = candidate.firstName;

    const existingFeedback = candidate.statistics.feedbacks.find(
      (item) => item.interviewRequestId.toString() === interviewRequestId
    );

    if (existingFeedback) {
      return res
        .status(400)
        .json({ message: "Feedback for this interview already exists." });
    }

    const averageRating = calculateAverageRating(feedback);

    // Push the feedback into the feedbacks array
    candidate.statistics.feedbacks.push({
      interviewRequestId,
      feedbackData: feedback,
      rating: averageRating,
    });

    // Increment completed interviews count
    candidate.statistics.completedInterviews += 1;

    // Update total feedback count
    const totalFeedbackCount = candidate.statistics.totalFeedbackCount + 1;

    // Update the average rating after including the new feedback
    const updatedAverageRating =
      (candidate.statistics.averageRating *
        candidate.statistics.totalFeedbackCount +
        averageRating) /
      totalFeedbackCount;

    // Update the statistics
    candidate.statistics.totalFeedbackCount = totalFeedbackCount;
    candidate.statistics.averageRating = updatedAverageRating;

    await candidate.save();

    // Get the latest 3 feedbacks (or adjust as needed)
    const latestFeedbacks = candidate.statistics.feedbacks
      .slice(-3)
      .map((item) => {
        const feedbackSections = Object.keys(item.feedbackData);
        const feedbackComments = feedbackSections.map((section) => ({
          section: section,
          comment: item.feedbackData[section].comments || "No comment provided",
          rating: item.feedbackData[section].rating || "No rating provided",
        }));
        return feedbackComments;
      })
      .flat();

    // Send email with feedback information
    const emailContent = candidateFeedbackTemplate(
      candidateName,
      latestFeedbacks,
      url
    );

    await sendEmail(
      candidate.email,
      "Your Interview Feedback",
      "Feedback for your interview is now available.",
      emailContent
    );

    res
      .status(200)
      .json({ message: "Feedback added and email sent successfully." });
  } catch (error) {
    console.error("Error adding feedback:", error.message);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

const calculateAverageRating = (feedback) => {
  const ratings = Object.values(feedback).map((item) => item.rating || 0);
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
};

export const getInterviewerStatistics = async (req, res) => {
  try {
    const interviewerId = req.user.id;

    if (!interviewerId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const interviewer = await Interviewer.findById(interviewerId).populate({
      path: "interviewRequests.candidateId",
      select: "firstName lastName profilePhoto",
    });

    if (!interviewer) {
      return res.status(404).json({ message: "Interviewer not found." });
    }

    const statistics = interviewer.statistics;

    // Calculate the number of pending requests (where status is "Requested")
    const pendingRequestsCount = interviewer.interviewRequests.filter(
      (req) => req.status === "Requested"
    ).length;

    // Update pendingRequests count dynamically
    statistics.pendingRequests = pendingRequestsCount;

    const feedbacks = statistics.feedbacks.map((feedback) => {
      const interviewRequest = interviewer.interviewRequests.find(
        (req) => req._id.toString() === feedback.interviewRequestId.toString()
      );

      const candidate = interviewRequest ? interviewRequest.candidateId : {};

      return {
        interviewRequestId: feedback.interviewRequestId,
        interviewDate: interviewRequest ? interviewRequest.date : "",
        candidateName: candidate.firstName
          ? `${candidate.firstName} ${candidate.lastName.charAt(0)}...`
          : "N/A",
        profilePhoto: candidate.profilePhoto || "N/A",
        feedbackData: feedback.feedbackData,
        rating: feedback.rating,
      };
    });

    return res.status(200).json({
      message: "Interviewer statistics retrieved successfully.",
      statistics: {
        completedInterviews: statistics.completedInterviews,
        pendingRequests: statistics.pendingRequests,
        totalAccepted: statistics.totalAccepted,
        averageRating: statistics.averageRating,
        totalFeedbackCount: statistics.totalFeedbackCount,
        feedbacks: feedbacks,
      },
    });
  } catch (error) {
    console.error("Error fetching interviewer statistics:", error);
    return res
      .status(500)
      .json({ message: "Server error. Please try again later." });
  }
};
