import type { GetterTree, ActionTree, MutationTree } from "vuex"
import { RootState } from "~/store"

const defaultState = {
	isActive: false,
}

export const state = () => defaultState

export type LocalState = ReturnType<typeof state>;

export const getters: GetterTree<LocalState, RootState> = {
	isActive: state => {
		return state.isActive
	},
}

export const mutations: MutationTree<LocalState> = {
	toggle(state) {
		state.isActive = !state.isActive
	},
}

export const actions: ActionTree<LocalState, RootState> = {}
