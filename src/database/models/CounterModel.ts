import { type ClientSession, model, Schema } from "mongoose";

const CounterSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: false }
);

export const CounterModel = model("counters", CounterSchema);

export async function getNextSequence(name: string, session: ClientSession): Promise<string> {
  if (!session.inTransaction()) {
    throw new Error("getNextSequence must be called inside a transaction");
  }

  const counter = await CounterModel.findByIdAndUpdate(
    name,
    {
      $inc: { seq: 1 },
    },
    {
      new: true,
      upsert: true,
      session,
    }
  ).lean();

  if (!counter) {
    throw new Error(`Failed to get next sequence for ${name}`);
  }

  if (name === "locationId") {
    return `LC-${String(counter.seq).padStart(4, "0")}`;
  }

  if (name === "agencyId") {
    return `AG-${String(counter.seq).padStart(4, "0")}`;
  }

  if (name === "enquiryId") {
    return `EQ-${String(counter.seq).padStart(4, "0")}`;
  }

  if (name === "userId") {
    return `CL-${String(counter.seq).padStart(4, "0")}`;
  }

  if (name === "subscriptionId") {
    return `SP-${String(counter.seq).padStart(4, "0")}`;
  }

  if (name === "amenityId") {
    return `AM-${String(counter.seq).padStart(4, "0")}`;
  }

  if (name === "subCategoryId") {
    return `CATA-${String(counter.seq).padStart(4, "0")}`;
  }

  if (name === "propertyId") {
    return `PR-${String(counter.seq).padStart(4, "0")}`;
  }

  if (name === "purchaseId") {
    return `PH-${String(counter.seq).padStart(4, "0")}`;
  }
  if (name === "customId") {
    return `CUST-${String(counter.seq).padStart(4, "0")}`;
  }

  return String(counter.seq);
}
