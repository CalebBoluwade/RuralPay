import Foundation
import WidgetKit

@objc(WidgetStorage)
class WidgetStorageModule: NSObject {

  private let appGroup = "group.com.zegiftedtechnologies.ruralpay"

  @objc func setItem(_ key: String, value: String) {
    NSLog("[WidgetStorage] setItem key=%@ valueLen=%d", key, value.count)
    let defaults = UserDefaults(suiteName: appGroup)
    defaults?.set(value, forKey: key)
    defaults?.synchronize()
    reloadWidgets()
  }

  @objc func reloadWidgets() {
    NSLog("[WidgetStorage] reloadAllTimelines called")
    if #available(iOS 14.0, *) {
      DispatchQueue.main.async {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { true }
}
