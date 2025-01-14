import bcrypt from "bcrypt";
import generateToken from "../middleware/generateToken.js";
import { Corporate } from "../model/corporateModel.js";
import { Candidate } from "../model/candidateModel.js";

export const corporateLoginService = async (email, password) => {
  const corporate = await Corporate.findOne({ email });
  if (!corporate) {
    throw new Error("Corporate not found");
  }

  const isPasswordValid = await bcrypt.compare(password, corporate.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = generateToken(corporate);

  return {
    corporate: {
      id: corporate._id,
      contactName: corporate.contactName,
      email: corporate.email,
      companyName: corporate.companyName,
      location: corporate.location,
    },
    token,
  };
};

export const createCorporateService = async (data) => {
  const {
    contactName,
    email,
    password,
    countryCode,
    phoneNumber,
    companyName,
    location,
    industry,
  } = data;

  const existingCorporate = await Corporate.findOne({ email });
  if (existingCorporate) {
    throw new Error("Corporate already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const corporate = new Corporate({
    contactName,
    email,
    password: hashedPassword,
    countryCode,
    phoneNumber,
    companyName,
    location,
    industry,
  });

  await corporate.save();
  return corporate;
};

export const updateCorporateService = async (id, data) => {
  const updatedCorporate = await Corporate.findByIdAndUpdate(id, data, {
    new: true,
  });
  if (!updatedCorporate) {
    throw new Error("Corporate not found");
  }
  return updatedCorporate;
};

export const deleteCorporateService = async (id) => {
  const deletedCorporate = await Corporate.findByIdAndDelete(id);
  if (!deletedCorporate) {
    throw new Error("Corporate not found");
  }
  return deletedCorporate;
};

export const getCorporateService = async (id) => {
  const corporate = await Corporate.findById(id).select("-password");
  if (!corporate) {
    throw new Error("Corporate not found");
  }
  return corporate;
};

// Get Candidates Sorted by Rating
export const getCandidatesByRatingService = async () => {
  return await Candidate.find()
    .sort({ "statistics.averageRating": -1 })
    .select(
      "firstName lastName email countryCode mobile location profilePhoto linkedIn skills statistics.averageRating resume"
    );
};

export const filterCandidatesByJDService = async (skillsRequired) => {
    return await Candidate.find({
      skills: { $in: skillsRequired },
    }).select(
      "firstName lastName email mobile location profilePhoto linkedIn skills statistics.averageRating resume"
    );
  };
  