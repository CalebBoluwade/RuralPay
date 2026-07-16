import WidgetKit
import AppIntents

struct RuralPayWidgetIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "RuralPay Widget" }
    static var description: IntentDescription { "Quick Access to QR payments." }
}
