# RuralPay — Production Implementation Roadmap
**Role:** Product UI/UX Specialist + Senior Engineering Manager
**Scope:** Full codebase review — `src/` folder (excludes native iOS/Android, node_modules)
**Original Review:** July 2025
**Last Updated:** July 2025 (Post-Sprint 2)

---

## Production Readiness Score

| Dimension | Original | Sprint 1 | Sprint 2 | Delta | Notes |
|---|---|---|---|---|---|
| UI/UX Design Quality | 74 | 79 | 84 | +5 | Dark mode on analytics, shared primitives, Coming Soon badges, phantom View removed |
| User Flow Completeness | 58 | 68 | 78 | +10 | Electricity + Cable TV implemented, stub services badged, data plans from API |
| Security Posture | 71 | 73 | 73 | 0 | API URL leak and lock screen biometric still open |
| Performance | 65 | 80 | 80 | 0 | No regressions; API-driven plans reduce bundle size over time |
| Product Drop-off Risk | HIGH | MEDIUM | MEDIUM-LOW | ↓ | Stub services resolved; lock screen biometric and receipt screen still open |
| **Overall Production Readiness** | **62** | **74** | **80** | **+6** | Approaching shippable; critical blockers 1.1 and 1.2 remain |

---

## Completed Items ✅

### Sprint 1 — Fixes Applied

| # | Item | Files Changed |
|---|---|---|
| ✅ | Feedback form wired to `POST /account/feedback` with star rating | `FeedbackForm.tsx`, `FeedbackService.ts` |
| ✅ | `<Loading />` component used for feedback submission state | `FeedbackForm.tsx` |
| ✅ | OTP bypass logic fixed — `ValidateUserPhoneNumberOTP` restored | `Register.tsx` |
| ✅ | OTP resend 60s cooldown timer with live countdown label | `Register.tsx` |
| ✅ | PIN step added to registration progress bar | `Register.tsx` |
| ✅ | Notification settings fetch on mount + PATCH on toggle with optimistic update + revert | `NotificationsSection.tsx`, `AccountService.ts` |
| ✅ | Spending limits fetched from `GET /account/spending-limits` on mount | `LimitSettingsSection.tsx`, `AccountService.ts` |
| ✅ | Spending limits PATCH to `/account/spending-limits` on confirm | `LimitSettingsSection.tsx`, `AccountService.ts` |
| ✅ | `LimitSettingsSection` and `NotificationsSection` made self-contained (no dead props) | `Profile.tsx` |
| ✅ | FlatList nested inside ScrollView eliminated on user dashboard | `src/app/user/index.tsx` |
| ✅ | FlatList nested inside ScrollView eliminated on merchant dashboard | `MerchantDashboard.tsx` |
| ✅ | Skeleton loading states for user dashboard (balance, actions, transactions) | `DashboardSkeleton.tsx` |
| ✅ | Skeleton loading states for merchant dashboard (stats, actions, menu, transactions) | `DashboardSkeleton.tsx` |
| ✅ | Blocking `<Loading />` modal replaced with inline skeleton on both dashboards | `user/index.tsx`, `MerchantDashboard.tsx` |
| ✅ | Merchant tab icons — all 3 duplicate `storefront` icons replaced with distinct pairs | `merchant/_layout.tsx` |
| ✅ | Merchant native tab icons and order fixed to match cross-platform layout | `merchant-tabs.native.tsx` |
| ✅ | Dead `MENU_ACTIONS` constant removed from merchant dashboard | `MerchantDashboard.tsx` |

---

### Sprint 2 — Fixes Applied

| # | Item | Files Changed |
|---|---|---|
| ✅ | Shared `<Button />` primitive extracted — replaces copy-pasted CTA `Pressable` across 15+ screens | `Button.tsx`, `AirtimePurchase.tsx`, `DataPurchase.tsx`, `BankTransfers.tsx`, `QRPayments.tsx`, `FeedbackForm.tsx`, `Login.tsx`, `ForgotPassword.tsx`, `MerchantQR.tsx`, `ProvisionCard.tsx`, `LinkBankAccount.tsx`, `CardManagement.tsx`, `TapPaymentsScreen.tsx`, `MerchantServices.tsx` |
| ✅ | Shared `<Card />` primitive extracted — replaces copy-pasted `cardClass` ternary across 15+ screens | `Card.tsx` + all screens above |
| ✅ | Phantom empty `<View />` removed from `TransactionHistory` header (issue 2.6) | `TransactionHistory.tsx` |
| ✅ | `MerchantStatsGraph` dark mode applied — all stat cards and chart containers use `<Card>` with `isDark` theming | `MerchantStatsGraph.tsx` |
| ✅ | `ElectricityPurchase` screen implemented — provider selection, meter type, meter number, amount, full payment → PIN flow | `ElectricityPurchase.tsx`, `electricity.tsx` |
| ✅ | `CableTVPurchase` screen implemented — DStv/GOtv/StarTimes provider tabs, bouquet plan list, smart card number, full payment → PIN flow | `CableTVPurchase.tsx`, `cable.tsx` |
| ✅ | Electricity and Cable TV wired in `ValueAddedServices` quick actions | `ValueAddedServices.tsx` |
| ✅ | "Coming Soon" badge added to Betting & Education rows; `onPress` disabled | `ValueAddedServices.tsx` |
| ✅ | Hardcoded `dataPlans` array removed from `DataPurchase` — now fetched from `PaymentService.FetchDataPlans(network)` with loading state | `DataPurchase.tsx`, `PaymentService.ts` |
| ✅ | `PaymentService.FetchElectricityProviders()` added — calls `GET /vas/electricity/providers`; screen falls back to local data if API returns empty | `PaymentService.ts`, `ElectricityPurchase.tsx` |
| ✅ | `PaymentService.FetchCableProviders()` added — calls `GET /vas/cable/providers`; screen falls back to local data if API returns empty | `PaymentService.ts`, `CableTVPurchase.tsx` |
| ✅ | `ElectricityProvider`, `CableProvider`, `CablePlan` types added to global type definitions | `types/global.d.ts` |
| ✅ | `ELECTRICITY` and `CABLE_TV` added to `PaymentMode` union type | `types/global.d.ts` |

---

## 1. Remaining Critical Blockers

### 1.1 API URL Exposed on Login Screen
**File:** `src/components/screens/auth/Login.tsx`

```tsx
{/* {__DEV__ && ( */}
<Text>{process.env.EXPO_PUBLIC_API_URL || "NO ENV"}</Text>
{/* )} */}
```

The `__DEV__` guard is commented out. The API base URL renders in plain text on the production login screen for every user. **Must fix before any public build.**

**Fix:** Restore `{__DEV__ && <Text>{process.env.EXPO_PUBLIC_API_URL}</Text>}` or remove entirely.

---

### 1.2 Lock Screen — Biometric Button Does Nothing
**File:** `src/app/lock.tsx` — `onFingerPrintPress()`

The fingerprint/Face ID button only fires haptics. No authentication is triggered. Users who tap it expecting to unlock will be confused and may force-quit the app.

**Fix:** Call `biometricLogin()` from `useAuth()` inside `onFingerPrintPress`.

---

### 1.3 Role String Inconsistency (`consumer` vs `user`)
**File:** `src/app/user/_layout.tsx`

The user tab guard checks `user?.role === "consumer"` while the folder is named `user/` and the merchant guard uses `"merchant"`. This inconsistency will cause silent auth failures if the role string ever changes on the backend.

**Fix:** Standardise to a single string — either rename the role to `"user"` everywhere or update the guard to match the actual API value.

---

## 2. High-Priority UX Issues

### 2.1 Onboarding Carousel — No "Next" Button
**File:** `src/components/screens/common/Carousel.tsx`

Slides 1–3 have no visible CTA. The only way to advance is to swipe. Rural users with low digital literacy will not know to swipe and will see the "Get Started" button only on the last slide — if they reach it.

**Fix:** Add a `Next →` button on all non-last slides alongside the existing Skip button.

---

### 2.2 Balance Card — White Text on Light Background
**File:** `src/components/ui/BalanceCard.tsx`

In light mode, account number and name render as `text-white` on `bg-lime-50` — near-invisible. Fails WCAG AA contrast (ratio < 1.5:1).

**Fix:** Use `text-slate-900` or `text-lime-900` for card text in light mode.

---

### 2.3 QR Payment — No Receipt Screen After Success
**File:** `src/components/screens/user/QRPayments.tsx` — `handlePaymentComplete()`

After a successful QR payment the app shows a toast and navigates back after 2 seconds. No amount, recipient, reference number, or timestamp is shown. For a fintech app this is both a trust failure and a regulatory gap.

**Fix:** Push a dedicated receipt/confirmation screen with transaction details before navigating back.

---

### 2.4 QR Payment — Hardcoded Beneficiary Account Number
**File:** `src/components/screens/user/QRPayments.tsx`

The actual account number from the scanned QR payload is never used in the transfer payload. Every QR payment goes to `0000000000`.

**Fix:** Use `scannedQRData.accountNumber` (or equivalent field) in the transfer payload.

---

### 2.5 Forgot Password — Double Success Toast
**File:** `src/components/screens/auth/ForgotPassword.tsx` — `onResetSubmit()`

```tsx
ToastService.success("Password Reset Successfully");
router.back();
setTimeout(() => ToastService.success("Password reset successfully"), 3000);
```

Two toasts fire — one immediately and one 3 seconds after the user has already left the screen.

**Fix:** Remove the `setTimeout` call entirely.

---

### 2.6 Bank Transfers — `TransactionPin` Conditional Render Bug ~~(was 2.8)~~
**File:** `src/components/screens/user/BankTransfers.tsx`

`TransactionPin` is only mounted when `transferData` is truthy. If the user dismisses the payment method modal, `transferData` may be stale and the modal may not remount correctly on the next attempt.

**Fix:** Always render `TransactionPin` and control visibility via `showPinModal` alone; validate `transferData` inside the handler.

---

## 3. Medium-Priority Issues

### 3.1 Auth Layout — `colorTheme` Inverted and Unused
**File:** `src/app/auth/_layout.tsx`

```tsx
const colorTheme = isDark ? "#f8fafc" : "#020617";
```

Values are inverted (dark mode gets a light colour) and the variable is never referenced in JSX.

**Fix:** Remove the variable or correct the values and use them.

---

### 3.2 `(common)/_layout.tsx` — Same Inverted `colorTheme`
**File:** `src/app/(common)/_layout.tsx`

Same copy-paste error as 3.1. `isDark ? "#f8fafc" : "#020617"` would apply a near-white background in dark mode.

---

### 3.3 Stripe Terminal `locationId` Non-Null Assertion
**File:** `src/components/screens/user/TapPaymentsScreen.tsx`

```tsx
locationId: process.env.EXPO_PUBLIC_STRIPE_LOCATION_ID!,
```

If this env var is absent in a production build the app crashes silently at payment time.

**Fix:** Add a runtime guard: `if (!process.env.EXPO_PUBLIC_STRIPE_LOCATION_ID) throw new Error(...)`.

---

### 3.4 Touch Targets Below 44×44pt Minimum
The biometric icon in the login identifier field label and several icon-only `Pressable` elements are smaller than the 44×44pt iOS/Android minimum. This is a particular problem for rural users who may have lower fine-motor precision.

**Fix:** Wrap small icons in a `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` or increase the container size.

---

### 3.5 `accessibilityLabel` Missing on Icon-Only Pressables
Screen readers cannot describe icon-only buttons (biometric login, eye toggle on balance card, back buttons) without `accessibilityLabel` props.

---

### 3.6 Localisation Gaps
Several screens still use hardcoded English strings not passed through `t()`:
- `BankTransfers.tsx` — all labels
- `MerchantStatsGraph.tsx` — all chart labels and stat cards
- `Lock.tsx` — "Welcome Back", "Enter your PIN"

---

## 4. Updated User Journey Drop-off Map

```
ONBOARDING
  └─ Carousel (no Next button) ──────────────────────── DROP-OFF RISK: Medium  ⚠️ OPEN
       └─ Login Screen
            ├─ API URL visible in production ─────────── TRUST ISSUE           ⚠️ OPEN
            ├─ Biometric icon shown but non-functional ─ DROP-OFF RISK: High   ⚠️ OPEN
            └─ Register
                 ├─ OTP validation restored ────────────────────────────────── ✅ FIXED
                 ├─ OTP resend cooldown (60s) ───────────────────────────────── ✅ FIXED
                 ├─ PIN step in progress bar ────────────────────────────────── ✅ FIXED
                 └─ Liveness (no back-nav guard) ──────── DROP-OFF RISK: Medium ⚠️ OPEN

AUTHENTICATED — USER
  └─ Dashboard
       ├─ Skeleton loading (no blocking modal) ──────────────────────────────── ✅ FIXED
       ├─ Single FlatList (no nested scroll) ──────────────────────────────────  ✅ FIXED
       ├─ Balance Card (white text on light bg) ──────── ACCESSIBILITY FAIL     ⚠️ OPEN
       ├─ Quick Actions
       │    ├─ Send → Bank Transfers ✓
       │    ├─ QR Pay → hardcoded account number ──────── BUG                   ⚠️ OPEN
       │    ├─ History → Transaction History ✓
       │    ├─ Cards → route "/transaction/Cards" ──────── UNIMPLEMENTED        ⚠️ OPEN
       │    └─ Tap Pay → Tap Payments ✓
       └─ Services Tab
            ├─ Airtime ✓
            ├─ Data → plans fetched from API ────────────────────────────────── ✅ FIXED
            ├─ Electricity → full screen implemented ───────────────────────── ✅ FIXED
            ├─ Cable TV → full screen implemented ──────────────────────────── ✅ FIXED
            ├─ Betting ──────────────────────── Coming Soon badge, disabled ─── ✅ FIXED
            └─ Education ────────────────────── Coming Soon badge, disabled ─── ✅ FIXED

  └─ Profile
       ├─ Notification settings synced to API ─────────────────────────────────  ✅ FIXED
       └─ Spending limits fetched + PATCH to API ──────────────────────────────  ✅ FIXED

AUTHENTICATED — MERCHANT
  └─ Dashboard
       ├─ Skeleton loading (no blocking modal) ──────────────────────────────── ✅ FIXED
       ├─ Single FlatList (no nested scroll) ──────────────────────────────────  ✅ FIXED
       ├─ Distinct tab icons for all 6 tabs ──────────────────────────────────── ✅ FIXED
       ├─ Quick Actions
       │    ├─ Analytics → Sales Analytics ✓
       │    └─ Services → Merchant Services ✓
       └─ Sales Analytics
            └─ Dark mode applied via <Card> primitive ──────────────────────── ✅ FIXED

FEEDBACK
  └─ Form submits to API with star rating ─────────────────────────────────────  ✅ FIXED
```

---

## 5. Remaining Implementation Roadmap

### Phase 1 — Remaining Blockers (Next Sprint)

| # | Issue | File | Effort |
|---|---|---|---|
| 1.1 | Remove API URL from Login screen | `Login.tsx` | 5 min |
| 1.2 | Wire lock screen biometric unlock | `lock.tsx` | 2h |
| 1.3 | Add "Next →" button to onboarding carousel | `Carousel.tsx` | 2h |
| 1.4 | Fix QR payment hardcoded account number | `QRPayments.tsx` | 30 min |
| 1.5 | Fix double success toast in Forgot Password | `ForgotPassword.tsx` | 5 min |
| 1.6 | Fix white text on light balance card | `BalanceCard.tsx` | 15 min |
| 1.7 | Fix inverted `colorTheme` in auth and common layouts | `auth/_layout.tsx`, `(common)/_layout.tsx` | 10 min |
| 1.8 | Add QR payment receipt/confirmation screen | `QRPayments.tsx` | 1 day |
| 1.9 | Fix `TransactionPin` conditional render in Bank Transfers | `BankTransfers.tsx` | 1h |
| 1.10 | Add Stripe Terminal `locationId` runtime guard | `TapPaymentsScreen.tsx` | 15 min |

---

### Phase 2 — Polish & Consistency (Weeks 3–4)

| # | Issue | Effort |
|---|---|---|
| 2.1 | Standardise role string (`consumer` vs `user`) | 0.5 day |
| 2.2 | Add `accessibilityLabel` to all icon-only Pressables | 1 day |
| 2.3 | Fix touch targets below 44×44pt | 0.5 day |
| 2.4 | Localise hardcoded strings in `BankTransfers`, `Lock`, `MerchantStatsGraph` | 1 day |
| 2.5 | Wire electricity + cable TV to live VAS provider API (remove fallback data) | 1 day |

---

### Phase 3 — Feature Completion (Weeks 5–7)

| # | Feature | Notes |
|---|---|---|
| 3.1 | Card Provisioning screen | Implement when ready — removed from dashboard for now |
| 3.2 | Card Management screen | Implement when ready — removed from dashboard for now |
| 3.3 | Betting & Education payments | Assess demand; remove Coming Soon badge when ready |
| 3.4 | Transaction receipt/share screen | `expo-print` already installed |
| 3.5 | Spending insights / tracker for users | `tracker.tsx` exists, needs implementation |
| 3.6 | Voice banking screen | `VoiceTransactionBanking.tsx` exists, needs wiring |
| 3.7 | USSD payment screen | `USSDPay.tsx` exists, needs wiring |

---

### Phase 4 — Production Hardening (Weeks 8–10)

| # | Task | Notes |
|---|---|---|
| 4.1 | End-to-end testing of all payment flows | Airtime, Data, Electricity, Cable TV, Bank Transfer, QR, NFC |
| 4.2 | Accessibility audit (WCAG AA) | Colour contrast, touch targets, screen reader labels |
| 4.3 | Penetration test on auth and payment flows | OTP, PIN, biometric, session expiry |
| 4.4 | CBN compliance review | KYC flow, transaction limits, consent versioning |
| 4.5 | App Store / Play Store submission prep | Review `APP_STORE_COMPLIANCE.md` |
| 4.6 | Error monitoring integration | `AppLogger` exists — add remote transport (Sentry or similar) |
| 4.7 | Analytics event tracking audit | `Analytics.ts` exists — verify all critical events fire |
| 4.8 | Load test backend with concurrent payment requests | NFC and QR simultaneous scans |

---

## 6. Design System Observations

**Strengths:**
- Consistent `lime-400/500/600` primary accent — distinctive and memorable
- Dark mode implemented across all screens (including Sales Analytics as of Sprint 2)
- `font-brand` (AutourOne) used consistently for headings
- Glassmorphism (`bg-white/10 border border-white/20`) now centralised in `<Card />` primitive
- Animated entry transitions (`useFadeSlide`) add perceived performance
- Skeleton loaders match the exact layout they replace — no layout shift on data arrival
- `<Button />` and `<Card />` primitives eliminate 15+ instances of copy-pasted style strings

**Remaining Gaps:**
- Typography scale undocumented — `text-sm` through `text-3xl` used without a defined hierarchy
- No empty state illustrations — icon + text only; SVG illustrations would improve trust for new users

---

## 7. Localisation Readiness

**Supported languages:** English (`en`), Hausa (`ha`), Igbo (`ig`), Yoruba (`yo`), Gẹẹsi (`gZ`)

**Remaining gaps:**
- `BankTransfers.tsx` — all labels hardcoded in English
- `MerchantStatsGraph.tsx` — all chart labels and stat card titles
- `Lock.tsx` — "Welcome Back", "Enter your PIN"

**Resolved:**
- `Register.tsx` — merchant step strings now passed through `t()` ✅
- `ValueAddedServices.tsx` — service names removed (Electricity/Cable now have dedicated screens; Betting/Education show Coming Soon) ✅

---

*Scores and status updated after Sprint 2. Re-evaluate after Phase 1 completion.*
