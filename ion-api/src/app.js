const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const journalRoutes = require("./routes/journalRoutes");
const habitRoutes = require("./routes/habitRoutes");
const moodRoutes = require("./routes/moodRoutes");
const insightRoutes = require("./routes/insightRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const reflectionRoutes = require("./routes/reflectionRoutes");
const protect = require("./middleware/protect");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1);

// General API rate limiter — 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// Stricter limiter for auth routes — 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts, please try again later." },
});

app.use(helmet());
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim())
    : DEV_ORIGINS,
  credentials: true,
}));
app.use(express.json());

// Apply rate limiters before route definitions
app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);

app.get("/", (req, res) => {
  res.json({ message: "Ion API is running." });
});

app.use("/api/auth", authRoutes);

app.use("/api/tasks", protect, taskRoutes);
app.use("/api/journal", protect, journalRoutes);
app.use("/api/habits", protect, habitRoutes);
app.use("/api/moods", protect, moodRoutes);
app.use("/api/insights", protect, insightRoutes);
app.use("/api/calendar", protect, calendarRoutes);
app.use("/api/reflections", protect, reflectionRoutes);

app.use(errorHandler);

module.exports = app;
