import bcrypt from "bcrypt";
import { Candidate } from "../model/candidateModel.js";
import generateToken from "../middleware/generateToken.js";
import { Interviewer } from "../model/interviewerModel.js";
import mongoose from "mongoose";

export const registerCandidate = async ({ email, password, ...rest }) => {
  try {
    const candidateExist = await Candidate.findOne({ email });
    if (candidateExist) {
      throw new Error("Candidate already exists with this email.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newCandidate = new Candidate({
      email,
      password: hashedPassword,
      ...rest,
    });

    const savedCandidate = await newCandidate.save();

    const token = generateToken(savedCandidate);

    return { token, candidateDetails: savedCandidate };
  } catch (error) {
    throw new Error(error.message);
  }
};

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
  const allowedUpdates = [
    "firstName",
    "lastName",
    "jobTitle",
    "location",
    "mobile",
    "profilePhoto",
    "linkedIn",
    "countryCode",
    "skills",
    "resume",
  ];
  const updates = Object.keys(data);

  const isAllowed = updates.every((key) => allowedUpdates.includes(key));
  if (!isAllowed) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid updates!" });
  }

  // Handle skills field separately
  if (data.skills && typeof data.skills === "string") {
    try {
      data.skills = JSON.parse(data.skills);
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid skills format!" });
    }
  }

  const candidate = await Candidate.findByIdAndUpdate(candidateId, data, {
    new: true,
    runValidators: true,
  });

  if (!candidate) {
    return res
      .status(404)
      .json({ success: false, message: "Profile update failed" });
  }

  return res.status(200).json({ success: true, updatedProfile: candidate });
};

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
  try {
    const interviewers = await Interviewer.find().select(
      "firstName experience availability totalInterviews price profilePhoto jobTitle"
    );

    const filteredInterviewers = interviewers.filter((interviewer) => {
      return (
        interviewer.experience &&
        interviewer.availability &&
        interviewer.availability.dates &&
        interviewer.availability.dates.length > 0 &&
        interviewer.price &&
        interviewer.jobTitle
      );
    });

    if (filteredInterviewers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No interviewers found with complete information",
      });
    }

    return res
      .status(200)
      .json({ success: true, interviewers: filteredInterviewers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching interviewers",
    });
  }
};

export const scheduleInterview = async (candidateId, data, res) => {
  try {
    const { interviewerId, date, price, from, to } = data;

    if (!interviewerId || !date || !price || !from || !to) {
      return res.status(400).json({
        success: false,
        message: "interviewerId, date, price, from, and to are required",
      });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    const isAlreadyScheduled = candidate.scheduledInterviews.some(
      (interview) =>
        new Date(interview.date).toISOString() ===
          new Date(date).toISOString() &&
        interview.interviewerId.toString() === interviewerId
    );

    if (isAlreadyScheduled) {
      return res.status(400).json({
        success: false,
        message:
          "An interview is already scheduled on this date for this candidate.",
      });
    }

    const interviewRequestId = new mongoose.Types.ObjectId();

    // Create the interview date and get the day name
    const interviewDate = new Date(date);
    const dayName = interviewDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    // Keep the original format of the time, no conversion
    const interviewDetails = {
      _id: interviewRequestId,
      interviewerId,
      date: `${dayName}, ${interviewDate.toLocaleDateString("en-US")}`, // Add day name without changing date format
      price,
      from, // Keep original 'from' time (12-hour format)
      to, // Keep original 'to' time (12-hour format)
    };

    candidate.scheduledInterviews.push(interviewDetails);
    await candidate.save();

    const interviewer = await Interviewer.findById(interviewerId);
    if (!interviewer) {
      return res
        .status(404)
        .json({ success: false, message: "Interviewer not found" });
    }

    // Store the interview details for the interviewer
    interviewer.interviewRequests.push({
      _id: interviewRequestId,
      candidateId: candidate._id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      position: candidate.jobTitle,
      date: `${dayName}, ${interviewDate.toLocaleDateString("en-US")}`, // Add day name
      time: `${from} - ${to}`, // Keep original time range
      from, // Keep original 'from' time
      to, // Keep original 'to' time
    });

    await interviewer.save();

    return res.status(201).json({
      success: true,
      interviewRequestId,
      message: "Interview scheduled successfully.",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getScheduledInterviewsService = async (candidateId) => {
  try {
    const candidate = await Candidate.findById(candidateId).populate({
      path: "scheduledInterviews.interviewerId",
      select: "firstName lastName profilePhoto", // Ensure profilePhoto is selected
    });

    if (!candidate) {
      return { success: false, message: "Candidate not found" };
    }

    console.log("Candidate interviews:", candidate.scheduledInterviews);

    return {
      success: true,
      interviews: (candidate.scheduledInterviews || []).map((interview) => {
        const interviewer = interview?.interviewerId;
        const interviewerName = interviewer
          ? `${interviewer.firstName} ${interviewer.lastName}`
          : "Interviewer not available";
        const interviewerPhoto = interviewer?.profilePhoto || ""; // Add profilePhoto here

        const date = interview?.date
          ? new Date(interview.date).toLocaleDateString("en-IN")
          : "Date not specified";

        // Ensure that `from` and `to` are returned even if they are not set
        const from = interview?.from || "Time not specified";
        const to = interview?.to || "Time not specified";
        const status = interview?.status || "Status not specified";

        console.log("Interview status:", status);

        return {
          id: interview?._id || "N/A",
          interviewerName: interviewerName,
          interviewerPhoto: interviewerPhoto, // Include profile photo in response
          date: date,
          from: from, // Adding `from` in response
          to: to, // Adding `to` in response
          status: status,
        };
      }),
    };
  } catch (error) {
    console.error("Error in getScheduledInterviewsService:", error);
    return {
      success: false,
      message: error.message || "Internal server error",
    };
  }
};
