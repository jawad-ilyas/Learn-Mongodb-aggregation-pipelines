import { app } from "./app.js";
import { connectDb } from "./db/index.db.js";


import dotenv from "dotenv"


dotenv.config({
    path: "./.env"
})
connectDb().then(() => {
    app.on("Error", (Error) => {
        console.log("Error", Error)
        throw new Error
    })
    app.listen(process.env.PORT, () => {
        console.log("app is listen on the port", process.env.PORT)
    })
}).catch((err) => {
    console.log("Error into server connection ", err)
    // throw new ApiError(500, "Server Internal error")
})