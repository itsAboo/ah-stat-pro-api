import mongoose, { Types } from "mongoose";

export interface IPost {
  _id: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  title: string;
  description?: string;
  handicapMovements: Types.ObjectId[];
  access: "public" | "private";
}

const postSchema = new mongoose.Schema<IPost>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    handicapMovements: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "HandicapMovement",
        },
      ],
      default: [],
    },
    access: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
