import { MapsProvider } from "./maps.provider.js";
import httpClient, { withRetry } from "../../../utils/httpClient.js";
import { ApiError } from "../../../utils/ApiError.js";

const PLACES_URL =
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

export class GoogleMapsProvider extends MapsProvider {
  constructor({ apiKey }) {
    super();
    this.apiKey = apiKey;
  }

  async nearby({ lat, lng, type = "hospital", radiusMeters = 5000 }) {
    try {
      const res = await withRetry(() =>
        httpClient.get(PLACES_URL, {
          params: {
            location: `${lat},${lng}`,
            radius: radiusMeters,
            type,
            key: this.apiKey,
          },
          timeout: 8000,
        })
      );
      if (res.data.status !== "OK" && res.data.status !== "ZERO_RESULTS") {
        throw new ApiError(502, `Maps provider error: ${res.data.status}`);
      }
      return (res.data.results || []).slice(0, 5).map((p) => {
        const loc = p.geometry?.location;
        return {
          id: p.place_id,
          name: p.name,
          address: p.vicinity,
          location: loc,
          distanceMeters: undefined, // Google Places API does not return distance
          rating: p.rating,
          openNow: p.opening_hours?.open_now,
          types: p.types,
        };
      });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(503, "Maps provider unavailable");
    }
  }
}
