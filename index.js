import express, { urlencoded } from "express";
import cors from "cors";
import userRouter from "./rotues/user.routes.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();
const app =  express();
const PORT = process.env.PORT || 5050;

app.use(express.json());
app.use(urlencoded({
    extended: true
}));
app.use(cors({
        origin:`localhost:${PORT}`,
        methods:['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
      })
);

app.use(cookieParser());

const port = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// console.log(process.env);
// console.log("consfig : ", dotenv.config());

app.use("/api/v1/users", userRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

