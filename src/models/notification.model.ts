import mongoose, { mongo } from "mongoose";

interface INotification {
  recipientId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  type: "access_request" | "access_approved" | "access_rejected";
  post?: {
    id: mongoose.Types.ObjectId;
    title: string;
  };
  isRead: boolean;
  message?: string;
  accessRequestId: mongoose.Types.ObjectId;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["access_request", "access_approved", "access_rejected"],
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    post: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
      title: String,
    },
    accessRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccessRequest",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
