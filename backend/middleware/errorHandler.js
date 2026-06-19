const notFoundHandler = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

const errorHandler = (error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  console.error(`${req.method} ${req.originalUrl} error:`, error.message);

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid resource id" });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "Duplicate resource" });
  }

  return res.status(500).json({ message: "Internal server error" });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
