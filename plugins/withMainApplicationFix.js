const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withCustomUpdatesInit(config) {
  return withDangerousMod(config, [
    "android",
    (cfg) => {
      const gradlePropsPath = path.join(
        cfg.modRequest.platformProjectRoot,
        "gradle.properties"
      );
      let contents = fs.readFileSync(gradlePropsPath, "utf8");
      if (!contents.includes("EX_UPDATES_CUSTOM_INIT")) {
        contents += "\nEX_UPDATES_CUSTOM_INIT=true\n";
        fs.writeFileSync(gradlePropsPath, contents, "utf8");
      }
      return cfg;
    },
  ]);
}

module.exports = function withMainApplicationFix(config) {
  config = withCustomUpdatesInit(config);
  return withDangerousMod(config, [
    "android",
    (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java/com/zegiftedtechnologies/ruralpay/MainApplication.kt"
      );

      const fixed = `package com.zegiftedtechnologies.ruralpay
import com.facebook.react.common.assets.ReactFontManager

import android.app.Application
import android.content.res.Configuration

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.updates.UpdatesController
import com.zegiftedtechnologies.ruralpay.WidgetStoragePackage
import com.zegiftedtechnologies.ruralpay.PaymentActivityPackage

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
          val packages = PackageList(this).packages
          packages.add(WidgetStoragePackage())
          packages.add(PaymentActivityPackage())
          return packages
        }

        override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
    if (!BuildConfig.DEBUG) {
      UpdatesController.initialize(this)
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
`;

      fs.writeFileSync(filePath, fixed, "utf8");
      return config;
    },
  ]);
};
