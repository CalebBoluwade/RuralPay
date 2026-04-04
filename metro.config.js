// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add asset extensions
config.resolver.assetExts.push("ttf", "otf", "png", "jpg", "jpeg", "svg", "webp", "gif");

// Ensure assets are included in the bundle
config.resolver.sourceExts = ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs', 'cjs'];

// Configure Metro to resolve TypeScript path aliases
// Map @/ to the project root for require() statements
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
};

// Add the project root to watchFolders to ensure Metro watches the assets directory
config.watchFolders = [
  __dirname,
  path.resolve(__dirname, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
