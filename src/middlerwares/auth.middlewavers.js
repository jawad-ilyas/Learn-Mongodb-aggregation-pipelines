import { User } from "../models/User.models.js";
import { ApiError } from "../utilis/ApiError.js";
import { asyncHandler } from "../utilis/asyncHandler.utilis.js";
import jwt from "jsonwebtoken"
const verifyJwt = asyncHandler(async (req, res, next) => {



    // * Step 1 Verify Access Token 
    // * Step 2 Decode The Jwt Token 
    // * Step 3 Verify User
    // ! Add The Next() important  


    try {

        console.log('Auth Middleware is exectued \n');
        const token = await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        // console.log("token " , token)
        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }

        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // console.log("decodeToken " , decodeToken)

        const user = await User.findById(decodeToken._id).select('-password -refreshToken')
        // console.log("user ", user)

        if (!user) {
            throw new ApiError(400, "Unauthorized Request")
        }

        req.user = user;
        // console.log("user into auth middlewares", req.user)
        next()


    } catch (error) {
        console.log("Error into verify Jwt", error)
        throw new ApiError(401, error?.message || "Invalid access token")

    }
})
export { verifyJwt }