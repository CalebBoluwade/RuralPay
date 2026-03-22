import * as SecureStore from "expo-secure-store";

export interface PrivacyConsent {
  dataCollection: boolean;
  analytics: boolean;
  marketing: boolean;
  acceptedAt: Date;
  version: string;
}

export interface ComplianceConsent {
  privacyPolicy: boolean;
  termsOfService: boolean;
  acceptedAt: Date;
  version: string;
}

class ComplianceService {
  private static readonly PRIVACY_CONSENT_KEY = "privacy_consent";
  private static readonly COMPLIANCE_CONSENT_KEY = "compliance_consent";
  private static readonly CURRENT_VERSION = "1.0.0";

  async getPrivacyConsent(): Promise<PrivacyConsent | null> {
    try {
      const consent = await SecureStore.getItemAsync(ComplianceService.PRIVACY_CONSENT_KEY);
      return consent ? JSON.parse(consent) : null;
    } catch {
      return null;
    }
  }

  async setPrivacyConsent(consent: Omit<PrivacyConsent, 'acceptedAt' | 'version'>): Promise<void> {
    const fullConsent: PrivacyConsent = {
      ...consent,
      acceptedAt: new Date(),
      version: ComplianceService.CURRENT_VERSION,
    };
    
    await SecureStore.setItemAsync(
      ComplianceService.PRIVACY_CONSENT_KEY,
      JSON.stringify(fullConsent)
    );
  }

  async getComplianceConsent(): Promise<ComplianceConsent | null> {
    try {
      const consent = await SecureStore.getItemAsync(ComplianceService.COMPLIANCE_CONSENT_KEY);
      return consent ? JSON.parse(consent) : null;
    } catch {
      return null;
    }
  }

  async setComplianceConsent(consent: Omit<ComplianceConsent, 'acceptedAt' | 'version'>): Promise<void> {
    const fullConsent: ComplianceConsent = {
      ...consent,
      acceptedAt: new Date(),
      version: ComplianceService.CURRENT_VERSION,
    };
    
    await SecureStore.setItemAsync(
      ComplianceService.COMPLIANCE_CONSENT_KEY,
      JSON.stringify(fullConsent)
    );
  }

  async hasRequiredConsents(): Promise<boolean> {
    const privacy = await this.getPrivacyConsent();
    const compliance = await this.getComplianceConsent();
    
    return !!(privacy?.dataCollection && compliance?.privacyPolicy && compliance?.termsOfService);
  }

  async clearAllConsents(): Promise<void> {
    await SecureStore.deleteItemAsync(ComplianceService.PRIVACY_CONSENT_KEY);
    await SecureStore.deleteItemAsync(ComplianceService.COMPLIANCE_CONSENT_KEY);
  }
}

export const complianceService = new ComplianceService();