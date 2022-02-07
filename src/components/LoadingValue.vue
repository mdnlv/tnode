<template lang="pug">
	#loading-value.center
		template(v-if="loading !== null ? loading : value === null")
			img(src="~/assets/gif/loading-3.gif", :class="`loading-${size}`")
		template(v-else)
			slot(v-bind="{ value }")
				span {{ value }}
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({
	props: {
		value: {
			type: [String, Number, Object, Array] as Vue.PropType<string | number | object | any[]>,
			default: null,
		},
		loading: {
			type: Boolean as Vue.PropType<boolean>,
			default: null,
		},
		size: {
			type: String as Vue.PropType<string>,
			default: "small",
		},
	},
})
</script>

<style lang="sass" scoped>

#loading-value
	display: inline

</style>
