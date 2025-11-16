const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { composePlugins, withNx } = require('@nx/webpack');
const path = require('path');

module.exports = composePlugins(
  withNx({
    target: 'web',
  }),
  (config) => {
    // Add resolve configuration for workspace libraries
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@ikea-compare/scrapers'] = path.resolve(__dirname, '../../libs/scrapers/src/index.ts');
    config.resolve.alias['@ikea-compare/types'] = path.resolve(__dirname, '../../libs/types/src/index.ts');

    const plugins = ['popup', 'options'].map(
      (s) =>
        new HtmlWebpackPlugin({
          template: `./src/${s}.html`,
          filename: `${s}.html`,
          chunks: [s],
        })
    );
    plugins.push(new MiniCssExtractPlugin());

    config.module.rules.push({
      test: /\.(sa|sc|c)ss$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        {
          loader: 'sass-loader',
          options: { api: 'modern' },
        },
      ],
    });

    // No environment variables needed - extension uses Chrome Storage API only

    config.plugins.push(...plugins);
    return config;
  }
);
