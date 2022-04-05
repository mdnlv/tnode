import type { GetterTree, ActionTree, MutationTree } from "vuex"

import axios from "axios"
import { RootState } from "~/store"
import { Notification } from "~/_types"

const defaultState = {
	notifications: [] as Notification[],
	readNotifications: [] as number[],
	viewedNotifications: [] as number[],
	loaded: false,
}

export const state = () => defaultState
export type LocalState = ReturnType<typeof state>

export const getters: GetterTree<LocalState, RootState> = {
	notifications: state => {
		return state.notifications.filter(({ id }) => !state.readNotifications.includes(id))
	},
	newNotificationCount: (state, _getters, _rootState) => {
		return state.notifications
			.filter(notification => !state.viewedNotifications.includes(notification.id))
			.length
	},
	readNotifications: state => state.readNotifications,
}

export const mutations: MutationTree<LocalState> = {
	notifications: (state, notifications) => {
		state.notifications = notifications
	},
	readNotifications: (state, readNotifications) => {
		state.readNotifications = readNotifications
	},
	viewedNotifications: (state, viewedNotifications) => {
		state.viewedNotifications = viewedNotifications
	},
}

export const actions: ActionTree<LocalState, RootState> = {
	async getNotifications({ commit }) {
		try {
			const notifications = await axios.get(`${this.app.$config.backendUrl}/notifications`)
				.then(res => { return res.data })
			commit("notifications", notifications)
		}
		catch (e: any) {
			if (e.message !== "Network Error") {
				// eslint-disable-next-line no-console
				console.error(e)
			}
		}
	},
	getViewedNotifications({ commit }) {
		commit("viewedNotifications", JSON.parse(localStorage.getItem("viewedNotifications") || "[]"))
	},
	getReadNotifications({ commit }) {
		commit("readNotifications", JSON.parse(localStorage.getItem("readNotifications") || "[]"))
	},
	markAsRead({ getters, commit, dispatch }, notificationId) {
		const updatedReadNotifications: number[] = [...getters.readNotifications, notificationId]
		commit("readNotifications", updatedReadNotifications)
		localStorage.setItem("readNotifications", JSON.stringify(updatedReadNotifications))
		dispatch("markAsViewed", notificationId)
	},
	markAsViewed({ state, commit }, notificationId?: string) {
		const viewedNotifications = notificationId
			? [...state.viewedNotifications, notificationId]
			: state.notifications.map(n => n.id)
		commit("viewedNotifications", viewedNotifications)
		localStorage.setItem("viewedNotifications", JSON.stringify(viewedNotifications))
	},
	markAllUnviewed({ commit }) {
		commit("readNotifications", [])
		commit("viewedNotifications", [])
		localStorage.removeItem("readNotifications")
		localStorage.removeItem("viewedNotifications")
	},
}
