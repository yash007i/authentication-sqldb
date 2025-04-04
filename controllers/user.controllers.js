import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto"
import { sendVerificationEmail } from "../utils/sendingMail.utils.js";
import jwt from "jsonwebtoken"

const prisma = new PrismaClient();

const generateAccessAndRefreshTokens  = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where : {
                id : userId
            }
        })
        
        const accessToken = await jwt.sign(
            {
                id : user.id
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        )

        const refreshToken = await jwt.sign(
            {
                id : user.id
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
        console.log(refreshToken);
        
        const userAfterToken = await prisma.user.update({
            where : {
                id : user.id
            },
            data : {
                refreshToken : refreshToken,
            }
        })

        return { accessToken , refreshToken }
    } catch (error) {
        console.log( "Error while generating token",error);
    }
} 
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
   
    if (!name || !email || !password) {
        return res.status(400)
            .json({
                success: false,
                message: "All fields are requird"
            })
    }
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        
        if(existingUser){
            return res.status(400)
            .json({
                success : false,
                message : "User alredy register."
            })
        }
        
        const hashPassword = await bcrypt.hash(password,16);
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password : hashPassword,
                verificationToken
            }
        })
        
        if(!user){
            return res.status(400)
            .json({
                success : false,
                message : "Error while creating a user."
            })
        }

        await sendVerificationEmail(user.email, user.verificationToken);

        return res.status(201).json({
            suucess: true,
            message: "User registered successfully, please verify your email address",
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              isVerified: user.isVerified,
            },
        });
    } catch (error) {
        return res.status(500)
        .json({
            success : false,
            error: error.message,
            message : "Registration Failed",
        });
    }

}

const verifyUser = async (req,res) => {
    const {verificationToken} = req.params;

    if(!verificationToken) {
        return res.status(400)
            .json({
                success : false,
                message : "Verification token not found."
        })
    }

    try {
        const user =  await prisma.user.findFirst({
            where : {
                verificationToken
            }
        })
        if(!user){
            res.status(400)
            .json({
                success : false,
                message : "User not found by this token."
            })
        }
    
        const userAfterVerifivation  = await prisma.user.update({
            where : {
                email : user.email
            },
            data : {
                isVerified : true,
                verificationToken : "NULL",
            }
        })
        
        res.status(200)
        .json({
            success: true,
            message :"User verify successfully."
        })
    } catch (error) {
        res.status(400)
            .json({
                success : false,
                error : error.message,
                message : "Error while verfying user."
        })
    }
    
}

const loginUser = async (req, res) => {
    const { email , password } = req.body;

    if (!email || !password) {
        return res.status(400)
            .json({
                success: false,
                message: "All fields are requird"
            })
    }

    try {
        const user = await prisma.user.findUnique({
            where : {
                email
            }
        })

        if(!user){
            return res.status(401)
            .json({
                success : false,
                message : "User not found, Please register first."
            })
        }

        if(user.isVerified == false){
            return res.status(401)
            .json({
                success : false,
                message : "User is not verify."
            })
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect){
            return res.status(401)
            .json({
                success: false,
                message : "Password is incorrect"
            })
        }

        const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user.id)
                
        const cookieOption = {
            httpOnly :true,
            secure : true
        }

        res.cookie("accessToken", accessToken, cookieOption)
        res.cookie("refreshToken", refreshToken, cookieOption)
        res.status(200).json({
            success : true , 
            message : "User login successfully",
            user : {
                email,
                name : user.name,
                refreshToken,
            }
        })
    } catch (error) {
        res.status(400).json({
            success : false,
            message : "Error while login user",
            error
        })
    }

}
export {
    registerUser,
    verifyUser,
    loginUser
}