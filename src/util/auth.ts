import { RequestHandler, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface UserJwtPayload extends JwtPayload {
  id: string;
  username: string;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export const verifyToken: RequestHandler = async (req, res, next) => {
  if (!req.headers.authorization) {
    res.status(401).json({ message: "Authorization token is required" });
    return;
  }

  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    clearRefreshToken(res);
    res.status(401).json({ message: "Access token is missing or invalid" });
    return;
  }

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET) as UserJwtPayload;
    req.userId = decodedToken.id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
};

export const generateTokens = (payload: UserJwtPayload) => {
  const { exp, iat, ...cleanPayload } = payload;
  const accessToken = jwt.sign(cleanPayload, JWT_SECRET, { expiresIn: "10m" });
  const refreshToken = jwt.sign(cleanPayload, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export const sendRefreshToken = (res: Response, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshToken = (res: Response) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
