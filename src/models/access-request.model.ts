import mongoose from "mongoose";

export interface IAccessRequest {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  requesterId: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  receiverId: mongoose.Types.ObjectId;
}

const accessRequestSchema = new mongoose.Schema<IAccessRequest>(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true }
);

const AccessRequest = mongoose.model("AccessRequest", accessRequestSchema);
export default AccessRequest;
