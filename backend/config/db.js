const mongoose = require("mongoose");
const { mongoUri } = require("./env");

mongoose.set("bufferCommands", false);

const isDbConnected = () => mongoose.connection.readyState === 1;

const connectDb = async () => {
  if (!mongoUri) {
    console.error("MONGO_URI is missing. DB routes will return 503.");
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
};

module.exports = {
  connectDb,
  isDbConnected
};
