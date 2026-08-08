/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');
const SitemapPlugin = require('sitemap-webpack-plugin').default;
const PrerendererWebpackPlugin = require('@prerenderer/webpack-plugin');
const PuppeteerRenderer = require('@prerenderer/renderer-puppeteer');
const { VuetifyPlugin } = require('webpack-plugin-vuetify');
const { routesSeo } = require('./src/router/seo');

const defaultLanguage = 'zh-CN';
const siteURL = (process.env.SITE_URL || 'http://localhost').replace(/\/+$/, '');

const multiLangRoutes = Object.values(routesSeo).reduce((acc, route) => {
  if (!route.meta.multiLanguage) {
    acc.push(route);
    return acc;
  }

  Object.keys(route.meta.multiLanguage).forEach((language) => {
    acc.push({
      ...route,
      path: language === defaultLanguage ? route.path : `/${language}${route.path}`.toLowerCase(),
    });
  });

  return acc;
}, []);

const paths = multiLangRoutes.filter((route) => !route.meta.skipSiteMap);

module.exports = defineConfig({
  transpileDependencies: true,
  css: {
    loaderOptions: {
      sass: {
        additionalData: `
          @import "@/helpers/scss/main.scss";
        `,
      },
    },
  },
  configureWebpack: () => {
    if (process.env.NODE_ENV !== 'production') {
      return {
        plugins: [
          new webpack.DefinePlugin({
            APP_VERSION: "'DEV'",
          }),
          new VuetifyPlugin(),
        ],
      };
    }

    return {
      plugins: [
        new webpack.DefinePlugin({
          APP_VERSION: JSON.stringify(require('./package.json').version),
        }),
        new VuetifyPlugin(),
        new SitemapPlugin({
          base: `${siteURL}/`,
          paths,
          options: {
            filename: 'sitemap.xml',
            skipgzip: true,
            lastmod: true,
            changefreq: 'weekly',
            priority: 0.8,
          },
        }),
        new PrerendererWebpackPlugin({
          routes: multiLangRoutes.filter((route) => route.meta.prerender).map((route) => route.path),
          renderer: new PuppeteerRenderer({
            timeout: 100000,
          }),
        }),
      ],
    };
  },
});
