const express = require("express");
const router = express.Router();
const actualiteController = require("../controllers/actualiteController");
const { auth, admin } = require("../middleware/auth");
const { uploadSingle } = require("../middleware/upload");

// Public routes
router.get("/", actualiteController.getAllActualites);
router.get("/:slug", actualiteController.getActualiteBySlug);

// Admin routes
router.post("/", auth, admin, uploadSingle, actualiteController.createActualite);
router.put("/:slug", auth, admin, uploadSingle, actualiteController.updateActualite);
router.delete("/:slug", auth, admin, actualiteController.deleteActualite);

module.exports = router;