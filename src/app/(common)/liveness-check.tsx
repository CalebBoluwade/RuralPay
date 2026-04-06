import LivenessVerificationScreen from "@/src/components/screens/auth/LivenessVerificationScreen";
import { getPendingVerification } from "@/src/hooks/useIdentityGate";
import { useAuth } from "@/src/components/context/AuthSessionProvider";

export default function LivenessCheckScreen() {
  const { user } = useAuth();
  const pv = getPendingVerification();

  return (
    <LivenessVerificationScreen
      userId={user?.id ?? ""}
      bvn={user?.BVN ?? ""}
      onSuccess={(result) => pv?.onSuccess(result)}
      onFailure={(error) => pv?.onFailure(error)}
    />
  );
}
