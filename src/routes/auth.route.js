import { Router } from "express";
import { registerController, getMe, RefreshToken, logOut, logoutAll, loginController, verifyEmail } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/register", registerController)
authRouter.get("/get-me", getMe);
authRouter.get("/refresh-token",RefreshToken)
authRouter.post("/logout", logOut);
authRouter.post("/logout-all", logoutAll);
authRouter.post("/login", loginController);
authRouter.get("/verify-email",verifyEmail)

export default authRouter;