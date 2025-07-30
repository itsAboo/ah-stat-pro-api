import { RequestHandler } from "express";
import AccessRequest from "../models/access-request.model";
import { sendNotification } from "../util/socket";
import Post from "../models/post.model";
import User from "../models/user.model";
import Notification from "../models/notification.model";

export const getAccessesRequest: RequestHandler = async (req, res) => {
  const userId = req.userId;

  try {
    const accessRequestDoc = await AccessRequest.find({
      $or: [{ requesterId: userId }, { receiverId: userId }],
    });

    if (!accessRequestDoc) {
      res.status(404).json({ message: "Access request not found" });
      return;
    }

    const transformedAccessRequest = accessRequestDoc.map((a) => ({
      id: a._id,
      ...a.toObject(),
    }));

    res.status(200).json({
      message: "Successfully fetch access request",
      accessRequest: transformedAccessRequest,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

//send request
export const createAccessRequest: RequestHandler = async (req, res) => {
  const userId = req.userId;

  const { postId } = req.body;

  if (!postId) {
    res.status(400).json({ message: "Post id is required" });
    return;
  }

  try {
    const postDoc = await Post.findById(postId);

    if (!postDoc) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    if (String(postDoc.userId) === userId) {
      res
        .status(400)
        .json({ message: "You cannot request access to your own post" });
      return;
    }

    const existingRequest = await AccessRequest.findOne({
      postId,
      requesterId: userId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        res
          .status(400)
          .json({ message: "You already have a pending access request" });
        return;
      }
      if (existingRequest.status === "approved") {
        res.status(400).json({ message: "Access has already been granted" });
        return;
      }
    }

    const requesterDoc = await User.findById(userId);

    if (!requesterDoc) {
      res.status(404).json({ message: "User is invalid" });
      return;
    }

    const ownerPostDoc = await User.findById(postDoc.userId);

    if (!ownerPostDoc) {
      res.status(404).json({ message: "Owner post account not found" });
      return;
    }

    const recipientId = String(postDoc.userId);

    const accessRequestDoc = await AccessRequest.create({
      postId,
      requesterId: userId,
      receiverId: postDoc.userId,
    });

    const notificationCreatedDoc = await Notification.create({
      senderId: requesterDoc._id,
      recipientId: ownerPostDoc._id,
      isRead: false,
      type: "access_request",
      message: `${
        requesterDoc.name || requesterDoc.username
      } has requested access to your post`,
      accessRequestId: accessRequestDoc._id,
      post: {
        id: postDoc._id,
        title: postDoc.title,
      },
    });

    const notificationData = {
      id: notificationCreatedDoc._id,
      sender: requesterDoc.name || requesterDoc.username,
      createdAt: new Date(),
      source: {
        post: {
          id: postDoc._id,
          title: postDoc.title,
        },
      },
      message: notificationCreatedDoc.message,
      type: "access_request",
      accessRequestId: accessRequestDoc._id,
      accessRequest: {
        id: accessRequestDoc._id,
        ...accessRequestDoc.toObject(),
      },
    };

    sendNotification(recipientId, notificationData);

    res.status(200).json({
      message: "Successfully created access request",
      accessRequest: accessRequestDoc,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const rejectAccessRequest: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Access request id is required" });
    return;
  }

  try {
    const accessRequestDoc = await AccessRequest.findOne({
      _id: id,
      receiverId: userId,
    });

    if (!accessRequestDoc) {
      res.status(404).json({ message: "Access request not found" });
      return;
    }

    if (accessRequestDoc.status !== "pending") {
      res.status(400).json({ message: "Access request already handled" });
      return;
    }

    accessRequestDoc.status = "rejected";
    await accessRequestDoc.save();

    res.status(200).json({ message: "Access request has been rejected" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
