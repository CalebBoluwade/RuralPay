/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "widget",
  icon: '../../assets/images/RuralPay.png',
  entitlements: {
    "com.apple.security.application-groups": config.ios.entitlements["com.apple.security.application-groups"],
  },
  colors: {
    light: "#FFFFFF",
    dark: "#000000",
  },
});