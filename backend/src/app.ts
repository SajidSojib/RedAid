import express, { Application } from "express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import { auth } from "./lib/auth";
import config from "./config";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import { locationRouter } from "./module/location/location.route";
import { authRouter } from "./module/auth/auth.route";
import { requestRouter } from "./module/request/request.route";
import { profileRouter } from "./module/profile/profile.route";
import { matchesRouter } from "./module/match/match.route";
import { notificationRouter } from "./module/notification/notification.route";
import { achievementRouter } from "./module/achievement/achivement.route";

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

app.use("/api/auth", authRouter);
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use("/api/location", locationRouter);
app.use("/api/profile", profileRouter);
app.use("/api/requests", requestRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/achievements", achievementRouter);

//* error handler
app.use(notFound);
app.use(globalErrorHandler);

export default app;