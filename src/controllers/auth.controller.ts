import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
} from "../utils/jwt";

const mapRoleToPayloadRole = (role: string): "user" | "admin" =>
  role === "admin" ? "admin" : "user";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password_hash +refresh_token");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payloadRole = mapRoleToPayloadRole(user.role);

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      role: payloadRole,
    });

    const refreshToken = signRefreshToken({
      userId: user._id.toString(),
    });

    user.refresh_token = refreshToken;
    await user.save();

    const { password_hash: _, refresh_token, ...safeUser } = user.toObject();

    res
      .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
      .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        role: payloadRole,
        email: safeUser.email,
        name: safeUser.name,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: "Login failed" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;

    if (!token) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.userId).select(
      "role email name refresh_token",
    );

    if (!user || user.refresh_token !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const payloadRole = mapRoleToPayloadRole(user.role);

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      role: payloadRole,
    });

    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        role: payloadRole,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: "Could not refresh access token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;

    if (token) {
      await User.updateOne(
        { refresh_token: token },
        { $unset: { refresh_token: "" } },
      );
    }

    res
      .clearCookie("accessToken", getClearCookieOptions())
      .clearCookie("refreshToken", getClearCookieOptions());

    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    return res.status(400).json({ message: "Logout failed" });
  }
};

