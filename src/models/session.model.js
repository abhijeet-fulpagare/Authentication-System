import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "User name is requied"],
        ref:"user"
    },
    refreshTokenHash: {
        type: String,
        required: [true, "refreshTokenHash is requied"]
    },
    ip: {
        type: String,
        required: [true, "ip is requied"]
    },
    userAgent: {
        type: String,
        required: [true, "user agent is requied"]
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps:true
})

const sessionModel = mongoose.model("sessions", sessionSchema);

export default sessionModel;