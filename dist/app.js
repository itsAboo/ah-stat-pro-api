"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const connect_1 = require("./util/connect");
const socket_1 = require("./util/socket");
const user_route_1 = __importDefault(require("./routes/user.route"));
const handicap_movement_route_1 = __importDefault(require("./routes/handicap-movement.route"));
const post_route_1 = __importDefault(require("./routes/post.route"));
const notification_route_1 = __importDefault(require("./routes/notification.route"));
const access_request_route_1 = __importDefault(require("./routes/access-request.route"));
const post_access_route_1 = __importDefault(require("./routes/post-access.route"));
const PORT = process.env.PORT;
const isProduction = process.env.NODE_ENV === "production";
const app = (0, express_1.default)();
app.use((0, morgan_1.default)("dev"));
app.use((0, cors_1.default)({
    origin: isProduction ? process.env.ORIGIN : "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api/user", user_route_1.default);
app.use("/api/handicap", handicap_movement_route_1.default);
app.use("/api/post", post_route_1.default);
app.use("/api/notification", notification_route_1.default);
app.use("/api/access-request", access_request_route_1.default);
app.use("/api/post-access", post_access_route_1.default);
(0, connect_1.connectDB)(() => {
    const server = http_1.default.createServer(app);
    (0, socket_1.initSocket)(server);
    server.listen(PORT, () => {
        console.log(`start server on port ${PORT}`);
    });
});
