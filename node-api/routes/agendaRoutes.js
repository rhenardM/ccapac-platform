const express = require("express");
const router = express.Router();
const agendaController = require("../controllers/agendaController");
const { auth, admin } = require("../middleware/auth");
const { uploadSingle } = require("../middleware/upload");

// Public routes
router.get("/", agendaController.getAllEvents);
router.get("/:slug", agendaController.getEventBySlug);

// Admin routes
router.post("/", auth, admin, uploadSingle, agendaController.createEvent);
router.put("/:slug", auth, admin, uploadSingle, agendaController.updateEvent);
router.delete("/:slug", auth, admin, agendaController.deleteEvent);

module.exports = router;