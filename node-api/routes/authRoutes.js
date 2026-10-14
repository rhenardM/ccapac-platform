const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const authController = require(
  "../controllers/authController"
);

const {
  auth,
  authorize,
} = require("../middleware/auth");

const registerValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email invalide")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage(
      "Le mot de passe doit faire au moins 6 caractères"
    ),

  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("Le prénom est requis"),

  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("Le nom est requis"),
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email invalide")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Mot de passe requis"),
];

const changePasswordValidation = [
  body("current_password")
    .notEmpty()
    .withMessage("Mot de passe actuel requis"),

  body("new_password")
    .isLength({ min: 6 })
    .withMessage(
      "Le nouveau mot de passe doit faire au moins 6 caractères"
    ),
];

const internalAuthBasePath =
  process.env.INTERNAL_AUTH_PATH ||
  "/internal/ccapac-validation-7d2f9a4c81";

if (!internalAuthBasePath.startsWith("/")) {
  throw new Error(
    "INTERNAL_AUTH_PATH doit commencer par un slash."
  );
}

// Routes publiques existantes : comportement inchangé.
router.post(
  "/register",
  registerValidation,
  authController.register
);

router.get(
  "/verify-email",
  authController.verifyEmail
);

router.post(
  "/resend-verification",
  authController.resendVerification
);

router.post(
  "/login",
  loginValidation,
  authController.login
);

router.post(
  "/google",
  authController.googleLogin
);

router.post(
  "/forgot-password",
  authController.forgotPassword
);

router.post(
  "/reset-password",
  authController.resetPassword
);

// Routes privées internes, absentes de la navigation publique.
router.post(
  `${internalAuthBasePath}/register`,
  registerValidation,
  authController.internalRegister
);

router.post(
  `${internalAuthBasePath}/login`,
  loginValidation,
  authController.internalLogin
);

// Routes protégées existantes.
router.get(
  "/profile",
  auth,
  authController.getProfile
);

router.put(
  "/profile",
  auth,
  authController.updateProfile
);

router.put(
  "/change-password",
  auth,
  changePasswordValidation,
  authController.changePassword
);

// Administration existante.
router.post(
  "/admin/create-user",
  auth,
  authorize("ADMIN"),
  authController.adminCreateUser
);

module.exports = router;
