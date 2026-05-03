import { envelopeRepo } from "../../repositories/envelope.repo.js";
import { deviceRepo } from "../../repositories/device.repo.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";

export class SyncService {
  constructor({ relayProvider }) {
    this.relayProvider = relayProvider;
  }

  async announce({ userId, deviceId }) {
    await deviceRepo.touch(deviceId);
    const peers = await deviceRepo.findActivePeers(userId, deviceId);
    const pending = await envelopeRepo.listPendingFor(deviceId);
    return {
      peers: peers.map((p) => ({
        id: p._id,
        platform: p.platform,
        lastSeenAt: p.lastSeenAt,
      })),
      pending: pending.map((e) => ({
        id: e._id,
        fromDevice: e.fromDevice,
        blobPath: e.blobPath,
        sha256: e.sha256,
        sizeBytes: e.sizeBytes,
      })),
    };
  }

  async issueUpload({ userId, fromDevice, toDevice, sha256, sizeBytes }) {
    const peer = await deviceRepo.findById(toDevice);
    if (!peer || peer.userId !== userId || peer.revokedAt) {
      throw new ApiError(404, "Target device not found");
    }
    const sas = await this.relayProvider.issueUpload({
      userId,
      fromDevice,
      toDevice,
    });
    const envelope = await envelopeRepo.create({
      userId,
      fromDevice,
      toDevice,
      blobPath: sas.blobPath,
      sha256,
      sizeBytes,
      expiresAt: new Date(Date.now() + env.relay.ttlHours * 60 * 60 * 1000),
    });
    return { envelopeId: envelope._id, ...sas };
  }

  async issueDownload({ userId, deviceId, envelopeId }) {
    const envelopes = await envelopeRepo.listPendingFor(deviceId);
    const envelope = envelopes.find(
      (e) => e._id === envelopeId && e.userId === userId
    );
    if (!envelope) throw new ApiError(404, "Envelope not found or not pending");
    const sas = await this.relayProvider.issueDownload({
      blobPath: envelope.blobPath,
    });
    return { envelopeId, ...sas };
  }

  async ack({ userId, envelopeId }) {
    await envelopeRepo.markDelivered(envelopeId, userId);
  }
}
