const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const IOS_FILES = [
  "WidgetStorageModule.swift",
  "WidgetStorageModule.m",
  "LiveActivityModule.swift",
  "LiveActivityModule.m",
];

function withIOSWidget(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const root = config.modRequest.projectRoot;
      const src = path.join(root, "plugins", "ios-widget");
      const dest = path.join(root, "ios", "RuralPay");

      for (const file of IOS_FILES) {
        const srcFile = path.join(src, file);
        const destFile = path.join(dest, file);
        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`✅ Copied ${file} → ios/RuralPay/`);
        } else {
          console.warn(`⚠️  Missing ${file} in plugins/ios-widget/`);
        }
      }

      return config;
    },
  ]);
}

module.exports = withIOSWidget;
