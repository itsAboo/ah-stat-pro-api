"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../util/auth");
const post_access_controller_1 = require("../controllers/post-access.controller");
const router = express_1.default.Router();
router.get("/", auth_1.verifyToken, post_access_controller_1.getPostAccesses);
router.post("/delete-many", auth_1.verifyToken, post_access_controller_1.deletePostAccess);
router.get("/accepted/:postId", auth_1.verifyToken, post_access_controller_1.getPostAccessAccepted);
router.post("/", auth_1.verifyToken, post_access_controller_1.createPostAccess);
exports.default = router;
