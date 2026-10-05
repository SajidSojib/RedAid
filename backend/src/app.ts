import express, { Application } from "express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { auth } from "./lib/auth";

const app: Application = express();

app.use(express.json());
app.use(cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true
}))


//* routes
app.get("/", (req, res) => {
    res.send("Welcome to the RedAid API!");
});

app.all("/api/auth/{*any}", toNodeHandler(auth));


export default app;