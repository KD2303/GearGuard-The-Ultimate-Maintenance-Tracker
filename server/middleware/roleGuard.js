/**
 * roleGuard middleware — restricts route access to specified roles.
 *
 * Usage:
 *   const roleGuard = require('../middleware/roleGuard');
 *
 *   // Admin only
 *   router.get('/admin/users', protect, roleGuard('Admin'), getAllUsers);
 *
 *   // Admin or Manager
 *   router.get('/admin/stats', protect, roleGuard('Admin', 'Manager'), getStats);
 *
 * Must be used AFTER the `protect` middleware so that req.user is populated.
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}.`,
      });
    }

    next();
  };
};

module.exports = roleGuard;
