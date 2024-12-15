import bcrypt from "bcrypt";
import { Candidate } from "../model/candidateModel.js";
import generateToken from "../middleware/generateToken.js";
import { Interviewer } from "../model/interviewerModel.js";

// Register candidate in the database after OTP verification
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

// Update candidate profile
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
  ];
  const updates = Object.keys(data);

  const isAllowed = updates.every((key) => allowedUpdates.includes(key));
  if (!isAllowed) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid updates!" });
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
  try {
    // Fetch all interviewers
    const interviewers = await Interviewer.find().select(
      "firstName experience availability totalInterviews price profilePhoto jobTitle"
    );

    // Filter interviewers that have all required fields populated
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

    // If no interviewers meet the criteria, return 404
    if (filteredInterviewers.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No interviewers found with complete information",
        });
    }

    return res
      .status(200)
      .json({ success: true, interviewers: filteredInterviewers });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while fetching interviewers",
      });
  }
};

export const scheduleInterview = async (candidateId, data, res) => {
  try {
    const { interviewerId, date, price } = data;

    if (!interviewerId || !date || !price) {
      return res.status(400).json({
        success: false,
        message: "interviewerId, date, and price are required",
      });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const isAlreadyScheduled = candidate.scheduledInterviews.some(
      (interview) => new Date(interview.date).toISOString() === new Date(date).toISOString()
    );

    if (isAlreadyScheduled) {
      return res.status(400).json({
        success: false,
        message: "An interview is already scheduled on this date for this candidate.",
      });
    }

    const interviewDetails = {
      interviewerId,
      date: new Date(date),  // Ensure the date is a Date object
      price: price,
      status: "Scheduled",
    };

    // Save interview details in candidate's scheduled interviews
    candidate.scheduledInterviews.push(interviewDetails);
    await candidate.save();

    const interviewer = await Interviewer.findById(interviewerId);
    if (!interviewer) {
      return res.status(404).json({ success: false, message: "Interviewer not found" });
    }

    // Push the interview request into interviewer's interviewRequests array
    interviewer.interviewRequests.push({
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      position: candidate.jobTitle,
      date: new Date(date),  // Ensure date is a Date object
      time: new Date(date).toLocaleTimeString(),
      candidateId: candidate._id,
    });
    await interviewer.save();

    return res.status(201).json({
      success: true,
      interviews: candidate.scheduledInterviews,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


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
