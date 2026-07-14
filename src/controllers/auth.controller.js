import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

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

        const token = jwt.sign(
            { id: user._id },
            config.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "User created successfully",
            user: {
                username: user.username,
                email: user.email,
            },
            token,
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

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

export { registerController , getMe };