import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Shared Storage Keys
private let appGroup = "group.com.zegiftedtechnologies.ruralpay"
private let roleKey = "user_role"             // "merchant" | "consumer"
private let qrBase64Key = "merchant_qr_b64"   // base64 PNG set by the RN app
private let merchantNameKey = "merchant_name" // business name set by the RN app
private let deepLinkScheme = "ruralpay"
private let scanDeepLink = "ruralpay://qr-scan"

// MARK: - Timeline Entry
struct RuralPayEntry: TimelineEntry {
    let date: Date
    let role: String          // "merchant" | "consumer"
    let qrBase64: String?     // only for merchant
    let merchantName: String? // only for merchant
}

// MARK: - Provider
struct RuralPayProvider: AppIntentTimelineProvider {
    typealias Entry = RuralPayEntry
    typealias Intent = RuralPayWidgetIntent

    private func makeEntry(date: Date) -> RuralPayEntry {
        let defaults = UserDefaults(suiteName: appGroup)
        let role = defaults?.string(forKey: roleKey) ?? "consumer"
        let qr = defaults?.string(forKey: qrBase64Key)
        let name = defaults?.string(forKey: merchantNameKey)
        return RuralPayEntry(date: date, role: role, qrBase64: qr, merchantName: name)
    }

    func placeholder(in context: Context) -> RuralPayEntry {
        RuralPayEntry(date: .now, role: "consumer", qrBase64: nil, merchantName: nil)
    }

    func snapshot(for configuration: RuralPayWidgetIntent, in context: Context) async -> RuralPayEntry {
        makeEntry(date: .now)
    }

    func timeline(for configuration: RuralPayWidgetIntent, in context: Context) async -> Timeline<RuralPayEntry> {
        let entry = makeEntry(date: .now)
        // Refresh every 15 min so QR stays fresh
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: .now)!
        return Timeline(entries: [entry], policy: .after(next))
    }
}

// MARK: - Widget Views

struct RuralPayWidgetView: View {
    var entry: RuralPayEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch entry.role {
        case "merchant":
            MerchantQRView(entry: entry, family: family)
        default:
            ConsumerScanView(family: family)
        }
    }
}

// Merchant: display their payment QR
struct MerchantQRView: View {
    let entry: RuralPayEntry
    let family: WidgetFamily
    @Environment(\.widgetRenderingMode) private var renderingMode

    private var qrImage: Image? {
        // Sample demo image (256x256) used as QR placeholder
        let hardcodedTestQR = "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"
        
        // Try to use the provided QR data first
        if let b64 = entry.qrBase64, !b64.isEmpty {
            // Remove whitespace/newlines that might break base64 decoding
            let cleanBase64 = b64.trimmingCharacters(in: .whitespacesAndNewlines)
            NSLog("[MerchantQR] Base64 length=%d (original=%d)", cleanBase64.count, b64.count)
            
            if let data = Data(base64Encoded: cleanBase64) {
                NSLog("[MerchantQR] Decoded data length=%d bytes", data.count)
                
                if let ui = UIImage(data: data) {
                    NSLog("[MerchantQR] Successfully created UIImage: %@", NSCoder.string(for: ui.size))
                    // Force original rendering to prevent dark mode tinting
                    let originalUI = ui.withRenderingMode(.alwaysOriginal)
                    return Image(uiImage: originalUI)
                } else {
                    NSLog("[MerchantQR] Failed to create UIImage from decoded data")
                }
            } else {
                NSLog("[MerchantQR] Failed to Decode Base64")
            }
        } else {
            NSLog("[MerchantQR] No Base64 String Found or Empty")
        }
        
        // Fallback: Use hardcoded test QR if primary data fails
        NSLog("[MerchantQR] Using hardcoded test QR code")
        if let testData = Data(base64Encoded: hardcodedTestQR),
           let testUI = UIImage(data: testData) {
            return Image(uiImage: testUI.withRenderingMode(.alwaysOriginal))
        }
        
        return nil
    }

    private var isWide: Bool {
        family == .systemMedium || family == .systemLarge
    }

    private var isSmall: Bool {
        family == .systemSmall || family == .accessoryRectangular
    }

    private var titleStyle: AnyShapeStyle {
        renderingMode == .vibrant
        ? AnyShapeStyle(.white)
        : AnyShapeStyle(.primary)
    }

    private var subtitleStyle: AnyShapeStyle {
        renderingMode == .vibrant
        ? AnyShapeStyle(.white.opacity(0.85))
        : AnyShapeStyle(.secondary)
    }

    var body: some View {
        Group {
            if isWide, let img = qrImage {
                HStack(spacing: 8) {
                    ZStack {
                        Color.white
                        img
                            .resizable()
                            .interpolation(.none)
                            .scaledToFit()
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 6))

                    VStack(alignment: .center, spacing: 6) {
                        HStack(spacing: 4) {
                            Image("RuralPayLogo")
                                .resizable()
                                // .renderingMode(renderingMode == .fullColor ? .original : .template)
                                .scaledToFit()
                                .frame(width: 18, height: 18)
                                .clipShape(Circle())
                            Text("RuralPay")
                                .font(.caption.bold())
                                .foregroundStyle(titleStyle)
                        }
                        if let name = entry.merchantName, !name.isEmpty {
                            Text(name)
                                .font(.subheadline.bold())
                                .foregroundStyle(titleStyle)
                                .multilineTextAlignment(.center)
                                .lineLimit(2)
                        }
                        Text("Scan to pay")
                            .font(.caption)
                            .foregroundStyle(subtitleStyle)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                    }
                    .frame(maxWidth: .infinity)
                }
                .padding(4)
            } else {
                VStack(spacing: 2) {
                    if !isSmall {
                        HStack(spacing: 3) {
                            Image("RuralPayLogo")
                                .resizable()
                                .renderingMode(renderingMode == .fullColor ? .original : .template)
                                .scaledToFit()
                                .frame(width: 10, height: 10)
                                .clipShape(Circle())
                            Text("Pay")
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundStyle(titleStyle)
                        }
                    }

                    if let img = qrImage {
                        ZStack {
                            Color.white // Keep ONLY the QR code backed with white
                            img
                                .resizable()
                                .interpolation(.none)
                                .scaledToFit()
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                    } else {
                        Image("RuralPayLogo")
                            .resizable()
                            .renderingMode(renderingMode == .fullColor ? .original : .template)
                            .scaledToFit()
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .clipShape(Circle())
                            .opacity(0.6)
                    }
                }
                .padding(4)
            }
        }
        .widgetURL(URL(string: "\(deepLinkScheme)://merchant/qr"))
    }
}

// Consumer: prominent "Scan QR" CTA
struct ConsumerScanView: View {
    let family: WidgetFamily
    @Environment(\.widgetRenderingMode) var renderingMode

    private var isAccessory: Bool {
        family == .accessoryCircular
        || family == .accessoryRectangular
        || family == .accessoryInline
    }

    private var titleStyle: AnyShapeStyle {
        renderingMode == .vibrant
        ? AnyShapeStyle(.white)
        : AnyShapeStyle(.primary)
    }

    private var subtitleStyle: AnyShapeStyle {
        renderingMode == .vibrant
        ? AnyShapeStyle(.white.opacity(0.85))
        : AnyShapeStyle(.secondary)
    }

    var body: some View {
        if isAccessory {
            // Lock screen / accessory
            accessoryBody
        } else {
            homeScreenBody
        }
    }

    // Lock screen widget
    private var accessoryBody: some View {
        Link(destination: URL(string: scanDeepLink)!) {
            switch family {
            case .accessoryCircular:
                ZStack {
                    AccessoryWidgetBackground()
                    Image("RuralPayLogo")
                        .resizable()
                        .renderingMode(renderingMode == .fullColor ? .original : .template)
                        .scaledToFit()
                        .frame(width: 24, height: 24)
                        .clipShape(Circle())
                }
            case .accessoryRectangular:
                HStack(spacing: 6) {
                    Image("RuralPayLogo")
                        .resizable()
                        .renderingMode(renderingMode == .fullColor ? .original : .template)
                        .scaledToFit()
                        .frame(width: 20, height: 20)
                        .clipShape(Circle())
                    VStack(alignment: .leading, spacing: 1) {
                        Text("RuralPay")
                            .font(.caption.bold())
                        Text("Scan To Pay")
                            .font(.caption2)
                            .foregroundStyle(subtitleStyle)
                    }
                }
            case .accessoryInline:
                Label("Scan To Pay", image: "RuralPayLogo")
                    .font(.caption2)
            default:
                Image("RuralPayLogo")
                    .resizable()
                    .renderingMode(renderingMode == .fullColor ? .original : .template)
                    .scaledToFit()
                    .frame(width: 20, height: 20)
                    .clipShape(Circle())
            }
        }
        .widgetURL(URL(string: scanDeepLink)!)
    }

    // Home screen widget
    private var homeScreenBody: some View {
        let isSmall = family == .systemSmall
        let isWide = family == .systemMedium || family == .systemLarge

        return Link(destination: URL(string: scanDeepLink)!) {
            if isWide {
                HStack(spacing: 12) {
                    Image("RuralPayLogo")
                        .resizable()
                        .renderingMode(renderingMode == .fullColor ? .original : .template)
                        .scaledToFit()
                        .frame(width: 56, height: 56)
                        .clipShape(Circle())

                    VStack(alignment: .leading, spacing: 4) {
                        Text("RuralPay")
                            .font(.title3.bold())
                            .foregroundStyle(titleStyle)
                        Text("Scan To Pay")
                            .font(.subheadline)
                            .foregroundStyle(subtitleStyle)
                        Text("Tap To Scan")
                            .font(.caption2)
                            .foregroundStyle(subtitleStyle)
                    }
                    Spacer()
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(16)
            } else {
                VStack(spacing: isSmall ? 6 : 10) {
                    Image("RuralPayLogo")
                        .resizable()
                        .renderingMode(renderingMode == .fullColor ? .original : .template)
                        .scaledToFit()
                        .frame(width: isSmall ? 52 : 64, height: isSmall ? 52 : 64)
                        .clipShape(Circle())

                    VStack(spacing: 1) {
                        Text("RuralPay")
                            .font(isSmall ? .caption.bold() : .subheadline.bold())
                            .foregroundStyle(titleStyle)
                        Text("Scan To Pay")
                            .font(isSmall ? .system(size: 9) : .caption)
                            .foregroundStyle(subtitleStyle)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(isSmall ? 8 : 12)
            }
        }
        .widgetURL(URL(string: scanDeepLink)!)
    }
}

// MARK: - Home Screen Widget
struct RuralPayWidget: Widget {
    let kind = "RuralPayWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: RuralPayWidgetIntent.self,
            provider: RuralPayProvider()
        ) { entry in
            RuralPayWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                }
        }
        .configurationDisplayName("RuralPay")
        .description("RuralPay Quick QR Payment Access.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Lock Screen Widget
struct RuralPayLockScreenWidget: Widget {
    let kind = "RuralPayLockScreenWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: RuralPayWidgetIntent.self,
            provider: RuralPayProvider()
        ) { entry in
            RuralPayWidgetView(entry: entry)
        }
        .configurationDisplayName("RuralPay Quick Scan")
        .description("One-tap QR Scanner from your Lock Screen.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Previews
#Preview(as: .systemSmall) {
    RuralPayWidget()
} timeline: {
    RuralPayEntry(date: .now, role: "consumer", qrBase64: nil, merchantName: nil)
    RuralPayEntry(date: .now, role: "merchant", qrBase64: nil, merchantName: "Adaeze Stores")
}

#Preview(as: .systemMedium) {
    RuralPayWidget()
} timeline: {
    RuralPayEntry(date: .now, role: "consumer", qrBase64: nil, merchantName: nil)
    RuralPayEntry(date: .now, role: "merchant", qrBase64: nil, merchantName: "Adaeze Stores")
}

#Preview(as: .accessoryCircular) {
    RuralPayLockScreenWidget()
} timeline: {
    RuralPayEntry(date: .now, role: "consumer", qrBase64: nil, merchantName: nil)
}

#Preview(as: .accessoryRectangular) {
    RuralPayLockScreenWidget()
} timeline: {
    RuralPayEntry(date: .now, role: "consumer", qrBase64: nil, merchantName: nil)
}

#Preview(as: .accessoryInline) {
    RuralPayLockScreenWidget()
} timeline: {
    RuralPayEntry(date: .now, role: "consumer", qrBase64: nil, merchantName: nil)
}