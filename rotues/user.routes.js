import express from "express";
import { 
    registerUser,
    verifyUser,
    loginUser,
    getCurrentUser
 } from "../controllers/user.controllers.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const userRouter =  express.Router();

userRouter.post("/register", registerUser)
userRouter.get("/verify/:verificationToken" , verifyUser)
userRouter.post("/login", loginUser)
userRouter.get("/current-user", isLoggedIn , getCurrentUser)
export default userRouter;