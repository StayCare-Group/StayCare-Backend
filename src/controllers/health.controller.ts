import { type Request, type Response } from "express";

export const healthCheck = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ message: "Server is running" });
  } catch (error) {
    res.status(500).json({ error: "Server is not running" });
  }
};