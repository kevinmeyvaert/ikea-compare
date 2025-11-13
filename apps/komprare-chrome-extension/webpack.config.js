const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { composePlugins, withNx } = require('@nx/webpack');
const webpack = require('webpack');
const path = require('path');

// Load .env.local from the komprare-web app directory
require('dotenv').config({
  path: path.join(__dirname, '../komprare-web/.env.local'),
});

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
    config.resolve.alias['@ikea-compare/firebase/extension'] = path.resolve(__dirname, '../../libs/firebase/src/extension.ts');
    config.resolve.alias['@ikea-compare/firebase'] = path.resolve(__dirname, '../../libs/firebase/src/index.ts');

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

    // Add DefinePlugin to inject Firebase environment variables
    // Need to define both NEXT_PUBLIC_ and non-prefixed versions because:
    // - firebase-extension.ts uses non-prefixed versions
    // - Shared library (@ikea-compare/firebase) uses NEXT_PUBLIC_ prefixed versions
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.FIREBASE_API_KEY': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        ),
        'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
        ),
        'process.env.FIREBASE_PROJECT_ID': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        ),
        'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        ),
        'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
        ),
        'process.env.FIREBASE_APP_ID': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        ),
        'process.env.FIREBASE_MEASUREMENT_ID': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
        ),
        'process.env.NEXT_PUBLIC_FIREBASE_API_KEY': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        ),
        'process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
        ),
        'process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        ),
        'process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        ),
        'process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
        ),
        'process.env.NEXT_PUBLIC_FIREBASE_APP_ID': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        ),
        'process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID': JSON.stringify(
          process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
        ),
      })
    );

    config.plugins.push(...plugins);
    return config;
  }
);
