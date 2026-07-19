import { Router } from "express";
import { registerController, getMe, RefreshToken, logOut } from "../controllers/auth.controller.js";
const authRouter = Router();

authRouter.post("/register", registerController)
authRouter.get("/get-me", getMe);
authRouter.get("/refresh-token",RefreshToken)
authRouter.post("/logout", logOut);


export default authRouter;