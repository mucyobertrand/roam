const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);
const config = withNativewind(defaultConfig);

// WORKAROUND (nativewind 5.0.0-rc.0 / react-native-css 3.1.0-rc.0 on RN 0.88):
// NativeWind rewrites every `react-native` import to react-native-css's component
// shim, whose hardcoded export list has no `AssetRegistry`. expo-asset reads
// `AssetRegistry` from `react-native` to load fonts, so on native every
// runtime font failed ("Cannot read property 'getAssetByID' of undefined"):
// no Plus Jakarta Sans, and no icons on Android (expo-symbols draws them from
// the Material Symbols font). expo-asset renders no UI, so it can safely use the
// real `react-native`. Remove once react-native-css exports AssetRegistry.
const nativewindResolveRequest = config.resolver.resolveRequest;
const baseResolveRequest = defaultConfig.resolver?.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native" && /[\\/]node_modules[\\/]expo-asset[\\/]/.test(context.originModulePath)) {
    return (baseResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
  }
  return nativewindResolveRequest(context, moduleName, platform);
};

module.exports = config;
