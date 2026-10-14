const express = require("express");
const router = express.Router();

const programmeController = require(
  "../controllers/programmeController"
);

const {
  auth,
  admin,
} = require("../middleware/auth");

const {
  uploadSingle,
} = require("../middleware/upload");

/**
 * Autorise la création d’événements aux utilisateurs
 * du service des Programmes et aux administrateurs.
 */
const programmeTeam = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise.",
    });
  }

  const role = String(
    req.user.role || ""
  ).toUpperCase();

  const allowedRoles = [
    "ADMIN",
    "PROGRAMME_SUPERVISEUR",
    "PROGRAMME_ASSISTANT",
  ];

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      message:
        "Seul le service des Programmes peut créer un événement.",
    });
  }

  next();
};

/*
|--------------------------------------------------------------------------
| Routes publiques
|--------------------------------------------------------------------------
*/

/**
 * Liste des programmes.
 *
 * Tous les programmes :
 * GET /api/programmes
 *
 * Programmes internes publiés :
 * GET /api/programmes?eventType=INTERNE&published=true
 *
 * Événements externes publiés :
 * GET /api/programmes?eventType=EXTERNE&published=true
 */
router.get(
  "/",
  programmeController.getAllProgrammes
);

/**
 * Recherche par documentId.
 *
 * Cette route doit être déclarée avant "/:id".
 */
router.get(
  "/document/:documentId",
  programmeController.getProgrammeByDocumentId
);

/**
 * Recherche par identifiant numérique.
 */
router.get(
  "/:id",
  programmeController.getProgrammeById
);

/*
|--------------------------------------------------------------------------
| Création depuis le calendrier Programme
|--------------------------------------------------------------------------
*/

/**
 * Création d’un événement.
 *
 * Utilisateurs autorisés :
 * - ADMIN
 * - PROGRAMME_SUPERVISEUR
 * - PROGRAMME_ASSISTANT
 *
 * Données attendues :
 * - title
 * - author
 * - eventType
 * - eventDate
 * - spaceId
 * - publicationStatus
 * - documentId
 * - image, facultative
 */
router.post(
  "/",
  auth,
  programmeTeam,
  uploadSingle,
  programmeController.createProgramme
);

/*
|--------------------------------------------------------------------------
| Administration
|--------------------------------------------------------------------------
*/

/**
 * La modification reste réservée aux administrateurs.
 */
router.put(
  "/:id",
  auth,
  admin,
  uploadSingle,
  programmeController.updateProgramme
);

/**
 * La suppression reste réservée aux administrateurs.
 */
router.delete(
  "/:id",
  auth,
  admin,
  programmeController.deleteProgramme
);

module.exports = router;