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
import { achievementRouter } from "./module/achievement/achievement.route";
import { donationRouter } from "./module/donation/donation.route";
import { leaderboardRouter } from "./module/leaderboard/leaderboard.route";
import { bankRouter } from "./module/bank/bank.route";
import { inventoryRouter } from "./module/inventory/inventory.route";
import { bankRequestRouter } from "./module/bank-request/bank-request.route";
import { overviewRouter } from "./module/overview/overview.route";
import { reportRouter } from "./module/report/report.route";
import { usersRouter } from "./module/user/user.route";

const app: Application = express();
const allowedOrigins = [
  "http://localhost:3000",
  config.frontend_url,
].filter(Boolean);

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin is in allowedOrigins or matches Vercel preview pattern
      const isAllowed = allowedOrigins.includes(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  }),
);


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
app.use("/api/donations", donationRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/banks", bankRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/bank-requests", bankRequestRouter);
app.use("/api/overview", overviewRouter);
app.use("/api/reports", reportRouter);
app.use("/api/users", usersRouter);

//* error handler
app.use(notFound);
app.use(globalErrorHandler);

export default app;