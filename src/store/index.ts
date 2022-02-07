import type { GetterTree, MutationTree, ActionTree } from "vuex"

const defaultState = {
	refreshInterval: 1000 * 60,
	loaded: false,
	lsKey: "trusted-node",
}

export const state = () => defaultState

export type RootState = ReturnType<typeof state>

export const getters: GetterTree<RootState, RootState> = {
	refreshInterval: state => state.refreshInterval,
	loaded: state => state.loaded,
	lsKey: state => state.lsKey,
}

export const mutations: MutationTree<RootState> = {
	loaded: (state, loaded) => { state.loaded = loaded },
}

export const actions: ActionTree<RootState, RootState> = {
}
