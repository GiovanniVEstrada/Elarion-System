const errorHandler = (err, req, res, next) => {
  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(400).json({ success: false, message: "Invalid ID format", errors: [] });
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  const status = err.statusCode || err.status || 500;
  // Only forward the error message for explicit app errors (4xx). Unexpected
  // throws (DB failures, etc.) must not leak internal details to the client.
  const message = status < 500 ? (err.message || "Request failed") : "Internal Server Error";
  res.status(status).json({ success: false, message, errors: err.errors || [] });
};

module.exports = errorHandler;
