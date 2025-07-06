import { useQuery } from "@tanstack/react-query";
import { CardsService } from "./service";
import { CardLoadResponse } from "@/types/card";

export const useLoadCard = (id: string) => {
  return useQuery<CardLoadResponse>({
    queryKey: ["card", id],
    queryFn: () => CardsService.loadCard(id),
  });
};
