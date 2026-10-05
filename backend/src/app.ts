import express, { Application } from "express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { auth } from "./lib/auth";
import config from "./config";

const app: Application = express();

app.use(express.json());
app.use(cors({
    origin: [config.frontend_url],
    credentials: true
}))


//* routes
app.get("/", (req, res) => {
    res.send("Welcome to the RedAid API!");
});

app.all("/api/auth/{*any}", toNodeHandler(auth));


export default app;