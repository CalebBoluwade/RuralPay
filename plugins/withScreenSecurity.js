const { withMainActivity, withAppDelegate } = require('@expo/config-plugins');

const withAndroidScreenSecurity = (config) =>
  withMainActivity(config, (config) => {
    let src = config.modResults.contents;
    if (src.includes('FLAG_SECURE')) return config;

    src = src.replace(
      'import android.os.Bundle',
      'import android.os.Bundle\nimport android.view.WindowManager'
    );
    src = src.replace(
      'super.onCreate(null)',
      'super.onCreate(null)\n    window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)'
    );

    config.modResults.contents = src;
    return config;
  });

const SECURE_WINDOW_FUNC = `
  private func makeSecureWindow() -> UIWindow {
    return UIWindow(frame: UIScreen.main.bounds)
  }

  public override func applicationWillResignActive(_ application: UIApplication) {
    window?.isHidden = true
    super.applicationWillResignActive(application)
  }

  public override func applicationDidBecomeActive(_ application: UIApplication) {
    window?.isHidden = false
    super.applicationDidBecomeActive(application)
  }
`;

const withIOSScreenSecurity = (config) =>
  withAppDelegate(config, (config) => {
    let src = config.modResults.contents;
    if (src.includes('makeSecureWindow')) return config;

    // Set window before startReactNative (modern Expo template)
    src = src.replace(
      /window = UIWindow\(frame: UIScreen\.main\.bounds\)/,
      'window = makeSecureWindow()'
    );
    // Inject helper inside AppDelegate, before the Linking API section
    src = src.replace(
      '// Linking API',
      `${SECURE_WINDOW_FUNC}\n  // Linking API`
    );

    config.modResults.contents = src;
    return config;
  });

module.exports = (config) => {
  config = withAndroidScreenSecurity(config);
  config = withIOSScreenSecurity(config);
  return config;
};
