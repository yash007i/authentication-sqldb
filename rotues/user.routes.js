import express from "express";
import { 
    registerUser,
    verifyUser,
    loginUser
 } from "../controllers/user.controllers.js";

const userRouter =  express.Router();

userRouter.post("/register", registerUser)
userRouter.get("/verify/:verificationToken" , verifyUser)
userRouter.post("/login", loginUser)
export default userRouter;