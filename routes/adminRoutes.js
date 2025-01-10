import express from "express";
import {
  createAdminController,
  deleteAdminController,
  getAllAdminController,
  getAllDetailsController,
  loginController,
  updateAdminController,
} from "../controller/adminController.js";
import authenticate from "../middleware/authenticate.js";

const adminRoutes = express.Router();

adminRoutes.post("/login", loginController);
adminRoutes.post("/create", authenticate, createAdminController);
adminRoutes.put("/update", authenticate, updateAdminController);
adminRoutes.delete("/delete", authenticate, deleteAdminController);
adminRoutes.get("/getAll", authenticate, getAllAdminController);
adminRoutes.get("/getAll-details", authenticate, getAllDetailsController);

export default adminRoutes;
