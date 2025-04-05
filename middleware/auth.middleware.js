import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const isLoggedIn = async (req, res, next) => {
    try {
        let token = req.cookies?.accessToken

        if(!token){
             return res.status(401)
            .json({
                success : false,
                message : "Unauthorized user."
            })
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await prisma.user.findUnique({
            where : {
               id :  decodedToken?.id
            }
        })
        if(!user){
            return res.status(401)
            .json({
                success : false,
                message : "User not found using this token."
            })
        }
        // console.log(req.user);
        
        req.user = user;
        next();
    } catch (error) {
        return res.status(400)
        .json({
            success : false,
            message : "Error while get user.",
            error : error.message
        })
    }
    next ();
}