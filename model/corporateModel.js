import mongoose from "mongoose";

const corporateSchema = new mongoose.Schema(
  {
    contactName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePhoto: {
      type: String,
      default:
        "https://media.istockphoto.com/id/610003972/vector/vector-businessman-black-silhouette-isolated.jpg?s=612x612&w=0&k=20&c=Iu6j0zFZBkswfq8VLVW8XmTLLxTLM63bfvI6uXdkacM=",
    },
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
