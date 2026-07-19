import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import crypto from "crypto";



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
            maxAge: 7 * 24 *60 * 60 *1000
        })
        res.status(201).json({
            message: "User created successfully",
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
};

const loginController = async (req, res) => {
    try {

        const { username, email, password } = req.body;
        
        if (!username && !email)
        {
            return res.status(400).json({Message:"Username or email is required"})
        }
        
        if (!password)
        {
            return res.status(400).json({ Message: "password is required" })
        }

        const user = await userModel.findOne({
            $or: [{ username }, { email }]
        });
        
        if (!user)
        {
            return res.status(400).json({ message: "User Does not exists" });
        }

        const validUser = await bcrypt.compare(password, user.password);

        if (!validUser) {
            return res.status(400).json({
                message: "Incorrect password",
            });
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

export { registerController, getMe, RefreshToken , logOut ,logoutAll , loginController};