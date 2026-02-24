// Back_end/routes/uploads.js
const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Where to store images on disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'members'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeName = `member_${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// POST /api/uploads/member-photo  (field name: "image")
router.post('/member-photo', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required' });
  }

  // This URL is what the frontend will store in GymMembers.photo_url
  const relativeUrl = `/uploads/members/${req.file.filename}`;
  res.json({ url: relativeUrl });
});

module.exports = router;
