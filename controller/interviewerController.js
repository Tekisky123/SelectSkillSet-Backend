import nodemailer from "nodemailer";
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
import { generateGoogleMeetLink } from "../helper/googleMeetUtils.js";

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

    if (status !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Only 'Approved' status is allowed",
      });
    }

    // Find the interviewer and the interview request
    const interviewer = await Interviewer.findOne(
      { "interviewRequests._id": interviewRequestId },
      {
        "interviewRequests.$": 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        availability: 1,
      }
    );

    if (!interviewer) {
      return res.status(404).json({
        success: false,
        message: "Interviewer not found",
      });
    }

    const interviewRequest = interviewer.interviewRequests[0];
    const { candidateId, candidateName, position, date } = interviewRequest;

    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing interview date.",
      });
    }

    // Generate or retrieve the Google Meet link
    let googleMeetLink = interviewRequest.googleMeetLink;

    if (!googleMeetLink) {
      googleMeetLink = await generateGoogleMeetLink(interviewRequestId);

      await Interviewer.updateOne(
        { "interviewRequests._id": interviewRequestId },
        { $set: { "interviewRequests.$.googleMeetLink": googleMeetLink } }
      );
    }

    const candidate = await Candidate.findById(candidateId);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    if (!candidate.googleMeetLink || candidate.googleMeetLink !== googleMeetLink) {
      candidate.googleMeetLink = googleMeetLink;
      await candidate.save();
    }

    // Prepare email content and send
    const formattedDate = new Date(date).toUTCString();
    const availability = interviewer.availability.dates.find(
      (d) =>
        new Date(d.date).toISOString().split("T")[0] ===
        new Date(date).toISOString().split("T")[0]
    );

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability details not found for the specified date",
      });
    }

    const { from, to } = availability;
    const fromGMT = `${from} GMT`;
    const toGMT = `${to} GMT`;

    const interviewerSubject = `Interview Scheduled for ${candidateName} - ${position}`;
    const interviewerHtml = `
      <p>Dear ${interviewer.firstName} ${interviewer.lastName},</p>
      <p>The interview for <strong>${candidateName}</strong> is confirmed.</p>
      <p><strong>Position:</strong> ${position}</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>From:</strong> ${fromGMT}</p>
      <p><strong>To:</strong> ${toGMT}</p>
      <p>Join the Google Meet at: <a href="${googleMeetLink}">${googleMeetLink}</a></p>
    `;

    const candidateSubject = `Your Interview for ${position} - ${formattedDate}`;
    const candidateHtml = `
      <p>Dear ${candidate.firstName} ${candidate.lastName},</p>
      <p>Your interview for <strong>${position}</strong> is confirmed.</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>From:</strong> ${fromGMT}</p>
      <p><strong>To:</strong> ${toGMT}</p>
      <p>Join the Google Meet at: <a href="${googleMeetLink}">${googleMeetLink}</a></p>
    `;

    await sendEmail(interviewer.email, interviewerSubject, "", interviewerHtml);
    await sendEmail(candidate.email, candidateSubject, "", candidateHtml);

    return res.status(200).json({
      success: true,
      message: "Interview request status updated and emails sent with the same link",
    });
  } catch (error) {
    console.error("Error updating interview request:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const handleGoogleCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ success: false, message: "No code provided." });
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Now you can use the oAuth2Client to make requests to Google APIs (e.g., Google Calendar)
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    // Example: Get the list of events from the calendar
    const events = await calendar.events.list({
      calendarId: 'primary',
    });

    console.log('Events:', events.data.items);

    // Save the tokens and provide them to the user or use them for API calls
    res.json({ success: true, message: "Google OAuth success", events });
  } catch (error) {
    console.error('Error during Google OAuth callback:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};