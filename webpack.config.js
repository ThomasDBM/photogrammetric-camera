const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        "photogrammetric-camera": [path.resolve(__dirname, 'src/main.js')]
    },
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: '[name].js',
        library: 'PhotogrammetricCamera',
        libraryTarget: 'umd',
        publicPath: path.resolve(__dirname, "dist"),
    },
    module: {
        rules: [
            {
                test: /\.glsl$/,
                loader: 'webpack-glsl-loader'
            }
        ]
    },
  devServer: {
    publicPath: '/photogrammetric-camera/dist/',
    contentBase: path.join(__dirname, '..')
  },
   plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "node_modules/three/build/three.min.js",
          to: "three.min.js"
        },
      ],
    }),
  ],
  externals: {
    three: 'THREE',
  }
};
