import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true,"Username is required"],
        unique:[true,"Username must be unique"]
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: [true, "email must be unique"]
    },
    password: {
        type: String,
        required: [true, "password is required"],
    },
    verified: {
        type: Boolean,
        default:false
    }
})

const userModel = mongoose.model("user", UserSchema)

export default userModel;