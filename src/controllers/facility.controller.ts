import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response";

const facilityInventory = [
  { machine: "Washer #1", type: "Industrial Washer", capacity: "25 kg", status: "Running", currentOrder: "ORD-1025", eta: "35 min" },
  { machine: "Washer #2", type: "Industrial Washer", capacity: "25 kg", status: "Running", currentOrder: "ORD-1024", eta: "20 min" },
  { machine: "Washer #3", type: "Industrial Washer", capacity: "15 kg", status: "Available", currentOrder: null, eta: null },
  { machine: "Dryer #1", type: "Industrial Dryer", capacity: "30 kg", status: "Running", currentOrder: "ORD-1022", eta: "45 min" },
  { machine: "Dryer #2", type: "Industrial Dryer", capacity: "30 kg", status: "Running", currentOrder: "ORD-1023", eta: "15 min" },
  { machine: "Dryer #3", type: "Industrial Dryer", capacity: "20 kg", status: "Available", currentOrder: null, eta: null },
  { machine: "Iron Station #1", type: "Steam Iron", capacity: "N/A", status: "In Use", currentOrder: "ORD-1020", eta: "60 min" },
  { machine: "Iron Station #2", type: "Steam Iron", capacity: "N/A", status: "Available", currentOrder: null, eta: null },
];

export const getMachineStatus = async (_req: Request, res: Response) => {
  try {
    return sendSuccess(res, 200, "Facility machine status", facilityInventory);
  } catch (error) {
    return sendError(res, 500, "Failed to fetch machine status");
  }
};

