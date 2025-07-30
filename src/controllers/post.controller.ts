import { RequestHandler } from "express";
import Post from "../models/post.model";
import { isHandicap } from "../util/validate";
import { parseDateString, transformPost } from "../util/transform";
import HandicapMovement, {
  IHandicapMovement,
} from "../models/handicap-movement.model";
import User, { IUser } from "../models/user.model";
import mongoose from "mongoose";
import PostAccess from "../models/post-access.model";

export interface IPostPopulated extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  userId: IUser;
  title: string;
  description?: string;
  handicapMovements: IHandicapMovement[];
  access: "public" | "private";
  updatedAt: Date;
}

export const getPosts: RequestHandler = async (req, res) => {
  const query = req.query;
  const maxPerPage = Number(query.maxPerPage) || 10;
  const page = Number(query.page) || 1;

  if (isNaN(maxPerPage) || maxPerPage <= 0) {
    res.status(400).json({ message: "maxPerPage must be a positive number" });
    return;
  }

  if (isNaN(page) || page <= 0) {
    res.status(400).json({ message: "page must be a positive number" });
    return;
  }

  const skip = (page - 1) * maxPerPage;

  try {
    const postsDoc = await Post.find()
      .skip(skip)
      .limit(maxPerPage)
      .sort({ updatedAt: -1 })
      .populate("userId")
      .populate<IPostPopulated>("handicapMovements");

    const totalPosts = await Post.countDocuments();

    const pageCount = Math.ceil(totalPosts / maxPerPage);

    const posts = postsDoc.map((post) => {
      return transformPost(post.toObject({ virtuals: true }));
    });

    res.status(200).json({
      posts: {
        posts,
        pageCount,
      },
      message: "Successfully fetch posts",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const getPost: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    res.status(403).json({ message: "User id is required" });
    return;
  }

  try {
    const postDoc = await Post.findOne<IPostPopulated>({
      _id: id,
    })
      .populate("userId")
      .populate("handicapMovements");

    if (!postDoc) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (postDoc.access === "private") {
      if (String(postDoc.userId._id) !== userId) {
        const accessiblePostDoc = await PostAccess.findOne({
          userId,
          postId: id,
        });
        if (!accessiblePostDoc) {
          res.status(403).json({ message: "Unauthorized to access post" });
          return;
        }
      }
    }

    const post = transformPost(
      (postDoc as mongoose.Document & IPostPopulated).toObject({
        virtuals: true,
      })
    );

    post.handicapMovements = post.handicapMovements.map((h) => {
      return {
        ...h,
        matches: h.matches
          .map((m, index) => ({ ...m, originalIndex: index }))
          .sort((a, b) => {
            const timeA = new Date(a.matchDay!).getTime();
            const timeB = new Date(b.matchDay!).getTime();
            if (timeA === timeB) {
              return b.originalIndex - a.originalIndex;
            }
            return timeB - timeA;
          })
          .map(({ originalIndex, ...rest }) => rest),
      };
    });

    res.status(200).json({
      message: "Successfully get post",
      post,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const getMyPosts: RequestHandler = async (req, res) => {
  const userId = req.userId;

  const query = req.query;
  const maxPerPage = Number(query.maxPerPage) || 10;
  const page = Number(query.page) || 1;

  if (isNaN(maxPerPage) || maxPerPage <= 0) {
    res.status(400).json({ message: "maxPerPage must be a positive number" });
    return;
  }

  if (isNaN(page) || page <= 0) {
    res.status(400).json({ message: "page must be a positive number" });
    return;
  }

  const skip = (page - 1) * maxPerPage;

  try {
    const userDoc = await User.findById(userId);

    if (!userDoc) {
      res.status(400).json({ message: "User not found" });
      return;
    }

    const postsDoc = await Post.find({ userId })
      .populate<IPostPopulated>("handicapMovements")
      .populate("userId")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(maxPerPage);

    const totalPosts = await Post.countDocuments({ userId });

    const pageCount = Math.ceil(totalPosts / maxPerPage);

    let posts = postsDoc.map((post) =>
      transformPost((post as mongoose.Document & IPostPopulated).toObject())
    );

    res.status(200).json({
      message: "Successfully fetch post",
      posts: {
        posts,
        pageCount,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const createPost: RequestHandler = async (req, res) => {
  const { title, description, handicapMovements, access } = req.body;
  const userId = req.userId;

  if (!title) {
    res.status(400).json({ message: "title is required" });
    return;
  }

  if (handicapMovements.length > 0) {
    const hasInvalid = handicapMovements.some(
      (handicap: {
        start: string;
        end: string;
        matches: { matchDay: string }[];
      }) => {
        if (
          !handicap.start ||
          !handicap.end ||
          !isHandicap(handicap.start) ||
          !isHandicap(handicap.end)
        ) {
          return true;
        }

        if (!handicap.matches || handicap.matches.length === 0) {
          return false;
        }

        return handicap.matches.some(
          (match) => !parseDateString(match.matchDay)
        );
      }
    );

    if (hasInvalid) {
      res.status(400).json({ message: "Some value is invalid" });
      return;
    }
  }

  try {
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const createdPostDoc = await Post.create({
      userId,
      title,
      description,
      handicapMovements: [],
      access,
    });

    await User.findByIdAndUpdate(userId, {
      $push: { posts: createdPostDoc._id },
    });

    if (handicapMovements && handicapMovements.length > 0) {
      const handicapMovementsToCreate = handicapMovements.map(
        (h: { matches?: { matchDay: string }[] }) => {
          return {
            ...h,
            postId: createdPostDoc._id,
            matches: Array.isArray(h.matches)
              ? h.matches.map((m) => ({
                  ...m,
                  matchDay: parseDateString(m.matchDay),
                }))
              : [],
          };
        }
      );

      const createdHandicapMovements = await HandicapMovement.create(
        handicapMovementsToCreate
      );

      const createdHMArray = Array.isArray(createdHandicapMovements)
        ? createdHandicapMovements
        : [createdHandicapMovements];

      createdPostDoc.handicapMovements = createdHMArray.map((doc) => doc._id);

      await createdPostDoc.save();
    }

    res
      .status(200)
      .json({ post: createdPostDoc, message: "Create post success" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const deletePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Post id is required" });
    return;
  }

  try {
    const postDoc = await Post.findOne({ _id: id, userId });
    if (!postDoc) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    await Post.findByIdAndDelete(id);
    await HandicapMovement.deleteMany({
      _id: { $in: postDoc.handicapMovements },
    });
    await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { posts: postDoc._id } }
    );

    res.status(200).json({ message: "Delete post successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const editPost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const { postId, title, description, access } = req.body;
  console.log(access);
  if (title && title.length < 6) {
    res.status(400).json({ message: "Title must be at least 6 characters" });
    return;
  }

  if (access && access !== "public" && access !== "private") {
    res.status(400).json({ message: "Access must be public or private" });
    return;
  }

  if (!postId) {
    res.status(400).json({ message: "Post id is required" });
    return;
  }

  try {
    const postDoc = await Post.findOne({ _id: postId, userId });

    if (!postDoc) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    await Post.findByIdAndUpdate(postId, { title, description, access });

    res.status(200).json({ message: "Updated post successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const editPostAccess: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const { access } = req.body;
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Post id is required" });
    return;
  }

  if (!access) {
    res
      .status(400)
      .json({ message: "Access and requesterId value are required" });
    return;
  }

  if (access !== "public" && access !== "private") {
    res.status(400).json({ message: "Access has invalid value" });
    return;
  }

  try {
    const postDoc = await Post.findOne({ _id: id, userId });

    if (!postDoc) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    postDoc.access = access;
    await postDoc.save();

    res.status(200).json({ message: "Updated access post successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
