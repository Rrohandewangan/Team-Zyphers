import { SyncEnvelopeModel } from "../models/syncEnvelope.model.js";

export const envelopeRepo = {
  create: (doc) => SyncEnvelopeModel.create(doc),
  listPendingFor: (toDevice) =>
    SyncEnvelopeModel.find({ toDevice, status: "pending" }).lean(),
  markDelivered: (id, userId) =>
    SyncEnvelopeModel.updateOne({ _id: id, userId }, { status: "delivered" }),
};
