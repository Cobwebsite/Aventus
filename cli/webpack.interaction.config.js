/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

'use strict';

const { IgnorePlugin } = require('webpack');
const withDefaults = require('../shared.webpack.config');
const path = require('path');

const optionalPlugins = [];
if (process.platform !== "darwin") {
	optionalPlugins.push(new IgnorePlugin({ resourceRegExp: /^fsevents$/ }));
}

module.exports = withDefaults({
	context: path.join(__dirname),
	entry: {
		extension: './src/interaction/RealInteraction.ts',
	},
	output: {
		filename: 'RealInteraction.js',
		path: path.join(__dirname, 'out'),
	},
	resolve: {

	},
	plugins: optionalPlugins,
});
