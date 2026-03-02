import { Response } from "express";

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any,
) => {
  const body: ApiResponse = { success: true, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any,
) => {
  const body: ApiResponse = { success: false, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};
