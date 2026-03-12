import React from "react";
import { useAuth } from "../context/AuthProvider";

interface ComplianceGuardProps {
  children?: React.ReactNode;
}

export default function ComplianceGuard({ children }: Readonly<ComplianceGuardProps>) {
  const { isLoading } = useAuth();

  if (isLoading) return null;

  return children ? <>{children}</> : null;
}
