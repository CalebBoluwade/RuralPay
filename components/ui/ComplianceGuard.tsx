import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthProvider";
import PrivacyPolicyModalEnhanced from "../ui/PrivacyPolicyModalEnhanced";

interface ComplianceGuardProps {
  children?: React.ReactNode;
}

export default function ComplianceGuard({ children }: ComplianceGuardProps) {
  const { hasRequiredConsents, checkConsents } = useAuth();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    if (!hasRequiredConsents) {
      setShowPrivacyModal(true);
    }
  }, [hasRequiredConsents]);

  const handlePrivacyAccept = async () => {
    setShowPrivacyModal(false);
    await checkConsents();
  };

  if (!hasRequiredConsents && showPrivacyModal) {
    return (
      <PrivacyPolicyModalEnhanced
        visible={showPrivacyModal}
        onClose={() => {}}
        onAccept={handlePrivacyAccept}
      />
    );
  }

  return children ? <>{children}</> : null;
}