import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const { DB_URL, DB_NAME } = process.env;
    if (!DB_URL || !DB_NAME) {
      throw new Error("Database URL or Name is missing in environment variables");
    }
    const connectionString = `${DB_URL}${DB_NAME}`;
    await mongoose.connect(connectionString);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
};

export default connectDB;
