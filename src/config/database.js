import mongoose from "mongoose";
import config from "./config.js"

const ConnectDB = async () => {
    await mongoose.connect(`${config.MONGO_URI}/authentication`)
    console.log("Connected to DB")
}

export default ConnectDB;