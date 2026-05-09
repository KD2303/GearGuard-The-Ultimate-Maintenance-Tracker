const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

router.post("/attachments", (req, res) => {
  upload.array("attachments", 5)(req, res, (err) => {
    try {
      if (err) {
        return res.status(400).json({
          error: err.message,
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: "No files uploaded",
        });
      }

      const uploadedFiles = req.files.map((file) => ({
        filename: file.filename,
        fileUrl: `/uploads/attachments/${file.filename}`,
        fileType: file.mimetype,
      }));

      return res.status(200).json(uploadedFiles);
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  });
});

module.exports = router;