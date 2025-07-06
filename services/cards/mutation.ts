import { useMutation } from "@tanstack/react-query";
import { CardsService } from "./service";
import { toast } from "sonner";

export const useStoreCard = () => {
  return useMutation({
    mutationFn: CardsService.storeCard,
    onError: (error) => toast.error(error.message),
  });
};
