import mongoose from "mongoose";

const corporateSchema = new mongoose.Schema(
  {
    contactName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePhoto: { type: String },
    countryCode: { type: String },
    phoneNumber: { type: String },
    companyName: { type: String },
    location: { type: String },
    industry: { type: String },
    jobDescriptions: [
      {
        title: { type: String },
        skillsRequired: [{ type: String }],
        description: { type: String },
      },
    ],
    bookmarks: [
      {
        candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
        bookmarkedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Corporate = mongoose.model("Corporate", corporateSchema);
