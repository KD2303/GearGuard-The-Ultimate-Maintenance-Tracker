const jwt = require("jsonwebtoken");
const User = require("../models/user");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Not authorized, no token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Not authorized, token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        error: "Not authorized, user no longer exists",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: "Not authorized, account is deactivated",
      });
    }

    req.user = user;

    // Wrap the rest of the request lifecycle in the AsyncLocalStorage context
    const { tenantContextMiddleware } = require("./tenantContext");
    tenantContextMiddleware(req, res, next);
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Not authorized, invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Not authorized, token has expired",
      });
    }

    res.status(500).json({
      error: error.message,
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    const isDestructive = req.method === 'DELETE' || 
                          (req.body && req.body.stage === 'scrap') || 
                          (req.body && req.body.status === 'scrapped');

    if (isDestructive) {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          error: "Forbidden: Destructive actions require Admin or Manager roles.",
        });
      }
    } else if (req.method !== 'DELETE' && !req.body.stage && !req.body.status) {
       // If it's used as a generic role requirement (not payload dependent)
       if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          error: "Forbidden: You do not have the required permissions.",
        });
      }
    }
    next();
  };
};

// Support BOTH import styles
module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.requireRole = requireRole;