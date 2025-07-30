import { RequestHandler } from "express";
import { isMaxLength, isMinLength } from "../util/validate";
import User from "../models/user.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import PostAccess from "../models/post-access.model";
import AccessRequest from "../models/access-request.model";
import { generateTokens, UserJwtPayload, sendRefreshToken } from "../util/auth";

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export const signup: RequestHandler = async (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: "Invalid value" });
    return;
  }

  if (
    !isMinLength(username, 6) ||
    !isMinLength(password, 6) ||
    (!!name && !isMaxLength(name, 10))
  ) {
    res.status(400).json({ message: "Invalid value" });
    return;
  }

  try {
    const userDoc = await User.findOne({ username });
    if (userDoc) {
      res.status(400).json({ message: "username already existed" });
      return;
    }

    const newUserDoc = await User.create({ username, password, name });

    const jwtPayload = {
      id: String(newUserDoc._id),
      username: newUserDoc.username,
    };

    const { accessToken, refreshToken } = generateTokens(jwtPayload);

    const newUser = {
      ...newUserDoc.toObject(),
      __v: undefined,
      password: undefined,
      _id: undefined,
      id: newUserDoc._id,
    };

    sendRefreshToken(res, refreshToken);

    res.status(200).json({
      message: "Create user successfully",
      token: accessToken,
      user: newUser,
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
    return;
  }
};

export const signin: RequestHandler = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: "Invalid value" });
    return;
  }

  if (!isMinLength(username, 6) || !isMinLength(password, 6)) {
    res.status(400).json({ message: "Invalid value" });
    return;
  }

  try {
    const userDoc = await User.findOne({ username });

    if (!userDoc) {
      res.status(400).json({ message: "username or password is invalid" });
      return;
    }

    const isPwMatch = await bcrypt.compare(password, userDoc.password);

    if (!isPwMatch) {
      res.status(400).json({ message: "username or password is invalid" });
      return;
    }
    const jwtPayload = {
      id: String(userDoc._id),
      username: userDoc.username,
    };

    const { accessToken, refreshToken } = generateTokens(jwtPayload);

    const user = {
      ...userDoc.toObject(),
      __v: undefined,
      password: undefined,
      _id: undefined,
      id: userDoc._id,
    };

    sendRefreshToken(res, refreshToken);

    res
      .status(200)
      .json({ message: "Sign in successfully", token: accessToken, user });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
    return;
  }
};

export const getUser: RequestHandler = async (req, res) => {
  const userId = req.userId;

  try {
    const userDoc = await User.findById(userId);

    if (!userDoc) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const accessiblePostDoc = await PostAccess.find({ userId });

    const accessRequestDoc = await AccessRequest.find({ requesterId: userId });

    const user = {
      id: userDoc._id,
      username: userDoc.username,
      role: userDoc.role,
      posts: userDoc.posts,
      name: userDoc.name,
      accessiblePostIds: accessiblePostDoc.map((e) => ({ postId: e.postId })),
      accessRequest: accessRequestDoc.map((e) => ({
        postId: e.postId,
        status: e.status,
      })),
    };

    res.status(200).json({ message: "Success", user });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
    return;
  }
};

export const updatePassword: RequestHandler = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    res.status(400).json({
      message: "Old password, new password, and confirm password are required",
    });
    return;
  }

  if (
    !isMinLength(oldPassword, 6) ||
    !isMinLength(newPassword, 6) ||
    !isMinLength(confirmPassword, 6)
  ) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({
      newPassword: "New password and confirm password do not match",
      confirmPassword: "New password and confirm password do not match",
    });
    return;
  }

  try {
    const userId = req.userId;
    const userDoc = await User.findById(userId);

    if (!userDoc) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      userDoc.password
    );

    if (!isOldPasswordValid) {
      res.status(400).json({ oldPassword: "Current password is incorrect" });
      return;
    }

    const isSamePassword = await bcrypt.compare(newPassword, userDoc.password);
    if (isSamePassword) {
      res.status(400).json({
        newPassword: "New password must be different from current password",
      });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error", error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
    return;
  }
};

export const updateName: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ message: "Name is require to update" });
    return;
  }

  try {
    const userDoc = await User.findById(userId);

    if (!userDoc) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    userDoc.name = name;
    await userDoc.save();

    res.status(200).json({ message: "Updated name successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const signout: RequestHandler = async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
  });
  res.status(200).json({ message: "Sign out successfully" });
};

export const refreshToken: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ message: "Refresh token is required" });
    return;
  }

  try {
    const decodedToken = jwt.verify(
      refreshToken,
      JWT_REFRESH_SECRET
    ) as UserJwtPayload;

    const { accessToken, refreshToken: newRefreshToken } =
      generateTokens(decodedToken);

    sendRefreshToken(res, newRefreshToken);

    res.status(200).json({ token: accessToken });
  } catch (error) {
    console.log(error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};
