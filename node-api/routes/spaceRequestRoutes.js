const express = require("express");
const { auth } = require("../middleware/auth");
const {
  uploadSpaceRequestDocument,
  uploadWorkflowDocument,
} = require("../middleware/spaceRequestUpload");
const spaceRequestController = require("../controllers/spaceRequestController");
const documentController = require("../controllers/spaceRequestDocumentController");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.use(auth);
router.use(
  spaceRequestController.expireOverdueCorrections
);

function handleUpload(middleware) {
  return (req, res, next) =>
    middleware(req, res, (error) => {
      if (!error) {
        return next();
      }

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

function workflowDocumentRoute(type) {
  return [
    (req, _res, next) => {
      req.params.type = type;
      next();
    },
    handleUpload(
      uploadWorkflowDocument.single("document")
    ),
    documentController.uploadDocument,
  ];
}

router.post(
  "/generate-word",
  spaceRequestController.generateWord
);

router.post(
  "/",
  handleUpload(
    uploadSpaceRequestDocument.single("document")
  ),
  spaceRequestController.create
);

/* Notifications personnelles du membre. */
router.get(
  "/notifications",
  notificationController.getMyNotifications
);

router.patch(
  "/notifications/read-all",
  notificationController.markAllAsRead
);

router.patch(
  "/notifications/:notificationId/read",
  notificationController.markAsRead
);

/* Notifications réservées à la Direction artistique. */
router.get(
  "/artistic-notifications",
  notificationController.getArtisticNotifications
);

router.patch(
  "/artistic-notifications/read-all",
  notificationController.markAllArtisticAsRead
);

router.patch(
  "/artistic-notifications/:notificationId/read",
  notificationController.markArtisticAsRead
);

/* Routes fixes : elles doivent rester avant /:id. */
router.get("/my", spaceRequestController.getMyRequests);
router.get(
  "/calendar",
  spaceRequestController.getBookedCalendarEvents
);
router.get(
  "/programme/assistants",
  spaceRequestController.getProgrammeAssistants
);
router.get(
  "/artistic/assistants",
  spaceRequestController.getArtisticAssistants
);
router.get(
  "/legal/assistants",
  spaceRequestController.getLegalAssistants
);
router.get(
  "/finance/balance",
  spaceRequestController.getFinanceBalance
);
router.get(
  "/supervisor",
  spaceRequestController.getSupervisorRequests
);
router.get("/dg", spaceRequestController.getDGRequests);
router.get(
  "/department/history",
  spaceRequestController.getDepartmentHistory
);
router.get(
  "/department",
  spaceRequestController.getDepartmentRequests
);

router.get(
  "/:id/documents",
  documentController.getDocuments
);

router.post(
  "/:id/documents/request-letter",
  ...workflowDocumentRoute("REQUEST_LETTER")
);

router.post(
  "/:id/documents/artistic-opinion",
  ...workflowDocumentRoute("ARTISTIC_OPINION")
);

router.post(
  "/:id/documents/legal-document",
  ...workflowDocumentRoute("LEGAL_DOCUMENT")
);

router.post(
  "/:id/documents/finance-quote",
  ...workflowDocumentRoute("FINANCE_QUOTE")
);

router.post(
  "/:id/assign-programme-assistant",
  spaceRequestController.assignProgrammeAssistant
);

router.post(
  "/:id/unassign-programme-assistant",
  spaceRequestController.unassignProgrammeAssistant
);

router.post(
  "/:id/assistant-review",
  spaceRequestController.assistantReview
);

router.post(
  "/:id/assign-artistic-assistant",
  spaceRequestController.assignArtisticAssistant
);

router.post(
  "/:id/artistic-assistant-review",
  spaceRequestController.artisticAssistantReview
);

router.post(
  "/:id/assign-legal-assistant",
  spaceRequestController.assignLegalAssistant
);

router.post(
  "/:id/legal-assistant-review",
  spaceRequestController.legalAssistantReview
);

router.post(
  "/:id/dg-cotation-review",
  spaceRequestController.reviewDGCotation
);

router.post(
  "/:id/submit",
  spaceRequestController.submit
);

router.post(
  "/:id/member-decision",
  spaceRequestController.memberDecision
);

router.post(
  "/:id/confirm",
  spaceRequestController.confirmMember
);

router.post(
  "/:id/resubmit-correction",
  spaceRequestController.resubmitCorrection
);

router.post(
  "/:id/validate",
  spaceRequestController.validate
);

router.post(
  "/:id/reject",
  spaceRequestController.reject
);

router.post(
  "/:id/payment-proof",
  handleUpload(
    uploadWorkflowDocument.single("document")
  ),
  spaceRequestController.uploadPaymentProof
);

router.get(
  "/:id/histories",
  spaceRequestController.getHistory
);

router.delete(
  "/:id",
  spaceRequestController.deleteBySupervisor
);

router.get("/:id", spaceRequestController.getOne);

module.exports = router;
