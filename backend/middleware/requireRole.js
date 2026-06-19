const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Permission denied" });
  }

  next();
};

module.exports = requireRole;
