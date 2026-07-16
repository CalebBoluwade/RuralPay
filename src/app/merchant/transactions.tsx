import TransactionHistory from "@/src/components/screens/common/TransactionHistory";
import { useAuth } from "@/src/components/context/AuthSessionProvider";

export default function MerchantTransactions() {
  const { user } = useAuth();
  return <TransactionHistory merchantName={user?.merchant?.businessName} />;
}
