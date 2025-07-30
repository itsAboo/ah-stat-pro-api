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
exports.deleteHandicap = exports.removeMatches = exports.editMatch = exports.addMatch = exports.addHandicapMovement = void 0;
const handicap_movement_model_1 = __importDefault(require("../models/handicap-movement.model"));
const post_model_1 = __importDefault(require("../models/post.model"));
const validate_1 = require("../util/validate");
const addHandicapMovement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId, start, end, type, ahSide } = req.body;
    const userId = req.userId;
    if (!postId || !start || !end) {
        res.status(400).json({ message: "Post id and handicap are required" });
        return;
    }
    if (!(0, validate_1.isHandicap)(start) || !(0, validate_1.isHandicap)(end)) {
        res.status(400).json({ message: "Start and end must be handicap value" });
        return;
    }
    try {
        const postDoc = yield post_model_1.default.findOne({
            _id: postId,
            userId,
        });
        if (!postDoc) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const isDuplicateHandicap = yield handicap_movement_model_1.default.find({
            postId,
            start,
            end,
            ahSide,
            type,
        });
        if (isDuplicateHandicap.length > 0) {
            res.status(400).json({
                message: "A handicap with the same start and end already exists.",
            });
            return;
        }
        const handicapMovementsDoc = yield handicap_movement_model_1.default.create({
            postId,
            type,
            ahSide,
            start,
            end,
        });
        postDoc.handicapMovements.push(handicapMovementsDoc._id);
        yield postDoc.save();
        res.status(200).json({ message: "Add handicap successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.addHandicapMovement = addHandicapMovement;
const addMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { postId, matchDay, home, away, league, fullTimeScore, result } = req.body;
    const { handicapMovementId } = req.params;
    if (!postId || !handicapMovementId) {
        res
            .status(400)
            .json({ message: "Post id and handicap movement id are required" });
        return;
    }
    try {
        const postDoc = yield post_model_1.default.findOne({ _id: postId, userId });
        if (!postDoc) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const handicapMovementsDoc = yield handicap_movement_model_1.default.findOne({
            _id: handicapMovementId,
        });
        if (!handicapMovementsDoc) {
            res.status(404).json({ message: "Handicap movement not found" });
            return;
        }
        const matches = { home, away, matchDay, league, fullTimeScore, result };
        handicapMovementsDoc.matches.push(matches);
        yield handicapMovementsDoc.save();
        res.status(200).json({ message: "Add match success" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.addMatch = addMatch;
const editMatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { postId, home, away, league, fullTimeScore, result } = req.body;
    const userId = req.userId;
    const { handicapMovementId, matchId } = req.params;
    if (!postId || !handicapMovementId || !matchId) {
        res.status(400).json({
            message: "Post id , handicap movement id and match id are required",
        });
        return;
    }
    try {
        const postDoc = yield post_model_1.default.findOne({ userId, _id: postId }).populate("handicapMovements");
        if (!postDoc) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const handicapMovementsDoc = yield handicap_movement_model_1.default.findOne({
            _id: handicapMovementId,
            postId,
        });
        if (!handicapMovementsDoc) {
            res.status(404).json({ message: "Handicap movement not found" });
            return;
        }
        const matchToEdit = handicapMovementsDoc.matches.find((m) => { var _a; return ((_a = m._id) === null || _a === void 0 ? void 0 : _a.toString()) === matchId; });
        if (!matchToEdit) {
            res.status(404).json({ message: "Match not found" });
            return;
        }
        matchToEdit.home = home !== null && home !== void 0 ? home : matchToEdit.home;
        matchToEdit.away = away !== null && away !== void 0 ? away : matchToEdit.away;
        matchToEdit.league = league !== null && league !== void 0 ? league : matchToEdit.league;
        matchToEdit.fullTimeScore = fullTimeScore !== null && fullTimeScore !== void 0 ? fullTimeScore : matchToEdit.fullTimeScore;
        matchToEdit.result = result !== null && result !== void 0 ? result : matchToEdit.result;
        yield handicapMovementsDoc.save();
        res.status(200).json({ message: "Match updated successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.editMatch = editMatch;
const removeMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { postId, matchIds } = req.body;
    const { handicapMovementId } = req.params;
    if (!postId || !handicapMovementId) {
        res
            .status(400)
            .json({ message: "Post id and handicap movement id are required" });
        return;
    }
    if (!matchIds || matchIds.length < 1) {
        res.status(400).json({ message: "Match id is required" });
        return;
    }
    try {
        const postDoc = yield post_model_1.default.findOne({ _id: postId, userId });
        if (!postDoc) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        const handicapMovementsDoc = yield handicap_movement_model_1.default.findOne({
            postId,
            _id: handicapMovementId,
        });
        if (!handicapMovementsDoc) {
            res.status(200).json({ message: "Handicap movement not found" });
            return;
        }
        const matches = [...handicapMovementsDoc.matches];
        const updatedMatches = matches.filter((match) => !matchIds.includes(String(match._id)));
        handicapMovementsDoc.matches = updatedMatches;
        yield handicapMovementsDoc.save();
        res.status(200).json({ message: "Matches deleted successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.removeMatches = removeMatches;
const deleteHandicap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const { postId } = req.body;
    const { handicapMovementId } = req.params;
    if (!postId || !handicapMovementId) {
        res
            .status(400)
            .json({ message: "Post id and handicap movement id are required" });
        return;
    }
    try {
        const postDoc = yield post_model_1.default.findOne({ _id: postId, userId });
        if (!postDoc) {
            res.status(404).json({ message: "Post not found" });
            return;
        }
        if (!postDoc.handicapMovements
            .map((id) => id.toString())
            .includes(handicapMovementId)) {
            res
                .status(404)
                .json({ message: "Handicap movement doesn't exist in this post" });
            return;
        }
        const deletedHandicapMovementDoc = yield handicap_movement_model_1.default.findByIdAndDelete(handicapMovementId);
        if (!deletedHandicapMovementDoc) {
            res.status(404).json({ message: "Handicap movement not found" });
            return;
        }
        const newHandicapMovement = postDoc.handicapMovements.filter((h) => h.toString() !== handicapMovementId);
        postDoc.handicapMovements = newHandicapMovement;
        yield postDoc.save();
        res.status(200).json({ message: "Handicap movement deleted successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error instanceof Error ? error.message : "Something went wrong",
        });
    }
});
exports.deleteHandicap = deleteHandicap;
