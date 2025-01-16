import generateToken from "../middleware/generateToken.js";
import { Admin } from "../model/adminModel.js";
import bcrypt from "bcrypt";
import { Candidate } from "../model/candidateModel.js";
import { Interviewer } from "../model/interviewerModel.js";
import { Corporate } from "../model/corporateModel.js";

export const createAdminService = async (username, email, password) => {
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    throw new Error("Admin already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new Admin({
    username,
    email,
    password: hashedPassword,
  });

  await admin.save();

  return admin;
};

export const loginAdminService = async (email, password) => {
  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new Error("Admin not found");
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(admin);

  return { admin, token };
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

export const getAllAdminService = async () => {
  const admins = await Admin.find().select("-password");
  if (!admins || admins.length === 0) {
    throw new Error("No admins found");
  }

  return admins;
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


export const getCorporateDetailsService = async () => {
  try {
    return await Corporate.aggregate([
      {
        $project: {
          contactName: 1,
          email: 1,
          profilePhoto: 1,
          phoneNumber: 1,
          companyName: 1,
          location: 1,
          industry: 1,
          jobDescriptions: 1,
          bookmarks: 1,
        },
      },
    ]);
  } catch (error) {
    throw new Error(error.message);
  }
};


export const getTotalCountsService = async () => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    const totalInterviewers = await Interviewer.countDocuments();
    const totalCorporates = await Corporate.countDocuments();
    return { totalCandidates, totalInterviewers, totalCorporates };
  } catch (error) {
    throw new Error(error.message);
  }
};


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
