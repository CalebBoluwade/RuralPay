const { withAndroidManifest, withDangerousMod, withAppBuildGradle } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PACKAGE_PATH = "com/zegiftedtechnologies/ruralpay";
const WIDGET_UPDATE_ACTION = "com.zegiftedtechnologies.ruralpay.WIDGET_UPDATE";

function resolveWidgetLogo(root) {
  const tenantSlug = process.env.TENANT_SLUG ?? "nfc-card-payments";
  const candidates = [
    path.join(root, "assets", tenantSlug, "app_logo.png"),
    path.join(root, "assets", tenantSlug, "app_icon.png"),
    path.join(root, "plugins", "android-widget", "res", "drawable", "ruralpay_logo.png"),
  ];
  const found = candidates.find(fs.existsSync);
  if (!found) throw new Error(`[withAndroidWidget] No widget logo found. Tried:\n${candidates.join("\n")}`);
  return found;
}

// Kotlin source files to copy from plugins/android-widget/ into the native project
const KOTLIN_FILES = [
  "WidgetStorage.kt",
  "WidgetStorageModule.kt",
  "WidgetStoragePackage.kt",
  "PaymentActivityModule.kt",
  "PaymentActivityPackage.kt",
  "RuralPayConsumerWidget.kt",
  "RuralPayMerchantWidget.kt",
  "RuralPayWidgetUpdateReceiver.kt",
];

// XML resource files: [srcRelative, destDir]
const RES_FILES = [
  ["xml/widget_info_consumer.xml", "xml"],
  ["xml/widget_info_merchant.xml", "xml"],
  ["layout/widget_consumer.xml", "layout"],
  ["layout/widget_merchant.xml", "layout"],
  ["layout/notification_payment_activity.xml", "layout"],
  ["drawable/widget_background.xml", "drawable"],
  ["drawable/ic_qr_scan.xml", "drawable"],
  ["drawable/ic_qr_placeholder.xml", "drawable"],
  ["drawable/ruralpay_logo.png", "drawable"],
];

function withAndroidWidget(config) {
  // 1. Copy native files
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const root = config.modRequest.projectRoot;
      const srcRoot = path.join(root, "plugins", "android-widget");
      const javaDir = path.join(
        root, "android", "app", "src", "main", "java", ...PACKAGE_PATH.split("/")
      );
      const resDir = path.join(root, "android", "app", "src", "main", "res");

      // Copy Kotlin files
      for (const file of KOTLIN_FILES) {
        const src = path.join(srcRoot, "kotlin", file);
        const dest = path.join(javaDir, file);
        if (!fs.existsSync(src)) {
          throw new Error(`[withAndroidWidget] Missing Kotlin source: ${src}`);
        }
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }

      // Copy res files
      for (const [srcRel, destSubdir] of RES_FILES) {
        const isLogo = path.basename(srcRel) === "ruralpay_logo.png";
        const src = isLogo
          ? resolveWidgetLogo(root)
          : path.join(srcRoot, "res", srcRel);
        const destDir = path.join(resDir, destSubdir);
        const dest = path.join(destDir, path.basename(srcRel));
        if (!fs.existsSync(src)) {
          throw new Error(`[withAndroidWidget] Missing required asset: ${src}`);
        }
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(src, dest);
      }

      return config;
    },
  ]);

  // 2. Inject manifest entries
  config = withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application[0];

    // Add ruralpay-dev scheme to existing intent filter if missing
    const activity = app.activity?.find(
      (a) => a.$["android:name"] === ".MainActivity"
    );
    if (activity) {
      const filters = activity["intent-filter"] || [];
      const schemeFilter = filters.find((f) =>
        f.data?.some((d) => d.$["android:scheme"] === "ruralpay")
      );
      if (schemeFilter) {
        const hasDevScheme = schemeFilter.data?.some(
          (d) => d.$["android:scheme"] === "ruralpay-dev"
        );
        if (!hasDevScheme) {
          schemeFilter.data = schemeFilter.data || [];
          schemeFilter.data.push({ $: { "android:scheme": "ruralpay-dev" } });
        }
      }
    }

    // Add widget receivers if not already present
    const receivers = app.receiver || [];
    const receiverNames = receivers.map((r) => r.$["android:name"]);

    if (!receiverNames.includes(".RuralPayConsumerWidget")) {
      receivers.push({
        $: { "android:name": ".RuralPayConsumerWidget", "android:exported": "true" },
        "intent-filter": [{ action: [{ $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" } }] }],
        "meta-data": [{ $: { "android:name": "android.appwidget.provider", "android:resource": "@xml/widget_info_consumer" } }],
      });
    }

    if (!receiverNames.includes(".RuralPayMerchantWidget")) {
      receivers.push({
        $: { "android:name": ".RuralPayMerchantWidget", "android:exported": "true" },
        "intent-filter": [{ action: [{ $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" } }] }],
        "meta-data": [{ $: { "android:name": "android.appwidget.provider", "android:resource": "@xml/widget_info_merchant" } }],
      });
    }

    if (!receiverNames.includes(".RuralPayWidgetUpdateReceiver")) {
      receivers.push({
        $: { "android:name": ".RuralPayWidgetUpdateReceiver", "android:exported": "false" },
        "intent-filter": [{ action: [{ $: { "android:name": WIDGET_UPDATE_ACTION } }] }],
      });
    }

    app.receiver = receivers;
    return config;
  });

  // 3. Register packages in MainApplication.kt
  config = withDangerousMod(config, [
    "android",
    (config) => {
      const root = config.modRequest.projectRoot;
      const mainAppPath = path.join(
        root, "android", "app", "src", "main", "java", ...PACKAGE_PATH.split("/"), "MainApplication.kt"
      );

      if (fs.existsSync(mainAppPath)) {
        let contents = fs.readFileSync(mainAppPath, "utf-8");

        // Add imports if not already present
        if (!contents.includes("import com.zegiftedtechnologies.ruralpay.WidgetStoragePackage")) {
          // Try new-arch anchor first, fall back to old-arch anchor
          const newAnchor = "import expo.modules.ExpoReactHostFactory";
          const oldAnchor = "import expo.modules.ApplicationLifecycleDispatcher";
          if (contents.includes(newAnchor)) {
            contents = contents.replace(newAnchor,
              `import com.zegiftedtechnologies.ruralpay.WidgetStoragePackage\nimport com.zegiftedtechnologies.ruralpay.PaymentActivityPackage\n${newAnchor}`);
          } else if (contents.includes(oldAnchor)) {
            contents = contents.replace(oldAnchor,
              `import com.zegiftedtechnologies.ruralpay.WidgetStoragePackage\nimport com.zegiftedtechnologies.ruralpay.PaymentActivityPackage\n${oldAnchor}`);
          }
        }

        // Inject package registrations — handle all template variants
        if (!contents.includes("WidgetStoragePackage()")) {
          // Variant A: new-arch apply {} block
          const applyBefore = "          // add(MyReactNativePackage())\n        }";
          const applyAfter  = "          // add(MyReactNativePackage())\n          add(WidgetStoragePackage())\n          add(PaymentActivityPackage())\n        }";
          // Variant B: old-arch flat return (no comment between)
          const flatBefore = "          val packages = PackageList(this).packages\n          return packages";
          const flatAfter  = "          val packages = PackageList(this).packages\n          packages.add(WidgetStoragePackage())\n          packages.add(PaymentActivityPackage())\n          return packages";
          // Variant C: actual SDK 52 template — 12-space indent with comment block
          const commentBefore = "            val packages = PackageList(this).packages\n            // Packages that cannot be autolinked yet can be added manually here, for example:\n            // packages.add(MyReactNativePackage())\n            return packages";
          const commentAfter  = "            val packages = PackageList(this).packages\n            // Packages that cannot be autolinked yet can be added manually here, for example:\n            // packages.add(MyReactNativePackage())\n            packages.add(WidgetStoragePackage())\n            packages.add(PaymentActivityPackage())\n            return packages";

          if (contents.includes(applyBefore)) {
            contents = contents.replace(applyBefore, applyAfter);
          } else if (contents.includes(commentBefore)) {
            contents = contents.replace(commentBefore, commentAfter);
          } else if (contents.includes(flatBefore)) {
            contents = contents.replace(flatBefore, flatAfter);
          } else {
            // Regex fallback: inject before any `return packages` inside getPackages()
            const injected = contents.replace(
              /(val packages = PackageList\(this\)\.packages[\s\S]*?)(\n\s*return packages)/,
              `$1\n            packages.add(WidgetStoragePackage())\n            packages.add(PaymentActivityPackage())$2`
            );
            if (injected === contents) {
              throw new Error("[withAndroidWidget] Could not find package injection point in MainApplication.kt — please check the template structure");
            }
            contents = injected;
          }
        }

        fs.writeFileSync(mainAppPath, contents, "utf-8");
      }

      return config;
    },
  ]);

  // 4. Inject kotlinx-coroutines dependency
  config = withAppBuildGradle(config, (config) => {
    const dep = `implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")`;
    if (!config.modResults.contents.includes("kotlinx-coroutines-android")) {
      config.modResults.contents = config.modResults.contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    ${dep}`
      );
    }
    return config;
  });

  // 5. Lock MainActivity to fullSensor so expo-screen-orientation can control per screen
  config = withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application[0];
    const activity = app.activity?.find(
      (a) => a.$["android:name"] === ".MainActivity"
    );
    if (activity && !activity.$["android:screenOrientation"]) {
      activity.$["android:screenOrientation"] = "fullSensor";
    }
    return config;
  });

  return config;
}

module.exports = withAndroidWidget;
