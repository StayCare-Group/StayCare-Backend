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

    const { password_hash: _, refresh_token, ...safeUser } = user.toObject();
    return res.status(201).json(safeUser);
  } catch (error) {
    return res.status(400).json({ error: "User creation failed" });
  }
};
