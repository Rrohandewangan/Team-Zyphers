import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";
import { v4 as uuid } from "uuid";
import { RelayProvider } from "./relay.provider.js";
import { env } from "../../../config/env.js";

export class AzureBlobRelayProvider extends RelayProvider {
  constructor({ account, key, container }) {
    super();
    this.account = account;
    this.container = container;
    this.credential = new StorageSharedKeyCredential(account, key);
    this.client = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      this.credential
    );
  }

  _sas(blobPath, perms, expiresInMin) {
    const startsOn = new Date(Date.now() - 60_000);
    const expiresOn = new Date(Date.now() + expiresInMin * 60_000);
    return generateBlobSASQueryParameters(
      {
        containerName: this.container,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse(perms),
        startsOn,
        expiresOn,
        protocol: "https",
      },
      this.credential
    ).toString();
  }

  async issueUpload({ userId, fromDevice, toDevice }) {
    const blobPath = `${userId}/${toDevice}/${uuid()}.bin`;
    const sas = this._sas(blobPath, "cw", 10);
    return {
      blobPath,
      uploadUrl: `https://${this.account}.blob.core.windows.net/${this.container}/${blobPath}?${sas}`,
      expiresInSeconds: 600,
      fromDevice,
      toDevice,
    };
  }

  async issueDownload({ blobPath }) {
    const sas = this._sas(blobPath, "r", 15);
    return {
      downloadUrl: `https://${this.account}.blob.core.windows.net/${this.container}/${blobPath}?${sas}`,
      expiresInSeconds: 900,
    };
  }
}

export class MockRelayProvider extends RelayProvider {
  async issueUpload({ userId, fromDevice, toDevice }) {
    const blobPath = `mock/${userId}/${toDevice}/${uuid()}.bin`;
    return {
      blobPath,
      uploadUrl: `https://mock.local/${blobPath}`,
      expiresInSeconds: 600,
      fromDevice,
      toDevice,
    };
  }
  async issueDownload({ blobPath }) {
    return {
      downloadUrl: `https://mock.local/${blobPath}?ro=1`,
      expiresInSeconds: 900,
    };
  }
}

export const buildRelayProvider = () => {
  if (env.relay.provider === "azure-blob") {
    return new AzureBlobRelayProvider({
      account: env.relay.account,
      key: env.relay.key,
      container: env.relay.container,
    });
  }
  return new MockRelayProvider();
};
