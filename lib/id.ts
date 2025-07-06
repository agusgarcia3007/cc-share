export function generateId(): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";

  for (let i = 0; i < 22; i++) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(1));
    result += alphabet[randomBytes[0] % alphabet.length];
  }

  return result;
}
