import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()


app.use(cors({
    origin: process.env.ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))


app.use(cookieParser())

// routes setup 

import UserRouter from "./routers/User.routes.js";

app.use("/api/v1/users", UserRouter)
export { app }