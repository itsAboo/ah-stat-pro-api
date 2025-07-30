"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        trim: true,
        required: true,
    },
    password: {
        type: String,
        trim: true,
        required: true,
    },
    name: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: ["admin", "member"],
        default: "member",
    },
    posts: {
        type: [
            {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Post",
            },
        ],
        default: [],
    },
}, { timestamps: true });
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (this.isModified("password")) {
                const hashPw = yield bcrypt_1.default.hash(this.password, 12);
                this.password = hashPw;
            }
            next();
        }
        catch (error) {
            console.error("Error in pre-save", error);
            next(error);
        }
    });
});
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
