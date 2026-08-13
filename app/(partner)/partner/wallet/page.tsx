// @ts-nocheck
import { WalletDashboard } from "@/features/partner/components/wallet/WalletDashboard";

export default function PartnerWalletPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Wallet</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track your credits, debits, and commissions.
        </p>
      </div>
      <WalletDashboard />
    </div>
  );
}
