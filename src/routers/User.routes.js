import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logout, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvator, updateUserCoverImage } from "../contollers/User.contollers.js"
import { upload } from "../middlerwares/multer.middlerwares.js"
import { verifyJwt } from "../middlerwares/auth.middlewavers.js";
const router = Router();



// ! Routes For the Register User
router.route("/register").post(upload.fields(
    [
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 3 }
    ]
), registerUser)


// ! Routes For the Login User
router.route("/login").post(loginUser)


// ! Routes For Changing Password For User
router.route("/changePassword").post(changeCurrentPassword)

// ! Routes For Current User For User
router.route("/currentUser").post(verifyJwt, getCurrentUser)


// ! Routes For Update The User Account Details
router.route("/updateAccountDetails").post(verifyJwt, updateAccountDetails)



// ! Routers for update Avator Image
router.route("/updateAvatar").post(upload.single('avatar'), verifyJwt, updateUserAvator)
router.route("/updateCoverImage").post(upload.single('coverImage'), verifyJwt, updateUserCoverImage)
// ! Routes For the Log out + Secured Route
router.route("/logout").post(verifyJwt, logout)
router.route("/refreshToken").post(refreshAccessToken)

export default router;