export default {
	loading: false,
	pageTransition: {
		name: "page",
		mode: "out-in",
	},
	css: [
		"~/assets/base.sass",
		"~/assets/transitions.sass",
		"~/assets/proprietary.sass",
	],
	target: "static",
	srcDir: "src/",
	plugins: [
		"~/plugins/extend.client.ts",
		"~/plugins/modal.client.js",
		"~/plugins/filters.ts",
		"~/plugins/wallets.client.ts",
		"~/plugins/polkadot.client.ts",
	],
	buildModules: [
		"@nuxtjs/style-resources",
		"@nuxt/typescript-build",
		"@nuxtjs/svg",
	],
	styleResources: {
		sass: [
			"~/assets/vars.sass",
			"~/assets/mixins.sass",
			"~/assets/brand.sass",
		],
	},
	build: {
		babel: {
			cacheDirectory: false,
			configFile: true,
		},
		standalone: true,
		transpile: [
			"@polkadot/extension-dapp",
			"@polkadot/api",
			"@polkadot/apps-config",
		],
		extractCSS: true,
		extend(config, ctx) {
			if (ctx.isDev) {
				config.devtool = ctx.isClient ? "source-map" : "inline-source-map"
			}
			else {
				const ruleString = "/\\.(png|jpe?g|gif|svg|webp|avif)$/i"

				if (!config.module.rules
					.filter(rule => rule.test.toString() === ruleString)
					.length) {
					throw new Error("failed to find webpack images rule")
				}

				config.module.rules.forEach(rule => {
					if (rule.test.toString() === ruleString) {
						rule.use = [
							{
								loader: "url-loader",
								options: {
									esModule: false,
									limit: 1000,
									name: "img/[name]_[hash:7].[ext]",
								},
							},
							{
								loader: "image-webpack-loader",
								options: {
									esModule: false,
									mozjpeg: {
										progressive: true,
										quality: 50,
									},
									pngquant: {
										quality: [0.5, 0.5],
										speed: 1,
										verbose: true,
									},
								},
							},
						]
						delete rule.loader
						delete rule.options
					}
				})
			}
		},
	},
	head: {
		htmlAttrs: {
			lang: "en",
			class: "tnode-ui-html",
		},
		bodyAttrs: {
			class: "tnode-ui",
		},
		titleTemplate: "%s | Trusted Node",
		meta: [
			{ charset: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
			{ hid: "description", name: "description", content: "description content for SEO" },
		],
		link: [
			{ rel: "icon", type: "image/x-icon", href: "/favicon.png" },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{ rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
			{ href: "https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap", rel: "stylesheet" },
		],
	},
	publicRuntimeConfig: {
		backendUrl: process.env.BACKEND_URL || "http://localhost:8080/api",
	},
	vue: {
		config: {
			productionTip: false,
			devtools: true,
		},
	},
}
