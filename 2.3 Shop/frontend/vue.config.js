const { defineConfig } = require('@vue/cli-service');
const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin');

module.exports = defineConfig({
  transpileDependencies: ['vuetify'],
  configureWebpack: {
    plugins: [new VuetifyLoaderPlugin()],
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
