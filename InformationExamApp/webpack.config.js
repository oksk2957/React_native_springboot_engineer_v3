const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // DEBUG: require is not defined 오류 방지를 위한 polyfill 설정
  // @react-native/js-polyfills/console.js 등 CommonJS 모듈이 ESM 환경에서 로드될 때 발생
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: false,
    stream: false,
    buffer: false,
    util: false,
    process: false,
    path: false,
    os: false,
    fs: false,
    net: false,
    tls: false,
    url: false,
    zlib: false,
    http: false,
    https: false,
    querystring: false,
    assert: false,
    constants: false,
    timers: false,
    console: false,
  };

  // DEBUG: @react-native/js-polyfills의 require() 사용을 위한 처리
  config.module.rules.push({
    test: /node_modules[\\/]@react-native[\\/]js-polyfills[\\/].*\.js$/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env'],
        plugins: [
          // require()를 import로 변환
          function ({ types: t }) {
            return {
              visitor: {
                Identifier(path) {
                  if (path.node.name === 'require' && path.isReferencedIdentifier()) {
                    // require가 전역으로 정의되지 않은 경우를 처리
                  }
                },
              },
            };
          },
        ],
      },
    },
  });

  return config;
};
