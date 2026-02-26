import { Request, Response } from "express";
import Invoice from "../models/Invoices";
import Order from "../models/Orders";
import { sendSuccess, sendError } from "../utils/response";

const generateInvoiceNumber = (): string => {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${y}${m}-${rand}`;
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const invoiceData = {
      ...req.body,
      invoice_number: generateInvoiceNumber(),
      issue_date: new Date(),
      status: "pending",
    };

    const invoice = await Invoice.create(invoiceData);

    await Order.updateMany(
      { _id: { $in: req.body.orders } } as any,
      { status: "Invoiced", updated_at: new Date() },
    );

    return sendSuccess(res, 201, "Invoice created", invoice);
  } catch (error) {
    return sendError(res, 400, "Invoice creation failed");
  }
};

export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const { status, client, from, to } = req.query;
    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (client) filter.client = client;

    if (from || to) {
      filter.issue_date = {};
      if (from) filter.issue_date.$gte = new Date(from as string);
      if (to) filter.issue_date.$lte = new Date(to as string);
    }

    const invoices = await Invoice.find(filter)
      .populate("client", "company_name contact_person email")
      .populate("orders", "order_number status")
      .sort({ created_at: -1 });

    return sendSuccess(res, 200, "Invoices retrieved", invoices);
  } catch (error) {
    return sendError(res, 400, "Failed to fetch invoices");
  }
};

export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("client")
      .populate("orders");

    if (!invoice) {
      return sendError(res, 404, "Invoice not found");
    }

    return sendSuccess(res, 200, "Invoice retrieved", invoice);
  } catch (error) {
    return sendError(res, 400, "Failed to fetch invoice");
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return sendError(res, 404, "Invoice not found");
    }

    if (invoice.status === "paid") {
      return sendError(res, 400, "Invoice is already fully paid");
    }

    invoice.payments.push({
      ...req.body,
      paid_at: new Date(),
    });

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid >= invoice.total) {
      invoice.status = "paid";

      await Order.updateMany(
        { _id: { $in: invoice.orders } } as any,
        { status: "Completed", updated_at: new Date() },
      );
    }

    await invoice.save();
    return sendSuccess(res, 200, "Payment recorded", invoice);
  } catch (error) {
    return sendError(res, 400, "Payment recording failed");
  }
};

export const markOverdue = async (_req: Request, res: Response) => {
  try {
    const result = await Invoice.updateMany(
      { status: "pending", due_date: { $lt: new Date() } },
      { status: "overdue" },
    );

    return sendSuccess(res, 200, "Overdue invoices updated", {
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return sendError(res, 400, "Failed to update overdue invoices");
  }
};
