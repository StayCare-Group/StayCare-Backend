import mongoose, { Document, Schema } from "mongoose";

export interface IItems extends Document {
  item_code: string;
  name: string;
  base_price: number;
  is_active: boolean;
}

const itemsSchema = new Schema<IItems>(
  {
    item_code: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    base_price: {
        type: Number,
        required: true,
    },
    is_active: {
        type: Boolean,
        required: true,
        default: true,
    },
  },
);

export default mongoose.model<IItems>("Items", itemsSchema);