import {
  createAdminService,
  deleteAdminService,
  getAllAdminService,
  getCandidatesDetailsService,
  getInterviewersDetailsService,
  getInterviewStatusesService,
  getCorporateDetailsService,
  getTotalCountsService,
  loginAdminService,
  updateAdminService,
} from "../services/adminServices.js";

export const createAdminController = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const admin = await createAdminService(username, email, password);

    res.status(201).json({
      message: "Admin created successfully",
      admin,
    });
  } catch (error) {
    if (error.message === "Admin already exists") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { admin, token } = await loginAdminService(email, password);

    res.status(200).json({
      message: "Login successful",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
      },
      token,
    });
  } catch (error) {
    if (
      error.message === "Admin not found" ||
      error.message === "Invalid email or password"
    ) {
      return res.status(401).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateAdminController = async (req, res) => {
  try {
    const { id } = req.user;
    const updateData = req.body;

    const updatedAdmin = await updateAdminService(id, updateData);

    res.status(200).json({
      message: "Admin updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    if (error.message === "Admin not found") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteAdminController = async (req, res) => {
  try {
    const { id } = req.user;

    const result = await deleteAdminService(id);

    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Admin not found") {
      return res.status(404).json({ message: error.message });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllAdminController = async (req, res) => {
  try {
    const admins = await getAllAdminService();

    res.status(200).json({
      message: "Admin details fetched successfully",
      admins,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllDetailsController = async (req, res) => {
  try {
    const candidates = await getCandidatesDetailsService();
    const interviewers = await getInterviewersDetailsService();
    const corporates = await getCorporateDetailsService();
    const { totalCandidates, totalInterviewers, totalCorporates } =
      await getTotalCountsService();
    const { pendingCount, completedCount, cancelledCount } =
      await getInterviewStatusesService();

    res.status(200).json({
      message: "Details fetched successfully",
      totalCandidates,
      totalInterviewers,
      totalCorporates,
      pendingCount,
      completedCount,
      cancelledCount,
      candidates,
      interviewers,
      corporates,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
