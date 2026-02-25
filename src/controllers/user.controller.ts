import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      ...rest,
      password_hash,
    });

    const { password_hash: _, ...safeUser } = user.toObject();
    return res.status(201).json(safeUser);
  } catch (error) {
    return res.status(400).json({ error: "User creation failed" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password_hash");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { password_hash: _, ...safeUser } = user.toObject();
    return res.status(200).json({ user: safeUser });
  } catch (error) {
    return res.status(400).json({ error: "Login failed" });
  }
};