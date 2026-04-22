exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    console.log("USER ROLE:", req.user); // 🔥 add this

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    next();
  };
};