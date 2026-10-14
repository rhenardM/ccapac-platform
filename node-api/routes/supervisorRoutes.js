const express = require("express");
const { auth } = require("../middleware/auth");
const controller = require(
  "../controllers/supervisorController"
);

const router = express.Router();

router.use(auth);

router.use((req, res, next) => {
  if (
    ![
      "SUPERVISEUR",
      "ADMIN",
    ].includes(req.user.role)
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Accès réservé au superviseur.",
    });
  }

  next();
});

router.get(
  "/users",
  controller.getUsers
);

router.put(
  "/users/:id/role",
  controller.updateRole
);

router.put(
  "/users/:id/reset-password",
  controller.resetPassword
);

router.delete(
  "/users/:id",
  controller.deleteUser
);

module.exports = router;