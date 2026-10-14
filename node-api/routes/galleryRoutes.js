const express = require("express");
const router = express.Router();
const galleryController = require("../controllers/galleryController");
const { auth, admin } = require("../middleware/auth");
const { uploadSingle } = require("../middleware/upload");

// Public routes
router.get("/", galleryController.getAllMedia);
router.get("/:documentId", galleryController.getMediaByDocumentId);

// Admin routes
router.post("/", auth, admin, uploadSingle, galleryController.uploadMedia);
router.delete("/:id", auth, admin, galleryController.deleteMedia);

module.exports = router;