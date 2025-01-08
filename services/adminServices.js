import generateToken from "../middleware/generateToken.js";
import { Admin } from "../model/adminModel.js";
import bcrypt from "bcrypt";
import { Candidate } from "../model/candidateModel.js";
import { Interviewer } from "../model/interviewerModel.js";

export const createAdminService = async (username, email, password) => {
  // Check if admin already exists
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new Error("Admin already exists");
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new admin
  const newAdmin = await Admin.create({
    username,
    email,
    password: hashedPassword,
  });

  const token = generateToken(newAdmin);

  return {
    admin: {
      id: newAdmin._id,
      username: newAdmin.username,
      email: newAdmin.email,
    },
    token,
  };
};

export const updateAdminService = async (id, updateData) => {
  const admin = await Admin.findById(id);
  if (!admin) {
    throw new Error("Admin not found");
  }

  Object.assign(admin, updateData);

  const updatedAdmin = await admin.save();

  return {
    id: updatedAdmin._id,
    username: updatedAdmin.username,
    email: updatedAdmin.email,
  };
};

export const deleteAdminService = async (id) => {
  const admin = await Admin.findById(id);
  if (!admin) {
    throw new Error("Admin not found");
  }

  await admin.deleteOne();

  return { message: "Admin deleted successfully" };
};

export const getAdminService = async (id) => {
  const admin = await Admin.findById(id).select("-password");
  if (!admin) {
    throw new Error("Admin not found");
  }

  return admin;
};

export const getCandidatesDetailsService = async () => {
  try {
    return await Candidate.aggregate([
      {
        $lookup: {
          from: "interviewers",
          localField: "scheduledInterviews.interviewerId",
          foreignField: "_id",
          as: "interviewersDetails",
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          jobTitle: 1,
          location: 1,
          profilePhoto: 1,
          resume: 1,
          scheduledInterviews: 1,
        },
      },
    ]);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to fetch interviewer details
export const getInterviewersDetailsService = async () => {
  try {
    return await Interviewer.aggregate([
      {
        $lookup: {
          from: "candidates",
          localField: "interviewRequests.candidateId",
          foreignField: "_id",
          as: "candidatesDetails",
        },
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          jobTitle: 1,
          location: 1,
          profilePhoto: 1,
          experience: 1,
          skills: 1,
          interviewRequests: 1,
        },
      },
    ]);
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to fetch total counts
export const getTotalCountsService = async () => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    const totalInterviewers = await Interviewer.countDocuments();
    return { totalCandidates, totalInterviewers };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Service to fetch interview statuses
export const getInterviewStatusesService = async () => {
  try {
    const statuses = await Candidate.aggregate([
      { $unwind: "$scheduledInterviews" },
      {
        $group: {
          _id: "$scheduledInterviews.status",
          count: { $sum: 1 },
        },
      },
    ]);

    const pendingCount =
      statuses.find((s) => s._id === "Requested")?.count || 0;
    const completedCount =
      statuses.find((s) => s._id === "Approved")?.count || 0;
    const cancelledCount =
      statuses.find((s) => s._id === "Cancelled")?.count || 0;

    return { pendingCount, completedCount, cancelledCount };
  } catch (error) {
    throw new Error(error.message);
  }
};
