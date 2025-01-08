import express from "express";
import {
  createAdminController,
  deleteAdminController,
  getAdminController,
  getAllDetailsController,
  updateAdminController,
} from "../controller/adminController.js";

const adminRoutes = express.Router();

adminRoutes.post("/create", createAdminController);
adminRoutes.put("/update", updateAdminController);
adminRoutes.delete("/delete", deleteAdminController);
adminRoutes.get("/get", getAdminController);

adminRoutes.get("/getAll-details", getAllDetailsController);

export default adminRoutes;
