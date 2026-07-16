const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

// ✅ SVG transformer
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

// ✅ Fix extensions
config.resolver.assetExts = resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...resolver.sourceExts, 'svg'];

// ✅ Keep your other assets (don’t overwrite defaults)
config.resolver.assetExts.push('ttf', 'otf', 'png', 'jpg', 'jpeg', 'webp', 'gif');

// ✅ Alias
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
};

// ✅ Watch folders
config.watchFolders = [
  __dirname,
  path.resolve(__dirname, 'node_modules'),
];

// ⚠️ IMPORTANT: wrap LAST
module.exports = withNativeWind(config, { input: './global.css' });