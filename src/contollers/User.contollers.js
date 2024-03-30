import { User } from "../models/User.models.js";
import { ApiError } from "../utilis/ApiError.js"

import { asyncHandler } from "../utilis/asyncHandler.utilis.js"
import { uploadCloudinary } from "../utilis/cloudinary.js";
import { ApiResponse } from "../utilis/ApResponse.js";
import jwt from "jsonwebtoken"
import { upload } from "../middlerwares/multer.middlerwares.js";
// ! Create Tokens Generater
const accessAndRefreshTokenGenerater = async (userId) => {
    try {
        const user = await User.findById(userId);
        // console.log(user)

        const accessToken = await user.generatedAccessToken();
        const refreshToken = await user.generateRefreshToken();
        // console.log("accessToken function ", accessToken)
        // console.log("refreshToken function ", refreshToken)
        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        console.log("error into access and refresh token generater", error)
    }

}

// ! Code for Email Verification 
function isValidEmail(email) {
    // Regular expression for validating email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ! Code For Fields Verification 
const isValidate = (fields) => {
    const errors = {};

    for (const field in fields) {
        switch (field) {
            case "password":
                if (!fields.password || fields.password.length < 8) {
                    errors.password = "Password must be at least 8 characters long";
                }
                break;
            case "oldPassword":
                if (!fields.oldPassword || fields.oldPassword.length < 8) {
                    errors.oldPassword = "Password must be at least 8 characters long";
                }
                break;
            case "newPassword":
                if (!fields.newPassword || fields.newPassword.length < 8) {
                    errors.newPassword = "Password must be at least 8 characters long";
                }
                break;
            case "email":
                if (!fields.email || !isValidEmail(fields.email)) {
                    errors.email = "Invalid email format";
                }
                break;
            case "userName":
                if (!fields.userName) {
                    errors.userName = "UserName is required";
                }
                break;
            case "fullName":
                if (!fields.fullName) {
                    errors.fullName = "FullName is required";
                }
                break;
            // Add cases for other fields...
        }
    }

    return errors;
};

// ! Register User Controller 
const registerUser = asyncHandler(async (req, res, _) => {
    // * Step 1: Get data from the user
    const { email, userName, fullName, password } = req.body;

    // * Step 2: Validate the data from the user 
    const isValidateError = isValidate(req.body);
    // console.log(isValidateError)
    if (Object.keys(isValidateError).length > 0) {
        throw new ApiError(400, "User Validation is Failed On Register Time", isValidateError);
    }

    // *  Step 3: Check if the user is already present
    const userExists = await User.findOne({
        $or: [{ email }, { userName }]
    });
    if (userExists) {
        throw new ApiError(409, "User is already Exists");
    }

    // * Step 4:  Check image upload by the user and validate the image process

    const avatorLocalPath = req.files?.avatar[0]?.path;
    const avatar = await uploadCloudinary(avatorLocalPath);
    if (!avatar) {
        throw new ApiError(401, "Avatar Field is Required");
    }

    let coverImage;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        const coverImageLocalPath = req.files.coverImage[0].path;
        coverImage = await uploadCloudinary(coverImageLocalPath);
    }

    // * Step 5: Create the user
    const createUser = await User.create({
        userName: userName.toLowerCase(),
        email,
        password,
        avatar: avatar?.url,
        coverImage: coverImage?.url || "",
        fullName
    });

    // * Step 6: Verify the user
    const verifyUser = await User.findById(createUser._id).select("-password -refreshToken");
    if (!verifyUser) {
        throw new ApiError(500, "Something went wrong when registering the user");
    }

    // * Step 7: Return the user
    return res.status(201).json(new ApiResponse(200, "User is created Successfully", verifyUser));
});

// ! Login User Contoller 
const loginUser = asyncHandler(async (req, res, next) => {


    // * Step 1 : get Data from the User 
    // * Step 2 : verify the Fields 
    // * Step 3 : Verify User is Exists or Not 
    // * Step 4 : Match The User Password 
    // * Step 5 : Create Tokens 
    // * Step 6 : Create Cookie 



    // ? Step 1 : Get Data From The User 
    const { email, userName, password } = req.body
    // console.log("email", email)
    // console.log("password", password)
    // console.log("userName", userName)



    // ? Step 2 perform Validation 
    const validationFields = isValidate(req.body);
    // console.log("validationFields",validationFields)

    if (Object.keys(validationFields).length !== 0) {
        throw new ApiError(400, "All Fields Are required", validationFields);
    }


    // ? Step 3 Verify User Exists or Not 

    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })
    // console.log("user._id",user._id)

    if (!user) {
        throw new ApiError(400, "User is Not Already Exists")
    }

    // ? Step 4 Verify User Password 
    const verifyPasword = await user.isPasswordCorrect(password)
    // console.log(verifyPasword)
    if (!verifyPasword) {
        throw new ApiError(401, "Password is incorrect ")
    }



    // ? Step 5  Create Tokens 

    const { accessToken, refreshToken } = await accessAndRefreshTokenGenerater(user._id)
    // console.log(typeof accessToken)
    // console.log(typeof refreshToken)
    // console.log("accessToken", accessToken)
    // console.log("refreshToken", refreshToken)



    // ? step 6 cookie 

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    // console.log(loggedInUser)


    // design the cookie that we want to send

    const options = {
        httpOnly: true,
        secure: true

    }
    res.cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)

    res.status(200).json(
        new ApiResponse(200, "User is logginned ", loggedInUser)
    )



})

// ! LogOut User Contoller
const logout = asyncHandler(async (req, res) => {
    // * remove cookies 
    // * remove the refresh token 
    // * return response

    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: 1
        }
    },
        {
            new: true
        })

    const options = {
        httpOnly: true,
        secure: true
    }
    res.clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)

    res.status(200).json(
        new ApiResponse(200, " User Is Logout Successfully")
    )
})

// ! Refresh Token 
const refreshAccessToken = asyncHandler(async (req, res) => {

    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    console.log(incommingRefreshToken)
    if (!incommingRefreshToken) {
        throw new ApiError(401, "Refresh Token is InValid")
    }

    try {
        const decodeToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodeToken?._id)
        // console.log("User ",user)
        // console.log("decoedeToken : ", decodeToken)
        if (!user) {
            throw new ApiError(401, "unauthorized Token")
        }
        // console.log("user?.refreshToken", user?.refreshToken);
        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }

        const { accessToken, refreshToken } = await accessAndRefreshTokenGenerater(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        res.cookie("refreshToken", refreshToken, options)
        res.cookie("accessToken", accessToken, options)
        res.status(200).json(
            new ApiResponse(200, "Again Tokens Generated", {
                accessToken, refreshToken
            })
        )
    } catch (error) {
        console.log("error into refresh token ", error)
    }
})

// ! Change Password Controller
const changeCurrentPassword = asyncHandler(async (req, res) => {

    // * Step 1 : get data from the user 
    // * Step 2 : Validate the Data 
    // * Step 3 : Check User exists or not 
    // * Step 3 : match the password 
    // * Step 4 : update the password 


    // ? Step 1 : get data from the user 
    const { email, newPassword, userName, oldPassword } = req.body
    // console.log("email : ", email);
    // console.log("oldPassword : ", oldPassword);
    // console.log("userName : ", userName);
    // console.log("req.body", req.body)


    // ? Step 2 : Validate the Data 
    const validateFields = isValidate(req.body)
    // console.log("validateFields", validateFields)
    if (Object.keys(validateFields).length > 0) {
        throw new ApiError(400, "All Fields Are required", validateFields)
    }

    // ? Step 3 : Check User Exists or not 

    const user = await User.findOne(
        { $or: [{ email }, { userName }] }
    )
    // console.log("User into Password Reset : ", user)

    if (!user) {
        throw new ApiError(400, "Unathurized User Request")
    }


    // ? Step 4: Check Password Match or Not
    const validatePassword = await user.isPasswordCorrect(oldPassword);
    console.log("validatePassword into reset Password : ", validatePassword)


    if (!validatePassword) {
        throw new ApiError(400, "Unathurized User Request For password")
    }
    // console.log("User into Password Reset : ", user.password)

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })
    // console.log(user.password)

    return res
        .status(200)
        .json(new ApiResponse(200, "Password is Changed"))

})

// ! Get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
    // console.log("Get Current User Email:", req.user?.email); // Check email property
    // console.log("Get Current User UserName:", req.user?.userName); // Check userName property
    // console.log("Get Current User", req.user); // Log the entire user object for debugging
    const { email, userName } = req.user;
    // console.log("Email:", email);
    // console.log("Username:", userName);

    return res
        .status(200)
        .json(

            new ApiResponse(200, "Current User Fetched Successfully ", JSON.stringify(await req.user))

        );
});

// ! update Account Details 
const updateAccountDetails = asyncHandler(async (req, res) => {

    // * First Get Data From the user
    // * Validate The Data From the user
    // * Update the data into database


    // ? Step 1 get data from the user
    const { fullName, email, userName } = req.body;

    // ? Validate the fields 
    const validateFields = isValidate(req.body)

    if (Object.keys(validateFields).length > 0) {
        throw new ApiError(400, "All Feilds are required", validateFields)
    }

    // ? Step 3 Update The User 
    // console.log(JSON.stringify(await req.user._id))
    // console.log(await req.user)



    const updateUser = await User.findByIdAndUpdate(await req.user._id, {
        $set: {
            fullName,
            userName
        }
    }, {
        new: true
    }).select("-password ")
    console.log("updateUser : ", updateUser)
    if (!updateUser) {
        throw new ApiError(500, "User is Not Updated Successfullly")
    }

    res
        .status(200)
        .json(
            new ApiResponse(200, "User is Updated Succefully", updateUser)
        )
})


// ! Update Avator Image For user
const updateUserAvator = asyncHandler(async (req, res) => {

    // ? get the local path of the avator files
    // ! we use req.file there because we dont want to upload multiple files we upload single file so soo ------> req.file
    const avatorLocalPath = req.file?.path;
    // console.log("avatorLocalPath Update User Avatar Controller : ", avatorLocalPath)


    if (!avatorLocalPath) {
        throw new ApiError(400, "Avator is not Updated Succesfully")
    }


    // TODO : delete old iamge - assignment
    
    // ? Step 2  - Upload this on to cloudinary 
    const avatar = await uploadCloudinary(avatorLocalPath);

    if (!avatar?.url) {
        throw new Error(400, "Error While Uploading On Avator")
    }


    const updateAvatarFile = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                avatar: avatar?.url
            }
        },
        {
            new: true
        }).select("-password")

    // console.log("updateAvatarFile after updation User object : ", updateAvatarFile)

    // console.log("avatar FIles Cloudinary link : ", avatar)
    res
        .status(200)
        .json(new ApiResponse(200, "Cover Image Updated Succefully ", updateAvatarFile))
})


// ! Update Cover Image For User
const updateUserCoverImage = asyncHandler(async (req, res) => {

    // ? get the local path of the avator files
    // ! we use req.file there because we dont want to upload multiple files we upload single file so soo ------> req.file
    const coverImageLocalPath = req.file?.path;
    // console.log("coverImageLocalPath Update User Avatar Controller : ", coverImageLocalPath)


    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage is not Updated Succesfully")
    }

    // ? Step 2  - Upload this on to cloudinary 
    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if (!coverImage?.url) {
        throw new Error(400, "Error While Uploading On coverImage")
    }


    const updatecoverImageFile = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                coverImage: coverImage?.url
            }
        },
        {
            new: true
        }).select("-password")

    // console.log("updatecoverImageFile after updation User object : ", updatecoverImageFile)

    // console.log("coverImage FIles Cloudinary link : ", coverImage)
    res
        .status(200)
        .json(new ApiResponse(200, "Cover Image Updated Succefully ", updatecoverImageFile))
})

export { registerUser, loginUser, logout, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvator, updateUserCoverImage };

