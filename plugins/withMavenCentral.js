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

        // Remove jcenter() if present (removed in Gradle 9)
        contents = contents.replace(/\s*jcenter\(\)/g, '');

        // Add mavenCentral() to buildscript repositories if missing
        if (!contents.match(/buildscript[\s\S]*?repositories[\s\S]*?mavenCentral\(\)/)) {
          contents = contents.replace(
            /(buildscript[\s\S]*?repositories\s*\{)/,
            '$1\n    mavenCentral()'
          );
        }

        fs.writeFileSync(hceBuildGradle, contents);
      }

      return config;
    },
  ]);
};
