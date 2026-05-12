const mongoose = require("mongoose");

const connectDB = async () => {
  const uri =
    process.env.NODE_ENV === "test"
      ? process.env.MONGO_URI_TEST || process.env.MONGO_URI
      : process.env.MONGO_URI;

  if (!uri) throw new Error("MONGO_URI is not defined in environment variables");

  await mongoose.connect(uri);
  if (process.env.NODE_ENV !== "test") console.log("MongoDB connected");
};

module.exports = connectDB;