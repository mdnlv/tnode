module.exports = {
	presets: [
		[
			"@nuxt/babel-preset-app",
			{
				corejs: { version: "3.14.0" },
				bugfixes: true,
			},
		],
	],
	plugins: [
		"@babel/plugin-proposal-optional-chaining",
		["@babel/plugin-proposal-private-property-in-object", { loose: true }],
	],
}
