import * as SecureStore from "expo-secure-store";

/**
 * Expo Router calls this before resolving any incoming URL to a route.
 * Return the internal pathname+params to navigate to, or the original url
 * to let the router handle it normally.
 *
 * Handles:
 *   ruralpay://ruralpay.zegiftedtechnologies.com/pay/checkout?token=X  → /(common)/checkout?token=X
 *   ruralpay://ruralpay.zegiftedtechnologies.com/pay?token=X           → /qr-scan?token=X
 *   ruralpay://ruralpay.zegiftedtechnologies.com/feedback              → /(common)/feedback
 *   ruralpay://scan                                                     → /qr-scan
 *   ruralpay://merchant/qr                                             → /merchant
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    // Exact widget shortcuts — no host, just scheme://path
    if (path === "/scan") return "/qr-scan";
    if (path === "/merchant/qr") return "/merchant";

    const parsed = new URL(
      path.startsWith("ruralpay://") || path.startsWith("https://")
        ? path
        : `ruralpay://host${path}`,
    );

    const pathname = parsed.pathname;
    const token = parsed.searchParams.get("token");

    // /pay/checkout?token= → checkout (must be before /pay check)
    if (
      pathname.startsWith("/pay/checkout") ||
      pathname.startsWith("/checkout")
    ) {
      if (token) {
        // On cold start (initial=true), stash the token so the login flow
        // can resume checkout after authentication via USER_LOGGED_IN event.
        // On warm resume, navigate directly.
        if (initial) {
          SecureStore.setItemAsync("pending_checkout_token", token).catch(
            () => {},
          );
          return "/";
        }
        return `/(common)/checkout?token=${encodeURIComponent(token)}`;
      }
    }

    // /pay?token= → QR scanner
    if (pathname === "/qrpay" || pathname.startsWith("/qrpay/")) {
      if (token) return `/qrpay?token=${encodeURIComponent(token)}`;
    }

    // /feedback
    if (pathname === "/feedback") return "/(common)/feedback";
  } catch {
    // Not a parseable URL — let Expo Router handle it
  }

  return path;
}
