import { useQuery } from "@tanstack/react-query";
import { getCustomerWallet } from "@/lib/services";

export const useCustomerWallet = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["customer", "wallet", page, limit],
    queryFn: async () => {
      const res: any = await getCustomerWallet(page, limit);
      // If res directly contains wallet (standard payload from service)
      if (res?.wallet) return res;
      // If nested inside res.data
      if (res?.data?.wallet) return res.data;
      return res;
    },
    staleTime: 1000 * 15,
    refetchOnWindowFocus: true,
  });
};
