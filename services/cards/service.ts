import { http } from "@/lib/http";

import { CardStoreRequest, CardLoadResponse } from "@/types/card";

export class CardsService {
  public static async storeCard({
    encrypted,
    iv,
    ttl,
    reads,
  }: CardStoreRequest) {
    try {
      const { data } = await http.post("/store", {
        encrypted,
        iv,
        ttl,
        reads,
      });
      return data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  public static async loadCard(id: string): Promise<CardLoadResponse> {
    try {
      const { data } = await http.get(`/load?id=${id}`);
      return data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }
}
