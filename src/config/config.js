import "dotenv/config";

if (!process.env.MONGO_URI) {
    throw new Error("Mongo uri is not defined in envirnoment variable")

}

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined in environment variable")
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET:process.env.JWT_SECRET,
}

export default config;