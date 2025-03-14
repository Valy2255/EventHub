import express from "express";
import passport from "passport";
import * as authController from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Rute normale de autentificare
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", auth, authController.getMe);

// Rute pentru autentificare Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  authController.socialLoginCallback
);

// Rute pentru autentificare Facebook
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email", "public_profile"],
  })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/login",
  }),
  authController.socialLoginCallback
);

export default router;
