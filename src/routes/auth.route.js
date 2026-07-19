import { Router } from "express";
import { registerController, getMe, RefreshToken, logOut , logoutAll , loginController} from "../controllers/auth.controller.js";
const authRouter = Router();

authRouter.post("/register", registerController)
authRouter.get("/get-me", getMe);
authRouter.get("/refresh-token",RefreshToken)
authRouter.post("/logout", logOut);
authRouter.post("/logout-all", logoutAll);
authRouter.post("/login", loginController);

export default authRouter;