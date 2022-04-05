<template lang="pug">
  VTooltip
    slot(v-for="(_, name) in slotsFiltered", :name="name", :slot="name")
    template(#tooltip)
      .inner
        slot(name="tooltip")
</template>

<script lang="ts">
import Vue from "vue"
import { omit } from "lodash"
import { VTooltip } from "vuetensils/src/components"

export default Vue.extend({
	components: {	VTooltip },
	computed: {
		slotsFiltered() {
			return omit(this.$slots, "tooltip")
		},
	},
})
</script>

<style lang="sass" scoped>
/deep/
  .vts-tooltip
    background: $bg

  .vts-tooltip__content
    width: 400px
    top: -15px

  .vts-tooltip__content[aria-hidden='false']:after
    content: ""
    position: absolute
    bottom: 0
    width: 16px
    height: 16px
    background-color: $bg-1
    left: 50%
    transform: translate(15%, 50%) rotate(45deg)

  .vts-tooltip__content[aria-hidden='false']
    display: block
    .inner > *
      background: $bg-1
      padding: $space
      border-radius: $unit1
    .inner > p > a
      @include hover-opacity
      color: $fg3
</style>
