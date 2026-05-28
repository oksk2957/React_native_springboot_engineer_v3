const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// DEBUG: console.js polyfill require() 오류 방지를 위한 설정
// CommonJS 파일들이 ESM로 잘못 처리되는 것을 방지합니다.
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'mjs', 'cjs'];

// DEBUG: @react-native/js-polyfills를 CommonJS로 명시적 처리
// Metro가 이 파일들을 ESM로 잘못 처리하는 것을 방지합니다.
config.resolver.assetExts = [...config.resolver.assetExts, 'cjs'];

// DEBUG: @supabase/supabase-js 및 관련 패키지의 exports 필드 문제 해결
// Metro가 package.json exports를 올바르게 해석하도록 설정
config.resolver.unstable_enablePackageExports = true;

// DEBUG: Babel transformer 설정 - @react-native/js-polyfills를 CommonJS로 처리
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

// DEBUG: @react-native/js-polyfills/console.js를 CommonJS로 명시적 처리
// Metro가 이 파일을 ESM로 잘못 처리하는 것을 방지합니다.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('@react-native/js-polyfills/console')) {
    return {
      filePath: require.resolve('@react-native/js-polyfills/console.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// DEBUG: Web 환경에서 @babel/runtime helpers의 require() 사용 문제 해결
// babel-plugin-module-resolver를 통해 ESM 버전으로 리다이렉트
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@babel/runtime/helpers/defineProperty': path.resolve(__dirname, 'node_modules/@babel/runtime/helpers/esm/defineProperty.js'),
  '@babel/runtime/helpers/extends': path.resolve(__dirname, 'node_modules/@babel/runtime/helpers/esm/extends.js'),
  '@babel/runtime/helpers/objectSpread': path.resolve(__dirname, 'node_modules/@babel/runtime/helpers/esm/objectSpread.js'),
  '@babel/runtime/helpers/objectSpread2': path.resolve(__dirname, 'node_modules/@babel/runtime/helpers/esm/objectSpread2.js'),
};

module.exports = config;
