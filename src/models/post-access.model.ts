import mongoose from "mongoose";

interface IPostAccess {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  grantedBy: mongoose.Types.ObjectId;
}

const postAccessSchema = new mongoose.Schema<IPostAccess>(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const PostAccess = mongoose.model("PostAccess", postAccessSchema);

export default PostAccess;
