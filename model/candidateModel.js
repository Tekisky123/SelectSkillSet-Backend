import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    countryCode: { type: String },
    jobTitle: { type: String },
    location: { type: String },
    profilePhoto: { type: String },
    profile: {
      resume: { type: String },
      linkedIn: { type: String },
    },
    statistics: {
      monthlyStatistics: {
        completedInterviews: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        feedbackCount: { type: Number, default: 0 },
      },
      feedbacks: [
        {
          feedbackData: { type: String },
          rating: { type: Number },
        },
      ],
    },
    scheduledInterviews: [
      {
        interviewerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Interviewer",
        },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        price: { type: Number },
        status: {
          type: String,
          enum: ["Scheduled", "Completed", "Cancelled"],
          default: "Scheduled",
        },
      },
    ],
  },
  { timestamps: true }
);

export const Candidate = mongoose.model("Candidate", candidateSchema);
