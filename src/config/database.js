import mongoose from "mongoose";


if (!process.env.MONGO_URI) {
    throw new Error("Mongo uri is not defined in envirnoment variable")
    
}


const ConnectDB = async () => {
    await mongoose.connect(`${process.env.MONGO_URI}/authentication`)
    console.log("Connected to DB")
}

export default ConnectDB;