import { Router } from "express";
import { registerController, getMe, RefreshToken } from "../controllers/auth.controller.js";
const authRouter = Router();

authRouter.post("/register", registerController)
authRouter.get("/get-me", getMe);
authRouter.get("/refresh-token",RefreshToken)



export default authRouter;