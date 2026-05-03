import { DeviceModel } from "../models/device.model.js";

export const deviceRepo = {
  create: (doc) => DeviceModel.create(doc),
  findById: (id) => DeviceModel.findById(id),
  findActiveByUser: (userId) =>
    DeviceModel.find({ userId, revokedAt: null }).lean(),
  findActivePeers: (userId, excludeDeviceId) =>
    DeviceModel.find({
      userId,
      revokedAt: null,
      _id: { $ne: excludeDeviceId },
    }).lean(),
  touch: (id) => DeviceModel.updateOne({ _id: id }, { lastSeenAt: new Date() }),
  revoke: (id, userId) =>
    DeviceModel.updateOne({ _id: id, userId }, { revokedAt: new Date() }),
};
