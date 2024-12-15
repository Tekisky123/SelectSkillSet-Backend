import mongoose from "mongoose";

const interviewerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: { type: String },
  mobile: { type: String },
  countryCode: { type: String },
  jobTitle: { type: String },
  profilePhoto: { type: String },
  experience: { type: String },
  totalInterviews: { type: String },
  price: { type: String },
  interviewRequests: [
    {
      candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
      candidateName: String,
      position: String,
      date: String,
      time: String,
    },
  ],
  
  availability: {
    dates: [
      {
        date: { type: Date, required: true }, 
      },
    ],
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
