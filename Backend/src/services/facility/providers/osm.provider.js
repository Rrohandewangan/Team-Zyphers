import { MapsProvider } from "./maps.provider.js";
import httpClient, { withRetry } from "../../../utils/httpClient.js";
import { ApiError } from "../../../utils/ApiError.js";
import { logger } from "../../../config/logger.js";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const TYPE_TO_OSM = {
  hospital: ["hospital"],
  doctor: ["doctors", "clinic"],
  clinic: ["clinic", "doctors"],
  pharmacy: ["pharmacy"],
};

export class OSMOverpassProvider extends MapsProvider {
  async nearby({ lat, lng, type = "hospital", radiusMeters = 5000 }) {
    const amenities = TYPE_TO_OSM[type] || ["hospital"];
    const amenityFilter = amenities.join("|");
    const query = `[out:json][timeout:15];(node["amenity"~"^(${amenityFilter})$"](around:${radiusMeters},${lat},${lng});way["amenity"~"^(${amenityFilter})$"](around:${radiusMeters},${lat},${lng});relation["amenity"~"^(${amenityFilter})$"](around:${radiusMeters},${lat},${lng}););out center 30;`;

    let lastErr;
    for (const endpoint of ENDPOINTS) {
      try {
        const body = new URLSearchParams({ data: query });
        const res = await withRetry(
          () =>
            httpClient.post(endpoint, body.toString(), {
              headers: {
                "content-type":
                  "application/x-www-form-urlencoded; charset=UTF-8",
                "user-agent": "VITALIS-AI/1.0 (healthcare triage)",
                accept: "application/json",
              },
              timeout: 25_000,
            }),
          { attempts: 1 }
        );

        const elements = res.data?.elements || [];
        return elements
          .map((el) => this.#normalize(el, lat, lng))
          .filter((f) => f && f.name)
          .sort((a, b) => (a.distanceMeters ?? 1e9) - (b.distanceMeters ?? 1e9))
          .slice(0, 10);
      } catch (err) {
        lastErr = err;
        logger.warn("[osm] endpoint failed, trying next", {
          endpoint,
          status: err.response?.status,
          message: err.message,
          body:
            typeof err.response?.data === "string"
              ? err.response.data.slice(0, 300)
              : undefined,
        });
      }
    }

    throw new ApiError(
      503,
      `OpenStreetMap facility provider unavailable: ${lastErr?.message || "unknown"}`
    );
  }

  #normalize(el, originLat, originLng) {
    const tags = el.tags || {};
    const name = tags.name || tags["name:en"] || tags.operator;
    if (!name) return null;

    const flat = el.type === "node" ? el.lat : el.center?.lat;
    const flng = el.type === "node" ? el.lon : el.center?.lon;
    const distanceMeters =
      typeof flat === "number" && typeof flng === "number"
        ? Math.round(haversine(originLat, originLng, flat, flng))
        : undefined;

    const address = [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:suburb"],
      tags["addr:city"],
      tags["addr:postcode"],
    ]
      .filter(Boolean)
      .join(", ");

    return {
      id: `osm-${el.type}-${el.id}`,
      name: String(name),
      address: address || tags["addr:full"] || undefined,
      phone: tags.phone || tags["contact:phone"] || undefined,
      website: tags.website || tags["contact:website"] || undefined,
      isOpen:
        tags.opening_hours === "24/7"
          ? true
          : tags.emergency === "yes"
            ? true
            : undefined,
      distanceMeters,
      location:
        flat && flng ? { lat: Number(flat), lng: Number(flng) } : undefined,
      types: [tags.amenity, tags.healthcare].filter(Boolean),
      source: "osm",
    };
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
