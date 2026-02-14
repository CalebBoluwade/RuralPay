const { withPodfile } = require('@expo/config-plugins');

module.exports = function withModularHeaders(config) {
  return withPodfile(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /platform :ios, .+/,
      (match) => `${match}\nuse_modular_headers!`
    );
    return config;
  });
};