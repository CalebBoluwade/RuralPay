const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withMavenCentral(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const hceBuildGradle = path.join(
        config.modRequest.projectRoot,
        'node_modules/react-native-hce/android/build.gradle'
      );

      if (fs.existsSync(hceBuildGradle)) {
        let contents = fs.readFileSync(hceBuildGradle, 'utf8');

        // ❌ Remove deprecated jcenter
        contents = contents.replace(/\s*jcenter\(\)/g, '');

        // ✅ Ensure repositories
        contents = contents.replace(
          /(repositories\s*\{)/g,
          `$1
        google()
        mavenCentral()`
        );

        // ✅ Fix Kotlin version (CRITICAL)
        contents = contents.replace(
          /ext\.kotlin_version\s*=\s*["'][^"']+["']/,
          `ext.kotlin_version = "1.9.24"`
        );

        // If kotlin version doesn't exist, inject it
        if (!contents.includes('ext.kotlin_version')) {
          contents = contents.replace(
            /(buildscript\s*\{)/,
            `$1
    ext.kotlin_version = "1.9.24"`
          );
        }

        fs.writeFileSync(hceBuildGradle, contents);
      }

      return config;
    },
  ]);
};