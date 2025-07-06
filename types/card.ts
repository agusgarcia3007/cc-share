export type CardStoreRequest = {
  encrypted: string;
  iv: string;
  ttl: number;
  reads: number | null;
};

export type CardLoadResponse = {
  encrypted: string;
  iv: string;
  remainingReads: number | null;
};
