import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
dotenv.config();
import { connectDB } from "./util/connect";
import { initSocket } from "./util/socket";
import userRoute from "./routes/user.route";
import handicapMovementRoute from "./routes/handicap-movement.route";
import postRoute from "./routes/post.route";
import notificationRoute from "./routes/notification.route";
import accessRequestRoute from "./routes/access-request.route";
import postAccessRoute from "./routes/post-access.route";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

const PORT = process.env.PORT;
const isProduction = process.env.NODE_ENV === "production";

const app = express();

app.use(morgan("dev"));
app.use(
  cors({
    origin: isProduction ? process.env.ORIGIN : "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello world");
});
app.use("/api/user", userRoute);
app.use("/api/handicap", handicapMovementRoute);
app.use("/api/post", postRoute);
app.use("/api/notification", notificationRoute);
app.use("/api/access-request", accessRequestRoute);
app.use("/api/post-access", postAccessRoute);

connectDB(() => {
  const server = http.createServer(app);

  initSocket(server);

  server.listen(PORT, () => {
    console.log(`start server on port ${PORT}`);
  });
});
