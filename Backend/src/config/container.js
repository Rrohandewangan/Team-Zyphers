import { env } from "./env.js";
import { logger } from "./logger.js";
import { buildAzureFoundryProvider } from "../services/ai/providers/azureFoundry.provider.js";
import { MockAIProvider } from "../services/ai/providers/mock.provider.js";
import { AIOrchestrator } from "../services/ai/ai.orchestrator.js";
import { GoogleMapsProvider } from "../services/facility/providers/googleMaps.provider.js";
import { OSMOverpassProvider } from "../services/facility/providers/osm.provider.js";
import { FacilityService } from "../services/facility/facility.service.js";
import { buildRelayProvider } from "../services/sync/relay/azureBlob.relay.js";
import { SyncService } from "../services/sync/sync.service.js";

const buildAIProvider = () => {
  switch (env.ai.provider) {
    case "azure-foundry":
      return buildAzureFoundryProvider();
    case "mock":
      return new MockAIProvider();
    default:
      throw new Error(`Unknown AI provider: ${env.ai.provider}`);
  }
};

const buildMapsProvider = () => {
  switch (env.maps.provider) {
    case "google":
      return new GoogleMapsProvider({ apiKey: env.maps.apiKey });
    case "osm":
      return new OSMOverpassProvider();
    case "mock":
      return { nearby: async () => [] };
    default:
      throw new Error(`Unknown Maps provider: ${env.maps.provider}`);
  }
};

let _container;

export const buildContainer = () => {
  if (_container) return _container;

  const aiProvider = buildAIProvider();
  const mapsProvider = buildMapsProvider();
  const relayProvider = buildRelayProvider();

  const facilityService = new FacilityService({ mapsProvider });

  _container = {
    aiOrchestrator: new AIOrchestrator({ aiProvider, facilityService }),
    facilityService,
    syncService: new SyncService({ relayProvider }),
  };

  logger.info("[container] built", {
    ai: env.ai.provider,
    maps: env.maps.provider,
    relay: env.relay.provider,
  });
  return _container;
};
