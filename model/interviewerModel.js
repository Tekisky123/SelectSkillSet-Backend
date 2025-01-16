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
  profilePhoto: {
    type: String,
    default:
      "https://static.vecteezy.com/system/resources/previews/005/544/718/non_2x/profile-icon-design-free-vector.jpg",
  },
  experience: { type: String },
  totalInterviews: { type: String },
  price: { type: String },
  skills: [{ type: String }],
  interviewRequests: [
    {
      candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
      candidateName: String,
      position: String,
      date: String,
      time: String,
      status: {
        type: String,
        enum: ["Requested", "Approved", "Cancelled"],
        default: "Requested",
      },
      googleMeetLink: { type: String },
    },
  ],
  availability: {
    dates: [
      {
        date: { type: String, required: true },
        from: { type: String, required: true },
        to: { type: String, required: true },
      },
    ],
  },
  statistics: {
    completedInterviews: { type: Number, default: 0 },
    pendingRequests: { type: Number, default: 0 },
    totalAccepted: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalFeedbackCount: { type: Number, default: 0 },
    feedbacks: [
      {
        interviewRequestId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        feedbackData: { type: Object, required: true },
        rating: { type: Number, required: true },
      },
    ],
  },
});

export const Interviewer = mongoose.model("Interviewer", interviewerSchema);
