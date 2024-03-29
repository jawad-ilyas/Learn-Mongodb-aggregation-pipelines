import mongoose from "mongoose"
import { asyncHandler } from "../utilis/asyncHandler.utilis.js"
import { ApiError } from "../utilis/ApiError.js"
const connectDb = async () => {
    try {
        // Get MongoDB URI from environment variables
        const uri = process.env.MONGODB_URI;
        // console.log(typeof uri)
        // Check if URI is provided
        if (!uri) {
            throw new Error("MongoDB URI is not provided");
        }
        const connection = await mongoose.connect(uri );
        console.log("response from the db connection ")
    } catch (error) {
        console.log("Error into db connection ", error)
        throw new ApiError(500, "Error into connection with database server", error)
    }
}
export {
    connectDb
}