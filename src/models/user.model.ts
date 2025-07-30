import mongoose from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  username: string;
  password: string;
  name: string;
  role: "admin" | "member";
  posts: mongoose.Schema.Types.ObjectId[];
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      trim: true,
      required: true,
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    posts: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const hashPw = await bcrypt.hash(this.password, 12);
      this.password = hashPw;
    }
    next();
  } catch (error: any) {
    console.error("Error in pre-save", error);
    next(error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
