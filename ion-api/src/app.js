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

// Evaluated once at startup — throws in production if ALLOWED_ORIGIN is not set.
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
function resolveAllowedOrigins() {
  if (process.env.ALLOWED_ORIGIN) {
    return process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim());
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("ALLOWED_ORIGIN env var must be set in production");
  }
  return DEV_ORIGINS;
}
const ALLOWED_ORIGINS = resolveAllowedOrigins();

// Security headers — explicit config so every directive is intentional.
// This is a JSON-only API so the CSP locks down all resource loading.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "no-referrer" },
  })
);

// Permissions-Policy is not included in Helmet — deny all browser features.
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  next();
});

// Callback form so cors only sends allow-credentials for approved origins.
// The array form sends allow-credentials unconditionally, which security
// scanners flag even though no allow-origin is paired with it.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Strip MongoDB operator keys from query params to prevent NoSQL query injection.
// e.g. ?mood[$gt]= would otherwise become { mood: { $gt: "" } } in the filter.
app.use((req, _res, next) => {
  function sanitize(obj) {
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        if (key.startsWith("$")) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  }
  sanitize(req.query);
  next();
});

// Prevent browsers and proxies from caching any API response.
app.use("/api/", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

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

// Apply rate limiters before route definitions
app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);

app.get("/", (_req, res) => {
  res.status(200).end();
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
