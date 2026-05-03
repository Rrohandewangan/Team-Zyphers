import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  useClones: false,
});

const geohash7 = (lat, lng) => `${lat.toFixed(2)}:${lng.toFixed(2)}`;

export class FacilityService {
  constructor({ mapsProvider }) {
    this.mapsProvider = mapsProvider;
  }

  async nearby({ lat, lng, type, radiusMeters }) {
    const key = `${geohash7(lat, lng)}:${type}:${radiusMeters}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const result = await this.mapsProvider.nearby({
      lat,
      lng,
      type,
      radiusMeters,
    });
    cache.set(key, result);
    return result;
  }
}
