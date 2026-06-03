module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@theme': './src/theme',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@types': './src/types',
          '@assets': './src/assets',
          '@store': './src/store',
          '@navigation': './src/navigation',
        },
      },
    ],
    'react-native-worklets-core/plugin',
    'react-native-reanimated/plugin', // MUST BE LAST
  ],
};
