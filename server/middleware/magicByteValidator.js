const { fromBuffer } = require('file-type');

const magicByteValidator = async (req, res, next) => {
  try {
    // If no files were uploaded, continue
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return next();
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg", 
      "application/pdf",
      "audio/webm",
      "audio/ogg",
      "audio/wav",
      "audio/mp3", 
      "audio/mpeg",
      "audio/x-wav",
    ];

    for (const file of files) {
      if (!file.buffer) {
        return next(new Error("File buffer not found. Ensure multer memoryStorage is used."));
      }

      // Check the actual file bytes
      const fileType = await fromBuffer(file.buffer);

      // fileType will be undefined for unrecognized files (e.g. text files, scripts)
      if (!fileType) {
        return res.status(400).json({ 
            error: `Invalid file type detected for ${file.originalname}. Unknown or unsafe content.` 
        });
      }

      if (!allowedMimeTypes.includes(fileType.mime)) {
        return res.status(400).json({ 
          error: `Invalid file type detected for ${file.originalname}. Detected: ${fileType.mime}` 
        });
      }
    }

    next();
  } catch (error) {
    console.error("Magic Byte Validation Error:", error);
    next(error);
  }
};

module.exports = magicByteValidator;
