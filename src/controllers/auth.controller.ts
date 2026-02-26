import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import type { UserRole } from "../utils/jwt";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  getClearCookieOptions,
} from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";

const SALT_ROUNDS = 10;

const toTokenRole = (role: string): UserRole =>
  (["admin", "client", "driver", "staff"].includes(role)
    ? role
    : "client") as UserRole;

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, language, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 409, "Email already in use");
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      password_hash,
      phone,
      language,
      role: role || "client",
    });

    const tokenRole = toTokenRole(user.role);

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      role: tokenRole,
    });

    const refreshToken = signRefreshToken({
      userId: user._id.toString(),
    });

    user.refresh_token = refreshToken;
    await user.save();

    res
      .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
      .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

    return sendSuccess(res, 201, "Registration successful", {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return sendError(res, 400, "Registration failed");
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password_hash +refresh_token",
    );
    if (!user) {
      return sendError(res, 401, "Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return sendError(res, 401, "Invalid credentials");
    }

    const tokenRole = toTokenRole(user.role);

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      role: tokenRole,
    });

    const refreshToken = signRefreshToken({
      userId: user._id.toString(),
    });

    user.refresh_token = refreshToken;
    await user.save();

    res
      .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
      .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

    return sendSuccess(res, 200, "Login successful", {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return sendError(res, 400, "Login failed");
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined;

    if (!token) {
      return sendError(res, 401, "Refresh token missing");
    }

    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.userId).select(
      "role email name refresh_token",
    );

    if (!user || user.refresh_token !== token) {
      return sendError(res, 401, "Invalid refresh token");
    }

    const tokenRole = toTokenRole(user.role);

    const accessToken = signAccessToken({
      userId: user._id.toString(),
      role: tokenRole,
    });

    res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());

    return sendSuccess(res, 200, "Token refreshed", {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return sendError(res, 401, "Could not refresh access token");
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

    return sendSuccess(res, 200, "Logged out");
  } catch (error) {
    return sendError(res, 400, "Logout failed");
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId)
      .select("-password_hash -refresh_token")
      .populate("client");

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    return sendSuccess(res, 200, "Current user", { user });
  } catch (error) {
    return sendError(res, 400, "Failed to fetch user");
  }
};
