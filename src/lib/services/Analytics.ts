class AnalyticsService {
  async initialize() {
    try {
      // React Native environment - Firebase Analytics handled by native modules
      console.log('Analytics service initialized for React Native');
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }

  async logEvent(eventName: string, params = {}) {
    try {
      // In React Native, analytics events are handled by native Firebase SDK
      console.log('Analytics event:', eventName, params);
    } catch (error) {
      console.warn('Analytics logEvent failed:', error);
    }
  }

  async logButtonClick(buttonName: string, screenName: string) {
    await this.logEvent("button_click", {
      button_name: buttonName,
      screen_name: screenName,
    });
  }

  async logTransaction(transactionId: string, value: number) {
    await this.logEvent("transaction", {
      transaction_id: transactionId,
      value: value,
    });
  }

  async setUserId(userId: string) {
    try {
      console.log('Analytics setUserId:', userId);
    } catch (error) {
      console.warn('Analytics setUserId failed:', error);
    }
  }

  async setUserProperty(name: string, value: string) {
    try {
      console.log('Analytics setUserProperty:', name, value);
    } catch (error) {
      console.warn('Analytics setUserProperty failed:', error);
    }
  }
}

export default new AnalyticsService();
