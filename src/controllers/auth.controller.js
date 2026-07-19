import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import crypto, { verify } from "crypto";
import { sendEmail } from "../services/email.service.js";
import { generateOtp, getOtpHtml } from "../utils/utils.js"
import otpModel from "../models/otp.model.js";

const registerController = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const isAlreadyRegistered = await userModel.findOne({
            $or: [{ username }, { email }],
        });

        if (isAlreadyRegistered) {
            return res.status(409).json({
                message: "Username or Email already exists",
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hash,
        });

        const otp = generateOtp();

        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        await otpModel.deleteMany({ user: user._id });

        await otpModel.create({
            email: user.email,
            user: user._id,
            otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        await sendEmail(
            user.email,
            "OTP Verification",
            `Your OTP is ${otp}`,
            getOtpHtml(otp)
        );

        
        res.status(201).json({
            message: "User created successfully",
            user: {
                username: user.username,
                email: user.email,
                verified:user.verified
            },
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

const loginController = async (req, res) => {
    try {

        const { username, email, password } = req.body;
        
        if (!email) {
            return res.status(400).json({ Message: "email is required" })
        }
        
        if (!password) {
            return res.status(400).json({ Message: "password is required" })
        }

        const user = await userModel.findOne({
            $or: [{ username }, { email }]
        });
        
        if (!user) {
            return res.status(400).json({ message: "User Does not exists" });
        }

        const validUser = await bcrypt.compare(password, user.password);

        if (!validUser) {
            return res.status(400).json({
                message: "Incorrect password",
            });
        }

        if (!user.verified)
        {
            return res.status(401).json({ message: "Email is not verified" });
        }
        
        const refreshToken = jwt.sign(
            { id: user._id },
            config.JWT_SECRET,
            { expiresIn: "7d" } //7days
        );

        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        const session = await sessionModel.create({
            userId: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers["user-agent"],

        })
        const accessToken = jwt.sign(
            {
                id: user._id,
                sessionId: session._id

            },
            config.JWT_SECRET,
            { expiresIn: "10m" }
        );



        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        res.status(200).json({
            message: "user Login Successfully",
            user: {
                username: user.username,
                email: user.email,
            },
            accessToken,
        });




    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

const getMe = async (req, res) => {
    
    try {
        
        const token = req.headers.authorization?.split(" ")[1];

        if (!token)
        {
            return res.status(401).json({ message: "Token is required" });
        }

        const decode = jwt.verify(token, config.JWT_SECRET);

        if (!decode)
        {
            return res.status(401).json({ message: "Token is invalid" });
        }


        const user = await userModel.findById(decode.id);

        res.status(200).json({
            message: "User data",
            user: {
                username: user.username,
                email: user.email,
            }
        }
        )


    } catch (err)
    {
        console.log(err)
        return res.status(500).json({message:"Internal server error"})
    }
}

const RefreshToken = async(req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({ message: "Token invalid" });
        }


        const decode = jwt.verify(refreshToken, config.JWT_SECRET);

        if (!decode) {
            return res.status(401).json({ message: "Token is invalid" });
        }

        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");
        
        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked:false
        })

        if (!session)
        {
            return res.status(400).json({ message: "Refresh Token invalid" });
        }

        const newRefreshToken = jwt.sign({ id: decode.id }, config.JWT_SECRET, { expiresIn: "7d" });


        const newRefreshTokenHash = crypto
            .createHash("sha256")
            .update(newRefreshToken)
            .digest("hex");
        
        session.refreshTokenHash = newRefreshTokenHash;
        await session.save();


        const accessToken = jwt.sign({ id: decode.id , sessionId:session._id}, config.JWT_SECRET,{expiresIn:"15m"});

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        res.status(200).json({ message: "Access token refreshed Successfully", accessToken });
    }
    catch (err)
    {
        console.error(err);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

const logOut = async (req, res) => {
    
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken)
        {
            return res.status(400).json({ message: "Refresh token do not exists" });
        }

        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        const session = await sessionModel.findOne({
            refreshTokenHash,
            revoked:false
        })

        if (!session)
        {
            return res.status(400).json({ message: "Session token invalid" });
        }

        session.revoked = true;
        await session.save();

        res.clearCookie("refreshToken");
        return res.status(200).json({ message: "User logout Successfully" });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }

    


}

const logoutAll = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                message: "Refresh token is required",
            });
        }

        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        await sessionModel.updateMany(
            {
                userId: decoded.id,
                revoked: false,
            },
            {
                $set: {
                    revoked: true,
                },
            }
        );

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });

        return res.status(200).json({
            message: "Logged out from all devices successfully",
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { otp, email } = req.body;

        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const otpDoc = await otpModel.findOne({
            email,
            otpHash,
        });

        if (!otpDoc) {
            return res.status(400).json({
                message: "Invalid OTP",
            });
        }

        const user = await userModel.findByIdAndUpdate(
            otpDoc.user,
            { verified: true },
            { new: true }
        );

        await otpModel.deleteMany({
            user: otpDoc.user,
        });

        return res.status(200).json({
            message: "User verified successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

export { registerController, getMe, RefreshToken, logOut, logoutAll, loginController, verifyEmail };