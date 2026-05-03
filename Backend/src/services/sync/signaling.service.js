class SignalingService {
  constructor() {
    this.sockets = new Map();
  }

  register(deviceId, ws) {
    this.sockets.set(deviceId, ws);
  }
  unregister(deviceId) {
    this.sockets.delete(deviceId);
  }

  isOnline(deviceId) {
    return this.sockets.has(deviceId);
  }

  relay(toDeviceId, message) {
    const ws = this.sockets.get(toDeviceId);
    if (!ws) return false;
    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch {
      return false;
    }
  }
}

export const signalingService = new SignalingService();
