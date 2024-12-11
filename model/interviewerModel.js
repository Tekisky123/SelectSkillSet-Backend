import mongoose from "mongoose";

const interviewerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String },
  mobile: { type: String },
  jobTitle: { type: String },
  profilePhoto: { type: String },
  experience: { type: String },
  totalInterviews: { type: String },
  price: { type: String },
  interviewRequests: [
    {
      candidateName: String,
      position: String,
      date: String,
      time: String,
    },
  ],
  availability: {
    dateFrom: { type: Date },
    dateTo: { type: Date },
    timeFrom: { type: String },
    timeTo: { type: String },
    status: {
      type: String,
      enum: ["available", "unavailable"],
     
    },
  },
  statistics: {
    completedInterviews: { type: Number, default: 0 },
    pendingRequests: { type: Number, default: 0 },
    totalAccepted: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
  },
  feedbacks: [
    {
      reviewerName: String,
      feedbackText: String,
      rating: Number,
      date: String,
    },
  ],
});

export const Interviewer = mongoose.model("Interviewer", interviewerSchema);
