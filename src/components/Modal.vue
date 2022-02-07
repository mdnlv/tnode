<template lang="pug">
	VueModal(
		:adaptive="true"
		:name="name"
		:height="height"
		:width="width"
	)
		.center.loading-big-outer(v-if="loading")
			img.loading-big(src="~/assets/gif/loading-5.gif")
		#contents(v-else)
			#header.flex-space-between
				h2 {{ title }}
				#close-button.cursor-pointer(@click="_close" v-html="crossIcon")
			#slot
				slot
</template>

<script lang="ts">
import Vue from "vue"

export default Vue.extend({
	props: {
		name: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		height: {
			type: [Number, String] as Vue.PropType<number | string>,
			default: 600,
		},
		width: {
			type: Number as Vue.PropType<number>,
			default: 600,
		},
		loading: {
			type: Boolean as Vue.PropType<boolean>,
			default: false,
		},
		title: {
			type: String as Vue.PropType<string>,
			required: true,
		},
		onClose: {
			type: Function as Vue.PropType<Function>,
			default: null,
		},
	},
	data() {
		return {
			crossIcon: require("~/assets/svg/ui/cross.svg?raw"),
		}
	},
	methods: {
		_close() {
			if (this.onClose) {
				this.onClose()
			}
			this.$modal.hide(this.name)
		},
	},
})
</script>

<style lang="sass" scoped>

/deep/ #contents
	height: 100%
	display: flex
	flex-direction: column
	#header
		padding-bottom: $unit8
		#close-button
			@include hover-scale-opacity
	#slot
		flex-grow: 1
		height: 100%

</style>
