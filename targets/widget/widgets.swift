import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Shared Storage Keys
private let appGroup = "group.com.zegiftedtechnologies.ruralpay"
private let roleKey = "user_role"           // "merchant" | "consumer"
private let qrBase64Key = "merchant_qr_b64" // base64 PNG set by the RN app
private let deepLinkScheme = "ruralpay"
private let scanDeepLink = "ruralpay://qr-scan"

// MARK: - Timeline Entry
struct RuralPayEntry: TimelineEntry {
    let date: Date
    let role: String        // "merchant" | "consumer"
    let qrBase64: String?   // only for merchant
}

// MARK: - Provider
struct RuralPayProvider: AppIntentTimelineProvider {
    typealias Entry = RuralPayEntry
    typealias Intent = RuralPayWidgetIntent

    private func makeEntry(date: Date) -> RuralPayEntry {
        let defaults = UserDefaults(suiteName: appGroup)
        let role = defaults?.string(forKey: roleKey) ?? "consumer"
        let qr = defaults?.string(forKey: qrBase64Key)
        return RuralPayEntry(date: date, role: role, qrBase64: qr)
    }

    func placeholder(in context: Context) -> RuralPayEntry {
        RuralPayEntry(date: .now, role: "consumer", qrBase64: nil)
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

    private var qrImage: Image? {
        guard let b64 = entry.qrBase64,
              let data = Data(base64Encoded: b64),
              let ui = UIImage(data: data) else { return nil }
        return Image(uiImage: ui)
    }

    var body: some View {
        let isSmall = family == .systemSmall || family == .accessoryRectangular

        VStack(spacing: isSmall ? 2 : 4) {
            HStack(spacing: 4) {
                Image(systemName: "qrcode")
                    .font(.caption2.bold())
                    .foregroundStyle(.green)
                Text("Receive Payment")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(.primary)
            }
            .padding(.bottom, isSmall ? 0 : 2)

            if let img = qrImage {
                img
                    .resizable()
                    .interpolation(.none)
                    .scaledToFit()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
            } else {
                Image(systemName: "qrcode")
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .foregroundStyle(.green.opacity(0.6))
            }
        }
        .padding(isSmall ? 6 : 8)
        .widgetURL(URL(string: "\(deepLinkScheme)://merchant/qr"))
    }
}

// Consumer: prominent "Scan QR" CTA
struct ConsumerScanView: View {
    let family: WidgetFamily

    private var isAccessory: Bool {
        family == .accessoryCircular || family == .accessoryRectangular || family == .accessoryInline
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
                        .scaledToFit()
                        .frame(width: 24, height: 24)
                }
            case .accessoryRectangular:
                HStack(spacing: 6) {
                    Image("RuralPayLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 20, height: 20)
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Scan to Pay")
                            .font(.caption.bold())
                        Text("RuralPay")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            default:
                Image("RuralPayLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 20, height: 20)
            }
        }
        .widgetURL(URL(string: scanDeepLink)!)
    }

    // Home screen widget
    private var homeScreenBody: some View {
        let isSmall = family == .systemSmall

        return Link(destination: URL(string: scanDeepLink)!) {
            VStack(spacing: isSmall ? 6 : 10) {
                Image("RuralPayLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: isSmall ? 52 : 64, height: isSmall ? 52 : 64)

                Text("Scan to Pay")
                    .font(isSmall ? .caption.bold() : .subheadline.bold())
                    .foregroundStyle(.primary)

                if !isSmall {
                    Text("Tap to open scanner")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(isSmall ? 8 : 12)
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
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("RuralPay")
        .description("Quick QR payment access.")
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
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("RuralPay Quick Scan")
        .description("One-tap QR scanner from your lock screen.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Previews
#Preview(as: .systemSmall) {
    RuralPayWidget()
} timeline: {
    RuralPayEntry(date: .now, role: "consumer", qrBase64: nil)
    RuralPayEntry(date: .now, role: "merchant", qrBase64: nil)
}

#Preview(as: .accessoryCircular) {
    RuralPayLockScreenWidget()
} timeline: {
    RuralPayEntry(date: .now, role: "consumer", qrBase64: nil)
}
