/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

'use strict';

const path = require('path');
const merge = require('merge-options');
const { IgnorePlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const optionalPlugins = [];
if (process.platform !== "darwin") {
	optionalPlugins.push(new IgnorePlugin({ resourceRegExp: /^fsevents$/ }));
}

module.exports = function withDefaults(/**@type WebpackConfig*/extConfig) {

	/** @type WebpackConfig */
	let defaultConfig = {
		mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
		target: 'node', // extensions run in a node context
		node: {
			__dirname: false, // leave the __dirname-behaviour intact
		},
		resolve: {
			mainFields: ['module', 'main'],
			extensions: ['.ts', '.js'], // support ts-files and js-files
		},
		module: {
			rules: [{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [{
					// configure TypeScript loader:
					// * enable sources maps for end-to-end source maps
					loader: 'ts-loader',
					options: {
						compilerOptions: {
							"sourceMap": true,
							"module": "es6"
						},
						projectReferences: true
					}
				}]
			}]
		},
		externals: {
			'vscode': 'commonjs vscode', // ignored because it doesn't exist
			'bufferutil': 'bufferutil',
			'utf-8-validate': 'utf-8-validate',
			'emitter': 'emitter'
		},
		output: {
			// all output goes into `dist`.
			// packaging depends on that and this must always be like it
			filename: '[name].js',
			path: path.join(extConfig.context, 'out'),
			libraryTarget: "commonjs",
		},
		ignoreWarnings: [
			{
				module: /^.*typescript\.js$/
			}
		],
		plugins: [
			...optionalPlugins,
		],
		optimization: {
			minimizer: [new TerserPlugin({
				extractComments: false,
			})],
		},
		devtool: false
	};

	return merge(defaultConfig, extConfig);
};
