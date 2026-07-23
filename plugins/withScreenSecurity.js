const { withMainActivity, withAppDelegate } = require('@expo/config-plugins');

// Read at prebuild time from the already-sourced environment.
// build.sh sources the correct .env file before running prebuild,
// so process.env.SCREEN_SECURITY_ENABLED will be set correctly.
const isEnabled = process.env.SCREEN_SECURITY_ENABLED === 'true';

const withAndroidScreenSecurity = (config) =>
  withMainActivity(config, (config) => {
    let src = config.modResults.contents;

    // Remove any previously injected FLAG_SECURE block if security is now disabled
    if (!isEnabled) {
      if (!src.includes('FLAG_SECURE')) return config;

      src = src.replace(/\n\s*window\.setFlags\(WindowManager\.LayoutParams\.FLAG_SECURE,\s*WindowManager\.LayoutParams\.FLAG_SECURE\)/, '');
      src = src.replace('\nimport android.view.WindowManager', '');
      config.modResults.contents = src;
      return config;
    }

    if (src.includes('FLAG_SECURE')) return config;

    src = src.replace(
      'import android.os.Bundle',
      'import android.os.Bundle\nimport android.view.WindowManager'
    );

    // SDK 52+ uses savedInstanceState; older templates used null — handle both
    if (src.includes('super.onCreate(savedInstanceState)')) {
      src = src.replace(
        'super.onCreate(savedInstanceState)',
        'super.onCreate(savedInstanceState)\n    window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)'
      );
    } else {
      src = src.replace(
        'super.onCreate(null)',
        'super.onCreate(null)\n    window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)'
      );
    }

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

    // Remove previously injected block if security is now disabled
    if (!isEnabled) {
      if (!src.includes('makeSecureWindow')) return config;

      src = src.replace('window = makeSecureWindow()', 'window = UIWindow(frame: UIScreen.main.bounds)');
      src = src.replace(`${SECURE_WINDOW_FUNC}\n  // Linking API`, '// Linking API');
      config.modResults.contents = src;
      return config;
    }

    if (src.includes('makeSecureWindow')) return config;

    src = src.replace(
      /window = UIWindow\(frame: UIScreen\.main\.bounds\)/,
      'window = makeSecureWindow()'
    );
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
