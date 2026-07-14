import { Router } from "express";
import { registerController , getMe } from "../controllers/auth.controller.js";
const authRouter = Router();

authRouter.post("/register", registerController)
authRouter.get("/get-me",getMe)


export default authRouter;