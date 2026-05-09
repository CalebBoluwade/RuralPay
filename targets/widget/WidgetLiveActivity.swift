import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Live Activity: Payment In Progress
struct PaymentActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var status: String       // "processing" | "success" | "failed"
        var amount: String       // e.g. "₦5,000"
        var merchant: String
        var elapsed: Int         // seconds since start
    }

    var paymentType: String      // "QR" | "NFC" | "Transfer"
    var transactionId: String
}

struct WidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PaymentActivityAttributes.self) { context in
            // Lock screen / notification banner
            PaymentBannerView(context: context)
                .activityBackgroundTint(bannerBg(context.state.status))
                .activitySystemActionForegroundColor(.white)

        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label(context.attributes.paymentType, systemImage: paymentIcon(context.attributes.paymentType))
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.amount)
                        .font(.subheadline.bold())
                        .foregroundStyle(statusColor(context.state.status))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        statusIcon(context.state.status)
                        Text(statusLabel(context.state.status, merchant: context.state.merchant))
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.85))
                        Spacer()
                        if context.state.status == "processing" {
                            Text("\(context.state.elapsed)s")
                                .font(.caption2.monospacedDigit())
                                .foregroundStyle(.white.opacity(0.6))
                        }
                    }
                }
            } compactLeading: {
                Image(systemName: paymentIcon(context.attributes.paymentType))
                    .foregroundStyle(.green)
            } compactTrailing: {
                Text(context.state.amount)
                    .font(.caption2.bold())
                    .foregroundStyle(statusColor(context.state.status))
            } minimal: {
                Image(systemName: statusSystemImage(context.state.status))
                    .foregroundStyle(statusColor(context.state.status))
            }
            .widgetURL(URL(string: "ruralpay://transaction/\(context.attributes.transactionId)"))
            .keylineTint(statusColor(context.state.status))
        }
    }
}

// MARK: - Banner View (lock screen / notification)
private struct PaymentBannerView: View {
    let context: ActivityViewContext<PaymentActivityAttributes>

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(.white.opacity(0.15))
                    .frame(width: 44, height: 44)
                Image(systemName: paymentIcon(context.attributes.paymentType))
                    .font(.title3.bold())
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(statusLabel(context.state.status, merchant: context.state.merchant))
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                Text("Ref: \(context.attributes.transactionId.prefix(12))…")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.7))
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(context.state.amount)
                    .font(.headline.bold())
                    .foregroundStyle(.white)
                if context.state.status == "processing" {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                        .scaleEffect(0.7)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

// MARK: - Helpers
private func paymentIcon(_ type: String) -> String {
    switch type {
    case "NFC": return "wave.3.right"
    case "Transfer": return "arrow.left.arrow.right"
    default: return "qrcode"
    }
}

private func statusColor(_ status: String) -> Color {
    switch status {
    case "success": return .green
    case "failed": return .red
    default: return .yellow
    }
}

private func bannerBg(_ status: String) -> Color {
    switch status {
    case "success": return Color(red: 0.05, green: 0.35, blue: 0.1)
    case "failed": return Color(red: 0.4, green: 0.05, blue: 0.05)
    default: return Color(red: 0.05, green: 0.1, blue: 0.3)
    }
}

private func statusSystemImage(_ status: String) -> String {
    switch status {
    case "success": return "checkmark.circle.fill"
    case "failed": return "xmark.circle.fill"
    default: return "clock.fill"
    }
}

private func statusLabel(_ status: String, merchant: String) -> String {
    switch status {
    case "success": return "Paid \(merchant)"
    case "failed": return "Payment Failed"
    default: return "Paying \(merchant)…"
    }
}

@ViewBuilder
private func statusIcon(_ status: String) -> some View {
    Image(systemName: statusSystemImage(status))
        .foregroundStyle(statusColor(status))
        .font(.caption.bold())
}

// MARK: - Preview
extension PaymentActivityAttributes {
    fileprivate static var preview: PaymentActivityAttributes {
        PaymentActivityAttributes(paymentType: "QR", transactionId: "TXN-20240101-001")
    }
}

#Preview("Notification", as: .content, using: PaymentActivityAttributes.preview) {
    WidgetLiveActivity()
} contentStates: {
    PaymentActivityAttributes.ContentState(status: "processing", amount: "₦5,000", merchant: "Mama Titi Store", elapsed: 4)
    PaymentActivityAttributes.ContentState(status: "success", amount: "₦5,000", merchant: "Mama Titi Store", elapsed: 7)
    PaymentActivityAttributes.ContentState(status: "failed", amount: "₦5,000", merchant: "Mama Titi Store", elapsed: 12)
}
