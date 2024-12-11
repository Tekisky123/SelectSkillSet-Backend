import jwt from "jsonwebtoken";

const generateToken = (candidate) => {
  return jwt.sign(
    { id: candidate._id, email: candidate.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export default generateToken;
