const { withAndroidManifest, createRunOncePlugin } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * This plugin ensures that all assets in the assets/ folder are properly
 * copied to the Android native resources directory during the build process.
 * This ensures that assets bundled via assetBundlePatterns are also
 * available to the native layer if needed.
 */
const withAssetsBundle = createRunOncePlugin(
  (config) => {
    return withAndroidManifest(config, async (config) => {
      try {
        const projectRoot = config.modRequest.projectRoot;
        const assetsPath = path.join(projectRoot, "assets");
        const androidAssetsPath = path.join(
          projectRoot,
          "android",
          "app",
          "src",
          "main",
          "assets"
        );

        // Only proceed if assets folder exists
        if (!fs.existsSync(assetsPath)) {
          return config;
        }

        // Ensure the Android assets directory exists
        if (!fs.existsSync(androidAssetsPath)) {
          fs.mkdirSync(androidAssetsPath, { recursive: true });
        }

        // Copy assets recursively to Android resources
        const copyRecursive = (src, dest) => {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }

          const files = fs.readdirSync(src);
          files.forEach((file) => {
            // Skip hidden files and node_modules
            if (file.startsWith(".")) return;

            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            const stat = fs.statSync(srcPath);

            if (stat.isDirectory()) {
              copyRecursive(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          });
        };

        copyRecursive(assetsPath, androidAssetsPath);
        console.log(
          "✅ Successfully copied assets to Android native resources"
        );
      } catch (error) {
        console.warn("⚠️  Warning: Could not copy assets to Android:", error.message);
        // Don't fail the build, just warn
      }

      return config;
    });
  },
  {
    name: "withAssetsBundle",
  }
);

module.exports = withAssetsBundle;

