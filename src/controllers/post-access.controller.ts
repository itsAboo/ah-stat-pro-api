import { RequestHandler } from "express";
import Post from "../models/post.model";
import PostAccess from "../models/post-access.model";
import { sendNotification } from "../util/socket";
import AccessRequest from "../models/access-request.model";
import User from "../models/user.model";
import Notification from "../models/notification.model";

export const getPostAccesses: RequestHandler = async (req, res) => {
  const userId = req.userId;

  try {
    const postAccessesDoc = await PostAccess.find({ userId });
    res.status(200).json({
      message: "Successfully fetch post accesses",
      postAccesses: postAccessesDoc,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

// submit access
export const createPostAccess: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const { postId, requesterId, accessRequestId } = req.body;

  if (!postId) {
    res.status(400).json({ message: "Post id is required" });
    return;
  }

  if (!requesterId) {
    res.status(400).json({ message: "Requester id is required" });
    return;
  }

  if (!accessRequestId) {
    res.status(400).json({ message: "Access request id is required" });
    return;
  }

  if (userId === requesterId) {
    res
      .status(400)
      .json({ message: "You cannot create access to your own post" });
    return;
  }

  try {
    const existingAccess = await PostAccess.findOne({
      postId,
      userId: requesterId,
    });

    if (existingAccess) {
      res.status(400).json({ message: "Access already granted to this user" });
      return;
    }

    const userDoc = await User.findById(userId);

    if (!userDoc) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const postDoc = await Post.findById(postId);

    if (!postDoc) {
      await AccessRequest.findOneAndDelete({ _id: accessRequestId });
      await Notification.findOneAndDelete({ accessRequestId });
      res.status(200).json({ message: "Post has been removed" });
      return;
    }

    const addedPostAccessDoc = await PostAccess.create({
      postId,
      userId: requesterId,
      grantedBy: userId,
    });

    const accessRequestDoc = await AccessRequest.findOne({
      postId,
      _id: accessRequestId,
    });

    if (!accessRequestDoc) {
      res.status(404).json({ message: "Access request not found" });
      return;
    }

    accessRequestDoc.status = "approved";
    await accessRequestDoc.save();

    const notificationCreatedDoc = await Notification.create({
      senderId: userDoc._id,
      recipientId: requesterId,
      type: "access_approved",
      message: `Your access request to the post has been approved by ${
        userDoc.name || userDoc.username
      }`,
      accessRequestId: accessRequestDoc._id,
      post: {
        id: postDoc._id,
        title: postDoc.title,
      },
    });

    const notificationData = {
      id: notificationCreatedDoc._id,
      sender: userDoc.name || userDoc.username,
      createdAt: new Date(),
      source: {
        post: {
          id: postDoc._id,
          title: postDoc.title,
        },
      },
      message: notificationCreatedDoc.message,
      type: "access_approved",
      accessRequestId: accessRequestDoc._id,
      recipientId: requesterId,
    };

    sendNotification(requesterId, notificationData);

    res.status(200).json({
      message: "Successfully added post access",
      postAccess: addedPostAccessDoc,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const deletePostAccess: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const { postAccessIds } = req.body;

  if (!postAccessIds) {
    res.status(400).json({ message: "Post access id is required" });
    return;
  }

  const ids = Array.isArray(postAccessIds)
    ? postAccessIds
    : postAccessIds.split(",");

  try {
    const postAccess = await PostAccess.find({
      _id: postAccessIds,
      grantedBy: userId,
    });

    if (!postAccess || postAccess.length === 0) {
      res.status(404).json({ message: "Access not found" });
      return;
    }

    const deleted = await PostAccess.deleteMany({
      _id: { $in: ids },
      grantedBy: userId,
    });

    if (deleted.deletedCount === 0) {
      res.status(404).json({ message: "No matching post access found" });
      return;
    }

    const requesterIds = postAccess.map((pa) => pa.userId);

    await AccessRequest.updateMany(
      {
        requesterId: { $in: requesterIds },
      },
      { $set: { status: "rejected" } }
    );

    res.status(200).json({ message: "Deleted post access successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const getPostAccessAccepted: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const { postId } = req.params;

  if (!postId) {
    res.status(400).json({ message: "Post id is required" });
    return;
  }

  try {
    const postAccessDoc = await PostAccess.find({
      grantedBy: userId,
      postId,
    }).populate<{
      userId: {
        _id: string;
        name: string;
        username: string;
        updatedAt: Date | string;
      };
    }>("userId");

    if (!postAccessDoc) {
      res.status(404).json({ message: "Access not found" });
      return;
    }

    const postAccessAccepted = postAccessDoc.map((postAccess) => {
      return {
        id: postAccess._id,
        name: postAccess.userId.name || postAccess.userId.username,
        approvedAt: postAccess.userId.updatedAt,
      };
    });

    res.status(200).json({
      message: "Successfully fetch post accesses",
      postAccessAccepted: postAccessAccepted,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
