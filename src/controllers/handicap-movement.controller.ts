import { RequestHandler } from "express";
import HandicapMovement, { IMatch } from "../models/handicap-movement.model";
import Post from "../models/post.model";
import { isHandicap } from "../util/validate";
import mongoose from "mongoose";

interface IHandicapMovementPopulate extends Document {
  _id: mongoose.Types.ObjectId;
  matches: IMatch[];
  postId: mongoose.Types.ObjectId;
  type: "HDP" | "OU";
  ahSide: "HOME" | "AWAY";
  start: number;
  end: number;
  winCount: number;
  lostCount: number;
  drawCount: number;
  totalMatches: number;
  winRate?: number;
  drawRate?: number;
  lostRate?: number;
}

export const addHandicapMovement: RequestHandler = async (req, res) => {
  const { postId, start, end, type, ahSide } = req.body;
  const userId = req.userId;

  if (!postId || !start || !end) {
    res.status(400).json({ message: "Post id and handicap are required" });
    return;
  }

  if (!isHandicap(start) || !isHandicap(end)) {
    res.status(400).json({ message: "Start and end must be handicap value" });
    return;
  }

  try {
    const postDoc = await Post.findOne({
      _id: postId,
      userId,
    });

    if (!postDoc) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const isDuplicateHandicap = await HandicapMovement.find({
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

    const handicapMovementsDoc = await HandicapMovement.create({
      postId,
      type,
      ahSide,
      start,
      end,
    });

    postDoc.handicapMovements.push(handicapMovementsDoc._id);
    await postDoc.save();

    res.status(200).json({ message: "Add handicap successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const addMatch: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const { postId, matchDay, home, away, league, fullTimeScore, result } =
    req.body;
  const { handicapMovementId } = req.params;

  if (!postId || !handicapMovementId) {
    res
      .status(400)
      .json({ message: "Post id and handicap movement id are required" });
    return;
  }

  try {
    const postDoc = await Post.findOne({ _id: postId, userId });

    if (!postDoc) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const handicapMovementsDoc = await HandicapMovement.findOne({
      _id: handicapMovementId,
    });

    if (!handicapMovementsDoc) {
      res.status(404).json({ message: "Handicap movement not found" });
      return;
    }

    const matches = { home, away, matchDay, league, fullTimeScore, result };

    handicapMovementsDoc.matches.push(matches);
    await handicapMovementsDoc.save();

    res.status(200).json({ message: "Add match success" });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const editMatch: RequestHandler = async (req, res) => {
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
    const postDoc = await Post.findOne({ userId, _id: postId }).populate<{
      handicapMovements: IHandicapMovementPopulate[];
    }>("handicapMovements");

    if (!postDoc) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const handicapMovementsDoc = await HandicapMovement.findOne({
      _id: handicapMovementId,
      postId,
    });

    if (!handicapMovementsDoc) {
      res.status(404).json({ message: "Handicap movement not found" });
      return;
    }

    const matchToEdit = handicapMovementsDoc.matches.find(
      (m) => m._id?.toString() === matchId
    );

    if (!matchToEdit) {
      res.status(404).json({ message: "Match not found" });
      return;
    }

    matchToEdit.home = home ?? matchToEdit.home;
    matchToEdit.away = away ?? matchToEdit.away;
    matchToEdit.league = league ?? matchToEdit.league;
    matchToEdit.fullTimeScore = fullTimeScore ?? matchToEdit.fullTimeScore;
    matchToEdit.result = result ?? matchToEdit.result;

    await handicapMovementsDoc.save();

    res.status(200).json({ message: "Match updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const removeMatches: RequestHandler = async (req, res) => {
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
    const postDoc = await Post.findOne({ _id: postId, userId });

    if (!postDoc) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    const handicapMovementsDoc = await HandicapMovement.findOne({
      postId,
      _id: handicapMovementId,
    });

    if (!handicapMovementsDoc) {
      res.status(200).json({ message: "Handicap movement not found" });
      return;
    }

    const matches = [...handicapMovementsDoc.matches];

    const updatedMatches = matches.filter(
      (match) => !matchIds.includes(String(match._id))
    );

    handicapMovementsDoc.matches = updatedMatches;

    await handicapMovementsDoc.save();

    res.status(200).json({ message: "Matches deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const deleteHandicap: RequestHandler = async (req, res) => {
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
    const postDoc = await Post.findOne({ _id: postId, userId });

    if (!postDoc) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (
      !postDoc.handicapMovements
        .map((id) => id.toString())
        .includes(handicapMovementId)
    ) {
      res
        .status(404)
        .json({ message: "Handicap movement doesn't exist in this post" });
      return;
    }

    const deletedHandicapMovementDoc = await HandicapMovement.findByIdAndDelete(
      handicapMovementId
    );

    if (!deletedHandicapMovementDoc) {
      res.status(404).json({ message: "Handicap movement not found" });
      return;
    }

    const newHandicapMovement = postDoc.handicapMovements.filter(
      (h) => h.toString() !== handicapMovementId
    );

    postDoc.handicapMovements = newHandicapMovement;
    await postDoc.save();

    res.status(200).json({ message: "Handicap movement deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
