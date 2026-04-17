const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Not authorized, no token", errors: [] });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: "Not authorized, invalid token", errors: [] });
  }

  req.user = await User.findById(decoded.id).select("-password");

  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authorized, user not found", errors: [] });
  }

  next();
});

module.exports = protect;
