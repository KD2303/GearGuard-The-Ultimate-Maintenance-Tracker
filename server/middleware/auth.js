const jwt = require("jsonwebtoken");
const User = require("../models/user");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authorized, no token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Not authorized, user no longer exists" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Not authorized, account is deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Not authorized, invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Not authorized, token has expired" });
    }
    res.status(500).json({ error: error.message });
  }
};

// Named export for backward compatibility with equipment.js
exports.verifyToken = protect;

module.exports = protect;