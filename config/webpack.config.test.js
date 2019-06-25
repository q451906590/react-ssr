const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// 清除文件
const CleanWebpackPlugin = require('clean-webpack-plugin');
module.exports = {
  // entry: [
  //   'react-hot-loader/patch', //添加
  //   "./src/index.js",
  // ],
  entry: {
    app: "./src/index.tsx"
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        options: {
          presets: ["@babel/env"],
          plugins: ["react-hot-loader/babel"] //增加
        }
      },
      {
        test: /\.tsx?$/,
        use: ['babel-loader', 'ts-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {},
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'isomorphic-style-loader',
          // {
          //   loader: MiniCssExtractPlugin.loader,
          //   options: {
          //     hmr: process.env.NODE_ENV === 'development',
          //   },
          // },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]_[local]-[hash:base64:5]',
              camelCase: 'dashes'
            }
          },
        ]
      }
    ]
  },
  resolve: { extensions: ["*", ".js", ".jsx", ".ts", ".tsx"] },
  output: {
    path: path.resolve(__dirname, "dist/"),
    // 然而“publicPath”项则被许多Webpack的插件用于内嵌到css、html文件里的url值。
    publicPath: "/dist/",
    filename: "bundle.js"
  },
  // 暴露webpack构建出的结果，由于构建出的结果交给DevServer，所以你在使用DevServer时在本地找不到构建出的文件。
  devServer: {
    // 服务器根目录
    contentBase: path.join(__dirname, "./src"),
    port: 3000,
    //会把打包后的资源输入到服务器根目录 + publicPath
    publicPath: "/dist",
    inline: true,
    hot: true,
  },
  plugins: [
    // new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      template: './views/index.html',
      filename: 'index.html',
      cache: true
    }),
    new CopyPlugin([
      {
        from: path.join(process.cwd(), './src/assets'),
        to: path.join(process.cwd(), './dist/assets/'),
        toType: 'dir'
      },
    ]),
    // 提取css
    // new MiniCssExtractPlugin({
    //   // Options similar to the same options in webpackOptions.output
    //   // both options are optional
    //   filename: '[name].css',
    //   chunkFilename: '[id].css',
    // })
  ]
};