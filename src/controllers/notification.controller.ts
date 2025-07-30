import { RequestHandler } from "express";
import Notification from "../models/notification.model";
import mongoose from "mongoose";
import { IUser } from "../models/user.model";
import { IPost } from "../models/post.model";
import { IAccessRequest } from "../models/access-request.model";

interface INotificationsPopulated extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: IUser;
  type: "access_request" | "access_approved" | "access_rejected";
  post: {
    id: mongoose.Types.ObjectId;
    title: string;
  };
  isRead: boolean;
  createdAt: Date;
  message?: string;
  accessRequestId: IAccessRequest;
}

export const getNotifications: RequestHandler = async (req, res) => {
  const userId = req.userId;

  const query = req.query;
  const maxPerPage = Number(query.maxPerPage);
  const page = Number(query.page) || 1;

  if (
    (maxPerPage && (isNaN(maxPerPage) || maxPerPage < 0)) ||
    (page && isNaN(page) && page < 0)
  ) {
    res.status(400).json({ message: "Page and maxPerPage must be a number" });
    return;
  }

  let transformedNotifications: any[] = [];

  const skip = (Number(page) - 1) * Number(maxPerPage) || 0;

  try {
    const notificationsDoc = await Notification.find({ recipientId: userId })
      .populate("senderId")
      .populate<INotificationsPopulated>("accessRequestId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxPerPage);

    if (notificationsDoc.length > 0) {
      transformedNotifications = notificationsDoc.map((n) => ({
        ...n.toObject(),
        _id: undefined,
        accessRequestId: undefined,
        senderId: undefined,
        postId: undefined,
        id: n._id,
        sender: n.senderId.name || n.senderId.username,
        createdAt: n.createdAt,
        message: n.message!,
        source: {
          post: {
            id: String(n.post.id),
            title: n.post.title,
          },
        },
        type: n.type,
        accessRequest: {
          id: n.accessRequestId._id,
          postId: n.accessRequestId.postId,
          requesterId: n.accessRequestId.requesterId,
          receiverId: n.accessRequestId.receiverId,
          status: n.accessRequestId.status,
        },
      }));
    }

    const totalNotification = await Notification.countDocuments({
      recipientId: userId,
    });

    const pageCount = Math.ceil(totalNotification / maxPerPage);

    res.status(200).json({
      message: "Successfully fetch notifications",
      notifications: {
        notifications: transformedNotifications,
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

export const markAllNotificationsAsRead: RequestHandler = async (req, res) => {
  const userId = req.userId;

  try {
    await Notification.updateMany(
      {
        recipientId: userId,
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
