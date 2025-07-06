export async function encrypt(text: string): Promise<{
  encrypted: ArrayBuffer;
  iv: ArrayBuffer;
  key: CryptoKey;
}> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  return {
    encrypted,
    iv: iv.buffer,
    key,
  };
}

export async function decrypt(
  encryptedData: string,
  keyData: string,
  ivData: string
): Promise<string> {
  const encrypted = fromBase58(encryptedData);
  const iv = fromBase58(ivData);
  const keyBytes = fromBase58(keyData);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey("raw", key);
}

function fromBase58(base58: string): ArrayBuffer {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let decoded = BigInt(0);
  let multi = BigInt(1);

  for (let i = base58.length - 1; i >= 0; i--) {
    const char = base58[i];
    const charIndex = alphabet.indexOf(char);
    if (charIndex === -1) {
      throw new Error(`Invalid character '${char}' in base58 string`);
    }
    decoded += BigInt(charIndex) * multi;
    multi *= BigInt(58);
  }

  const bytes = [];
  while (decoded > 0) {
    bytes.unshift(Number(decoded % BigInt(256)));
    decoded = decoded / BigInt(256);
  }

  return new Uint8Array(bytes).buffer;
}

export function toBase58(buffer: ArrayBuffer): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = new Uint8Array(buffer);

  if (bytes.length === 0) return "";

  let num = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i]);
  }

  let encoded = "";
  while (num > 0) {
    const remainder = Number(num % BigInt(58));
    encoded = alphabet[remainder] + encoded;
    num = num / BigInt(58);
  }

  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    encoded = alphabet[0] + encoded;
  }

  return encoded;
}
