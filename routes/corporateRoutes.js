import express from "express";
import {
  createCorporateController,
  updateCorporateController,
  deleteCorporateController,
  getCorporateController,
  getCandidatesByRatingController,
  filterCandidatesByJDController,
  corporateLoginController,
  bookmarkCandidate,
  getBookmarkedCandidates,
  unbookmarkCandidate,
} from "../controller/corporateController.js";
import authenticate from "../middleware/authenticate.js";

const corporateRoutes = express.Router();

corporateRoutes.post("/signup", createCorporateController);
corporateRoutes.post("/login", corporateLoginController);
corporateRoutes.put("/updateProfile", authenticate, updateCorporateController);
corporateRoutes.delete("/delete", deleteCorporateController);
corporateRoutes.get("/getProfile", authenticate, getCorporateController);
corporateRoutes.get("/getAllCandidates", getCandidatesByRatingController);
corporateRoutes.post("/candidates/filter", filterCandidatesByJDController);
corporateRoutes.post("/bookmarkCandidate", authenticate, bookmarkCandidate);
corporateRoutes.post("/unbookmarkCandidate", authenticate, unbookmarkCandidate);
corporateRoutes.get(
  "/getBookmarkedCandidates",
  authenticate,
  getBookmarkedCandidates
);

export default corporateRoutes;
