import { Request, Response } from "express";
import Order from "../models/Orders";
import { sendSuccess, sendError } from "../utils/response";

const generateOrderNumber = (): string => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${y}${m}${d}-${rand}`;
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const orderData = {
      ...req.body,
      order_number: generateOrderNumber(),
      status: "Pending",
      status_history: [
        {
          status: "Pending",
          changed_by: req.user!.userId,
          timestamp: new Date(),
        },
      ],
    };

    if (!orderData.pricing_snapshot) {
      orderData.pricing_snapshot = {
        subtotal: 0,
        vat_percentage: 18,
        vat_amount: 0,
        total: 0,
      };
    }

    const order = await Order.create(orderData);
    return sendSuccess(res, 201, "Order created", order);
  } catch (error) {
    return sendError(res, 400, "Order creation failed");
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status, client, service_type, from, to } = req.query;
    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (service_type) filter.service_type = service_type;

    if (req.user!.role === "client") {
      filter.client = req.user!.userId;
    } else if (client) {
      filter.client = client;
    }

    if (req.user!.role === "driver") {
      filter.deliver_id = req.user!.userId;
    }

    if (from || to) {
      filter.created_at = {};
      if (from) filter.created_at.$gte = new Date(from as string);
      if (to) filter.created_at.$lte = new Date(to as string);
    }

    const orders = await Order.find(filter)
      .populate("client", "company_name contact_person email")
      .populate("deliver_id", "name email")
      .sort({ created_at: -1 });

    return sendSuccess(res, 200, "Orders retrieved", orders);
  } catch (error) {
    return sendError(res, 400, "Failed to fetch orders");
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("client")
      .populate("deliver_id", "name email phone");

    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    if (
      req.user!.role === "client" &&
      (order.client as any)._id?.toString() !== req.user!.userId
    ) {
      return sendError(res, 403, "Forbidden");
    }

    return sendSuccess(res, 200, "Order retrieved", order);
  } catch (error) {
    return sendError(res, 400, "Failed to fetch order");
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    if (
      !["Pending", "Assigned"].includes(order.status) &&
      req.user!.role !== "admin"
    ) {
      return sendError(res, 400, "Order can only be edited while Pending or Assigned");
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true },
    );

    return sendSuccess(res, 200, "Order updated", updated);
  } catch (error) {
    return sendError(res, 400, "Order update failed");
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    order.status = status;
    order.status_history.push({
      status,
      changed_by: req.user!.userId,
      timestamp: new Date(),
    });
    order.updated_at = new Date();

    await order.save();
    return sendSuccess(res, 200, "Order status updated", order);
  } catch (error) {
    return sendError(res, 400, "Status update failed");
  }
};

export const confirmPickup = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    if (!["Pending", "Assigned"].includes(order.status)) {
      return sendError(res, 400, "Order is not awaiting pickup");
    }

    order.actual_bags = req.body.actual_bags;

    if (req.body.photos) {
      for (const photo of req.body.photos) {
        order.photos.push({ ...photo, uploaded_at: new Date() });
      }
    }

    if (req.body.items) {
      order.items = req.body.items;
    }

    if (req.body.notes) {
      order.special_notes = [order.special_notes, req.body.notes]
        .filter(Boolean)
        .join(" | ");
    }

    order.deliver_id = req.user!.userId as any;
    order.status = "Transit";
    order.status_history.push({
      status: "Transit",
      changed_by: req.user!.userId,
      timestamp: new Date(),
    });
    order.updated_at = new Date();

    await order.save();
    return sendSuccess(res, 200, "Pickup confirmed", order);
  } catch (error) {
    return sendError(res, 400, "Pickup confirmation failed");
  }
};

export const receiveAtFacility = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    if (order.status !== "Transit") {
      return sendError(res, 400, "Order is not in transit");
    }

    if (req.body.items) {
      order.items = req.body.items;
    }

    if (req.body.internal_notes) {
      order.special_notes = [order.special_notes, req.body.internal_notes]
        .filter(Boolean)
        .join(" | ");
    }

    order.status = "Arrived";
    order.status_history.push({
      status: "Arrived",
      changed_by: req.user!.userId,
      timestamp: new Date(),
    });
    order.updated_at = new Date();

    await order.save();
    return sendSuccess(res, 200, "Order received at facility", order);
  } catch (error) {
    return sendError(res, 400, "Facility reception failed");
  }
};

export const confirmDelivery = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    if (!["ReadyToDeliver", "Collected"].includes(order.status)) {
      return sendError(res, 400, "Order is not ready for delivery");
    }

    if (req.body.photos) {
      for (const photo of req.body.photos) {
        order.photos.push({ ...photo, uploaded_at: new Date() });
      }
    }

    order.status = "Delivered";
    order.status_history.push({
      status: "Delivered",
      changed_by: req.user!.userId,
      timestamp: new Date(),
    });
    order.updated_at = new Date();

    await order.save();
    return sendSuccess(res, 200, "Delivery confirmed", order);
  } catch (error) {
    return sendError(res, 400, "Delivery confirmation failed");
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return sendError(res, 404, "Order not found");
    }

    if (order.status !== "Pending") {
      return sendError(res, 400, "Only pending orders can be deleted");
    }

    await order.deleteOne();
    return sendSuccess(res, 200, "Order deleted");
  } catch (error) {
    return sendError(res, 400, "Order deletion failed");
  }
};
