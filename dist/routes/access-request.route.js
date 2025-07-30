"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../util/auth");
const access_request_controller_1 = require("../controllers/access-request.controller");
const router = express_1.default.Router();
router.post("/", auth_1.verifyToken, access_request_controller_1.createAccessRequest);
router.get("/", auth_1.verifyToken, access_request_controller_1.getAccessesRequest);
router.patch("/:id/reject", auth_1.verifyToken, access_request_controller_1.rejectAccessRequest);
exports.default = router;
