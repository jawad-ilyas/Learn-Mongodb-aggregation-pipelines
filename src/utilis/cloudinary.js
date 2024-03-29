import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv"
dotenv.config({
    path: "./.env"
})



cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});



const uploadCloudinary = async (localFilePath) => {

    try {

        console.log(localFilePath);
        if (!localFilePath) return null
        const cloudinaryResponse = await cloudinary.uploader.upload(localFilePath,
            { resource_type: "auto" })

        fs.unlinkSync(localFilePath)
        return cloudinaryResponse

    } catch (error) {

        fs.unlinkSync(localFilePath)
        console.log("error into cloudinary upload system ", error)
        return null
    }
}

export { uploadCloudinary }