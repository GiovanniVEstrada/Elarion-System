// Set NODE_ENV before any modules load so connectDB picks up MONGO_URI_TEST
process.env.NODE_ENV = "test";

// Load .env.test if present, fall back to .env
const path = require("path");
const fs   = require("fs");

const envTest = path.resolve(__dirname, "../../.env.test");
const envDev  = path.resolve(__dirname, "../../.env");

require("dotenv").config({ path: fs.existsSync(envTest) ? envTest : envDev });
