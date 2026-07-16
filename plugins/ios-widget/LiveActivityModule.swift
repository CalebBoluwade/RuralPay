import Foundation
import ActivityKit

@objc(LiveActivity)
class LiveActivityModule: NSObject {

  private var currentActivity: Activity<PaymentActivityAttributes>?

  @objc func start(_ transactionId: String, paymentType: String, amount: String, merchant: String) {
    guard #available(iOS 16.2, *) else { return }
    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      NSLog("[LiveActivity] Activities not enabled")
      return
    }

    let attrs = PaymentActivityAttributes(paymentType: paymentType, transactionId: transactionId)
    let state = PaymentActivityAttributes.ContentState(
      status: "processing", amount: amount, merchant: merchant, elapsed: 0
    )

    do {
      currentActivity = try Activity.request(
        attributes: attrs,
        content: .init(state: state, staleDate: nil),
        pushType: nil
      )
      NSLog("[LiveActivity] Started id=%@", currentActivity?.id ?? "nil")
    } catch {
      NSLog("[LiveActivity] Start failed: %@", error.localizedDescription)
    }
  }

  @objc func update(_ status: String, amount: String, merchant: String, elapsed: Int) {
    guard #available(iOS 16.2, *) else { return }
    guard let activity = currentActivity else { return }

    let state = PaymentActivityAttributes.ContentState(
      status: status, amount: amount, merchant: merchant, elapsed: elapsed
    )
    Task {
      await activity.update(.init(state: state, staleDate: nil))
      NSLog("[LiveActivity] Updated status=%@", status)
    }
  }

  @objc func dismiss() {
    guard #available(iOS 16.2, *) else { return }
    guard let activity = currentActivity else { return }

    Task {
      await activity.end(.none, dismissalPolicy: .immediate)
      NSLog("[LiveActivity] Dismissed")
    }
    currentActivity = nil
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
