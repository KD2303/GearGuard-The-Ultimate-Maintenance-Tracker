const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const csrfProtection = csrf({
  cookie: false,
});

const setupCSRFMiddleware = (app) => {
  app.use(cookieParser());

  app.use(session({
    secret: process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000,
    },
  }));

  app.use(csrfProtection);

  app.get('/api/v1/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
      res.status(403).json({
        success: false,
        error: 'CSRF token validation failed',
        message: 'Invalid or missing CSRF token',
      });
    } else {
      next(err);
    }
  });
};

module.exports = {
  setupCSRFMiddleware,
  csrfProtection,
};
