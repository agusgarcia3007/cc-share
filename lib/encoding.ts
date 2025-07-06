import { toBase58 } from "./encryption";

export const LATEST_KEY_VERSION = 1;

export function encodeCompositeKey(
  version: number,
  id: string,
  key: ArrayBuffer
): string {
  const keyB58 = toBase58(key);
  return `${version}.${id}.${keyB58}`;
}

export function decodeCompositeKey(compositeKey: string): {
  version: number;
  id: string;
  encryptionKey: string;
} {
  const parts = compositeKey.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid composite key format");
  }

  const [versionStr, id, encryptionKey] = parts;
  const version = parseInt(versionStr, 10);

  if (isNaN(version)) {
    throw new Error("Invalid version in composite key");
  }

  return {
    version,
    id,
    encryptionKey,
  };
}
