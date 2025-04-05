import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto"
import { sendVerificationEmail } from "../utils/sendingMail.utils.js";
import jwt from "jsonwebtoken"

const prisma = new PrismaClient();

const generateAccessAndRefreshTokens  = async (userId) => {
    try {
        // Find user based on userId
        const user = await prisma.user.findUnique({
            where : {
                id : userId
            }
        })
        
        // Generating access and refresh token
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
        // console.log(refreshToken);

        // Refresh token passed into database
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
    // Get user data
    const { name, email, password } = req.body;
   // Validation
    if (!name || !email || !password) {
        return res.status(400)
            .json({
                success: false,
                message: "All fields are requird"
            })
    }
    try {
        // Check user alredy exist or not
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
        
        // if user not exist than generat verification token and hash password
        const hashPassword = await bcrypt.hash(password,16);
        const verificationToken = crypto.randomBytes(32).toString("hex");

        // Create new user in database
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

        //Send verification email
        await sendVerificationEmail(user.email, user.verificationToken);

        //Send response
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
    // Get data from params
    const {verificationToken} = req.params;

    // Validation 
    if(!verificationToken) {
        return res.status(400)
            .json({
                success : false,
                message : "Verification token not found."
        })
    }

    try {
        // Find user based on verification
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
        
        // Change isVerified field in DB
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
    // Get data from body
    const { email , password } = req.body;
    // Validation check
    if (!email || !password) {
        return res.status(400)
            .json({
                success: false,
                message: "All fields are requird"
            })
    }

    try {
        // Find user
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
        // User find but not verified, please send response 
        if(user.isVerified == false){
            return res.status(401)
            .json({
                success : false,
                message : "User is not verify, Please verify before login."
            })
        }
        // Check password is correct or not
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect){
            return res.status(401)
            .json({
                success: false,
                message : "Password is incorrect"
            })
        }

        // Generate access and refresh token
        const { accessToken , refreshToken } = await generateAccessAndRefreshTokens(user.id)
                
        const cookieOption = {
            httpOnly :true,
            secure : true
        }
        // Set cookie
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

const getCurrentUser = async (req, res) => {
    // Send response direct bcz check all validation in middleware
    return res.status(201)
    .json({
        success : true,
        message : "User details find successfully.",
        data : req?.user
    })
}
export {
    registerUser,
    verifyUser,
    loginUser,
    getCurrentUser
}