import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getExecutiveCustomerWallet, adjustExecutiveCustomerWallet } from "@/lib/services";

export const useExecutiveCustomerWallet = (customerId?: string) => {
  return useQuery({
    queryKey: ["executive", "wallet", customerId],
    queryFn: async () => {
      const res: any = await getExecutiveCustomerWallet(customerId as string);
      if (res?.wallet) return res;
      if (res?.data?.wallet) return res.data;
      return res;
    },
    enabled: Boolean(customerId),
    staleTime: 1000 * 10,
    refetchOnWindowFocus: true,
  });
};

export const useAdjustCustomerWalletMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerId: string;
      type: "CREDIT" | "DEBIT";
      amount: number;
      note: string;
      idempotencyKey?: string;
    }) => adjustExecutiveCustomerWallet(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["executive", "wallet", variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ["executive", "customer-status"] });
    },
  });
};
