const express = require("express");
const { auth } = require("../middleware/auth");
const {
  uploadSpaceRequestDocument,
} = require("../middleware/spaceRequestUpload");
const projectProposalController = require("../controllers/projectProposalController");

const router = express.Router();

router.use(auth);

function handleUpload(middleware) {
  return (req, res, next) =>
    middleware(req, res, (error) => {
      if (!error) return next();

      const messages = {
        LIMIT_FILE_SIZE:
          "Le document ne doit pas dépasser 10 Mo.",
        LIMIT_FILE_COUNT:
          "Un seul document peut être envoyé à la fois.",
        LIMIT_UNEXPECTED_FILE:
          'Le champ du fichier doit être nommé "document".',
      };

      return res.status(400).json({
        success: false,
        message:
          messages[error?.code] ||
          error?.message ||
          "Le document envoyé est invalide.",
      });
    });
}

router.post(
  "/",
  handleUpload(
    uploadSpaceRequestDocument.single("document")
  ),
  projectProposalController.create
);

router.get("/my", projectProposalController.getMyProposals);

// Les routes fixes doivent rester avant /:id.
router.get(
  "/artistic",
  projectProposalController.getArtisticProposals
);
router.get(
  "/artistic/:id",
  projectProposalController.getOne
);
router.post(
  "/artistic/:id/assign",
  projectProposalController.assignAssistant
);
router.post(
  "/artistic/:id/review",
  projectProposalController.review
);

router.get("/:id", projectProposalController.getOne);

module.exports = router;
