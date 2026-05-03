# VITALIS AI — Backend Setup Guide

End-to-end setup for **Azure AI Foundry (GPT)**, **Azure Blob Storage** (sync relay), **Google Maps Places**, and **MongoDB Atlas**.

---

## 1. Prerequisites

- Node.js **≥ 20**
- An Azure subscription with access to **Azure AI Foundry** (formerly Azure OpenAI)
- A **MongoDB Atlas** project (free M0 cluster works for dev)
- A **Google Cloud** project with billing enabled (for Places API)
- Azure CLI (`az`) — optional but recommended

```bash
cd Backend
npm install
cp .env.example .env
```

Then fill in `.env` using the sections below.

---

## 2. Azure AI Foundry (GPT models)

The backend talks to Foundry via the **Azure OpenAI Chat Completions** REST surface and uses **structured outputs** (`response_format: json_schema`) for triage. Use a GPT model — **not** Claude, audio, image, or embedding models.

### 2.1 Recommended deployments

| Use case              | Deployment     | Why                                          |
| --------------------- | -------------- | -------------------------------------------- |
| **Default triage**    | `gpt-4.1-mini` | Cheap, fast, native `json_schema` support    |
| Higher-quality triage | `gpt-4.1`      | Better reasoning, ~5× cost                   |
| Newer reasoning tier  | `gpt-5-mini`   | Newer family; needs `2025-01-01-preview` API |
| Cheapest GPT-5 tier   | `gpt-5-nano`   | Smallest GPT-5                               |

**Avoid for triage** (won't work with our pipeline): `gpt-5-chat` (chat-only, no schema), realtime/audio variants, `dall-e-*`, `gpt-image-*`, `text-embedding-*`, `gpt-4o-realtime-*`, `whisper`, `tts-*`.

> The provider auto-detects `gpt-5`/`o*` deployments and switches to `max_completion_tokens` (those families don't accept `max_tokens` or custom `temperature`). See [src/services/ai/providers/azureFoundry.provider.js](Backend/src/services/ai/providers/azureFoundry.provider.js).

### 2.2 Create the Foundry resource & deploy a model

In **Azure AI Foundry portal** (https://ai.azure.com):

1. **Create / open a project** → record its **endpoint** (looks like `https://<resource>.openai.azure.com` or `https://<resource>.cognitiveservices.azure.com`).
2. Go to **Models + endpoints → Deploy model**.
3. Pick **`gpt-4.1-mini`** (Standard or DataZoneStandard SKU) → Name the deployment `gpt-4.1-mini` (any name is fine; just match `AI_DEPLOYMENT`).
4. Set TPM (tokens/min) — start with **30K TPM** for dev.
5. **Keys + Endpoint** tab → copy `KEY 1` and `Endpoint`.

CLI alternative:

```bash
RG=vitalis-rg
LOC=eastus
ACCT=vitalis-foundry
az group create -n $RG -l $LOC
az cognitiveservices account create -n $ACCT -g $RG -l $LOC \
  --kind OpenAI --sku S0 --custom-domain $ACCT
az cognitiveservices account deployment create -g $RG -n $ACCT \
  --deployment-name gpt-4.1-mini \
  --model-name gpt-4.1-mini --model-version "2025-04-14" --model-format OpenAI \
  --sku-capacity 30 --sku-name "Standard"
ENDPOINT=$(az cognitiveservices account show -n $ACCT -g $RG --query properties.endpoint -o tsv)
KEY=$(az cognitiveservices account keys list -n $ACCT -g $RG --query key1 -o tsv)
echo "AI_ENDPOINT=$ENDPOINT"
echo "AI_KEY=$KEY"
```

### 2.3 .env values

```env
AI_PROVIDER=azure-foundry
AI_ENDPOINT=https://vitalis-foundry.openai.azure.com
AI_KEY=<paste KEY 1>
AI_DEPLOYMENT=gpt-4.1-mini
AI_API_VERSION=2024-10-21         # use 2025-01-01-preview for gpt-5*
AI_TIMEOUT_MS=20000
```

### 2.4 Smoke test

```bash
curl -X POST "$AI_ENDPOINT/openai/deployments/gpt-4.1-mini/chat/completions?api-version=2024-10-21" \
  -H "api-key: $AI_KEY" -H "content-type: application/json" \
  -d '{"messages":[{"role":"user","content":"ping"}],"max_tokens":5}'
```

> If you don't have Foundry access yet, leave `AI_PROVIDER=mock`. The keyword-based mock provider works end-to-end for local dev.

---

## 3. Azure Blob Storage — sync relay

Used as **encrypted blob relay** for cross-device session sync. Backend issues **short-lived SAS URLs** so the device uploads/downloads ciphertext directly to Blob (server never sees plaintext).

### 3.1 Create storage account

```bash
RG=vitalis-rg
LOC=eastus
ACCT=vitalisrelay$(date +%s)        # must be globally unique, lowercase, 3–24 chars
CONTAINER=sync-relay

az storage account create -n $ACCT -g $RG -l $LOC \
  --sku Standard_LRS --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --https-only true

# Create the private container
az storage container create -n $CONTAINER --account-name $ACCT --auth-mode login

# Lifecycle: auto-delete after 1 day (matches RELAY_TTL_HOURS)
cat > lifecycle.json <<'EOF'
{
  "rules": [{
    "enabled": true, "name": "expire-relay",
    "type": "Lifecycle",
    "definition": {
      "filters": { "blobTypes": ["blockBlob"], "prefixMatch": ["sync-relay/"] },
      "actions": { "baseBlob": { "delete": { "daysAfterCreationGreaterThan": 1 } } }
    }
  }]
}
EOF
az storage account management-policy create --account-name $ACCT -g $RG --policy @lifecycle.json

# Get the access key (used by SAS signing in the backend)
KEY=$(az storage account keys list -n $ACCT -g $RG --query "[0].value" -o tsv)
echo "AZURE_STORAGE_ACCOUNT=$ACCT"
echo "AZURE_STORAGE_KEY=$KEY"
echo "AZURE_STORAGE_CONTAINER=$CONTAINER"
```

### 3.2 CORS (so devices can `PUT` directly from the app)

```bash
az storage cors add --services b --account-name $ACCT --account-key $KEY \
  --methods PUT GET HEAD --origins "*" --allowed-headers "*" --exposed-headers "*" \
  --max-age 3600
```

> In production, replace `--origins "*"` with your app's exact origin(s).

### 3.3 .env values

```env
RELAY_PROVIDER=azure-blob
AZURE_STORAGE_ACCOUNT=vitalisrelay123456
AZURE_STORAGE_KEY=<paste key>
AZURE_STORAGE_CONTAINER=sync-relay
RELAY_TTL_HOURS=24
```

### 3.4 How it's used

- `POST /api/v1/sync/relay/upload-url` → backend signs SAS (`cw` perms, 10 min) → device uploads ciphertext.
- `POST /api/v1/sync/relay/download-url/:envelopeId` → backend signs SAS (`r` perms, 15 min) → peer device downloads.
- Lifecycle policy + envelope TTL (`expiresAt`) ensures blobs auto-purge.

Implementation: [src/services/sync/relay/azureBlob.relay.js](Backend/src/services/sync/relay/azureBlob.relay.js).

---

## 4. MongoDB Atlas

1. Atlas → **Build a Database** → M0 free tier (or M10+ for prod).
2. **Database Access** → add user `vitalis_app` with strong password.
3. **Network Access** → add your dev IP, **and** `0.0.0.0/0` only if running locally without static IP.
4. **Connect → Drivers** → copy the SRV connection string.

```env
MONGODB_URI=mongodb+srv://vitalis_app:<password>@cluster0.xxxxx.mongodb.net/vitalis?retryWrites=true&w=majority
```

> Indexes are created automatically at boot via [src/db/indexes.js](Backend/src/db/indexes.js) (`syncIndexes()` on every model).

---

## 5. Google Maps Places API

Used for the "nearest hospital/clinic/pharmacy" lookup.

1. https://console.cloud.google.com → create / select project.
2. **APIs & Services → Enable APIs** → enable **Places API (New)** _(or legacy "Places API")_.
3. **Credentials → Create credentials → API key** → **restrict** the key:
   - Application restrictions: **HTTP referrers** = none (server-side use); use **IP addresses** for prod.
   - API restrictions: limit to **Places API**.

```env
MAPS_PROVIDER=google
MAPS_API_KEY=AIzaSy...
```

In-memory NodeCache keys results by `lat.toFixed(2):lng.toFixed(2):type:radius` for 10 minutes — see [src/services/facility/facility.service.js](Backend/src/services/facility/facility.service.js).

---

## 6. JWT secret

Generate a 32+ byte secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

```env
JWT_ACCESS_SECRET=<paste 64-char base64>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=30
```

Refresh tokens are opaque 48-byte strings, hashed (SHA-256) at rest, with reuse-detection — see [src/services/auth/token.service.js](Backend/src/services/auth/token.service.js).

---

## 7. Run

```bash
# API
npm run dev               # http://localhost:3000  (api at /api/v1)

# Signaling (separate process, WebRTC SDP/ICE relay)
npm run dev:signaling     # ws://localhost:3001/ws?token=<JWT>
```

Health checks (no auth, no rate limit):

```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready    # returns 503 if Mongo not connected
```

---

## 8. Production checklist

- [ ] **Foundry**: switch to **Managed Identity** instead of `AI_KEY` (use `DefaultAzureCredential` + AAD token endpoint).
- [ ] **Storage**: rotate access keys to **User Delegation SAS** (signed via AAD identity, no long-lived key in env).
- [ ] **Storage CORS**: restrict to exact app origins.
- [ ] **MongoDB**: switch Network Access to **Private Endpoint** (Atlas Private Link).
- [ ] **Maps**: restrict by server IP / deploy behind a static IP (NAT Gateway / App Service VNet integration).
- [ ] **Secrets**: store `JWT_ACCESS_SECRET`, `AI_KEY`, `AZURE_STORAGE_KEY`, `MAPS_API_KEY`, `MONGODB_URI` in **Azure Key Vault**; mount via Key Vault references in App Service / Container Apps.
- [ ] **Logging**: ship Winston logs to **Azure Log Analytics** (Application Insights for traces). PHI/secret redaction is already enabled in [logger.js](Backend/src/config/logger.js).
- [ ] **Signaling**: replace in-memory `signalingService` Map with Redis pub/sub adapter for multi-instance scale.
- [ ] **Rate limits**: back `express-rate-limit` with Redis store (`rate-limit-redis`) before scaling out.

---

## 9. Suggested Azure resource layout

| Resource             | SKU (dev)                  | SKU (prod)                               | Purpose           |
| -------------------- | -------------------------- | ---------------------------------------- | ----------------- |
| Azure AI Foundry     | `S0` + 30K TPM             | `S0` + 100K+ TPM, PTU for steady load    | GPT inference     |
| Azure Blob Storage   | `Standard_LRS`             | `Standard_ZRS` + Private Endpoint        | Sync relay        |
| Azure Container Apps | 0.25 vCPU / 0.5 GiB, min 1 | 1 vCPU / 2 GiB, min 2, autoscale on HTTP | API + signaling   |
| MongoDB Atlas        | M0 (free)                  | M30+ in same Azure region                | Metadata DB       |
| Azure Key Vault      | Standard                   | Premium (HSM)                            | Secret storage    |
| Application Insights | Pay-as-you-go              | Pay-as-you-go + sampling                 | Observability     |
| Azure Front Door     | —                          | Standard                                 | WAF + global edge |

---

## 10. Quick API map

| Method | Path                                  | Auth         | Notes                                      |
| ------ | ------------------------------------- | ------------ | ------------------------------------------ |
| POST   | `/api/v1/auth/register`               | —            | Email + password                           |
| POST   | `/api/v1/auth/login`                  | —            | Returns access + refresh + deviceId        |
| POST   | `/api/v1/auth/refresh`                | —            | Rotates refresh; reuse → revoke family     |
| POST   | `/api/v1/auth/logout`                 | bearer       | Revokes refresh family                     |
| POST   | `/api/v1/devices`                     | bearer       | Register a new device + pubkey             |
| GET    | `/api/v1/sessions`                    | bearer       | Cursor-paginated metadata list             |
| POST   | `/api/v1/sessions`                    | bearer       | Upsert session metadata                    |
| PATCH  | `/api/v1/sessions/:id`                | bearer       | Optimistic concurrency (`expectedVersion`) |
| POST   | `/api/v1/ai/triage`                   | bearer       | GPT triage, JSON schema strict             |
| GET    | `/api/v1/facility/nearby`             | bearer       | Google Places proxy + cache                |
| POST   | `/api/v1/sync/announce`               | bearer       | List active peer devices                   |
| POST   | `/api/v1/sync/relay/upload-url`       | bearer       | SAS PUT (10 min)                           |
| POST   | `/api/v1/sync/relay/download-url/:id` | bearer       | SAS GET (15 min)                           |
| POST   | `/api/v1/sync/ack/:id`                | bearer       | Mark envelope delivered                    |
| WS     | `/ws?token=<JWT>`                     | jwt-in-query | WebRTC signaling (signaling server)        |
