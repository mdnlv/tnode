import { initializeApp } from "firebase/app"
import { getAnalytics, logEvent } from "firebase/analytics"
import { Plugin } from "@nuxt/types"

const firebaseConfig = {
	apiKey: "AIzaSyBNBCOFsze1BE7btVajmHaOaDoRyCtWTSw",
	authDomain: "hydrogen-x.firebaseapp.com",
	projectId: "hydrogen-x",
	storageBucket: "hydrogen-x.appspot.com",
	messagingSenderId: "950506092851",
	appId: "1:950506092851:web:4eabb21c7cda2fbfa2e646",
	measurementId: "G-4X25S2E4RY",
}

const firebaseApp = initializeApp(firebaseConfig)
const analytics = getAnalytics(firebaseApp)

declare module "vue/types/vue" {
	interface Vue {
		$analytics: any
	}
}

declare module "@nuxt/types" {
	interface NuxtAppOptions {
		$analytics: any
	}
	interface Context {
		$analytics: any
	}
}

const plugin: Plugin = (_context, inject) => {
	inject("analytics", (eventName: string, params: any) => logEvent(analytics, eventName, params))
}

export default plugin
