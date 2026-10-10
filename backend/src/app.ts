import express, { Application } from "express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { auth } from "./lib/auth";
import config from "./config";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import { locationRouter } from "./module/location/location.route";

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
app.use("/api/location", locationRouter);

//* error handler
app.use(notFound);
app.use(globalErrorHandler);

export default app;