import { Request, Response } from "express";
import Client from "../models/Clients";
import { sendSuccess, sendError } from "../utils/response";

export const createClient = async (req: Request, res: Response) => {
  try {
    const existing = await Client.findOne({ email: req.body.email });
    if (existing) {
      return sendError(res, 409, "Client with this email already exists");
    }

    const client = await Client.create(req.body);
    return sendSuccess(res, 201, "Client created", client);
  } catch (error) {
    return sendError(res, 400, "Client creation failed");
  }
};

export const getAllClients = async (_req: Request, res: Response) => {
  try {
    const clients = await Client.find();
    return sendSuccess(res, 200, "Clients retrieved", clients);
  } catch (error) {
    return sendError(res, 400, "Failed to fetch clients");
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return sendError(res, 404, "Client not found");
    }
    return sendSuccess(res, 200, "Client retrieved", client);
  } catch (error) {
    return sendError(res, 400, "Failed to fetch client");
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!client) {
      return sendError(res, 404, "Client not found");
    }
    return sendSuccess(res, 200, "Client updated", client);
  } catch (error) {
    return sendError(res, 400, "Client update failed");
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return sendError(res, 404, "Client not found");
    }
    return sendSuccess(res, 200, "Client deleted");
  } catch (error) {
    return sendError(res, 400, "Client deletion failed");
  }
};

export const addProperty = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return sendError(res, 404, "Client not found");
    }

    client.properties.push(req.body);
    await client.save();

    return sendSuccess(res, 201, "Property added", client);
  } catch (error) {
    return sendError(res, 400, "Failed to add property");
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return sendError(res, 404, "Client not found");
    }

    const property = (client.properties as any).id(req.params.propertyId);
    if (!property) {
      return sendError(res, 404, "Property not found");
    }

    Object.assign(property, req.body);
    await client.save();

    return sendSuccess(res, 200, "Property updated", client);
  } catch (error) {
    return sendError(res, 400, "Failed to update property");
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return sendError(res, 404, "Client not found");
    }

    const property = (client.properties as any).id(req.params.propertyId);
    if (!property) {
      return sendError(res, 404, "Property not found");
    }

    property.deleteOne();
    await client.save();

    return sendSuccess(res, 200, "Property deleted", client);
  } catch (error) {
    return sendError(res, 400, "Failed to delete property");
  }
};
