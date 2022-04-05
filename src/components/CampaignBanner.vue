<template lang="pug">
#campaign-banner
	#header.flex-wrap
	#contents.grow.space-items
		h3 Tiger Node Staking Campaign Complete!
		p The staking period for our&nbsp;
			a.link(target="_blank" href="https://trustednode.medium.com/1-million-tnode-airdrop-alert-f44310d7818") Tiger Node campaign
			|&nbsp;has ended, eligible users are now able to claim their TNODE rewards!
		nuxt-link.button(to="/tiger-node") Claim Rewards!
</template>

<style lang="sass" scoped>

#campaign-banner
	@media (min-width: $breakpoint-mobile-upper)
		display: table-row
		> *
			display: table-cell
			vertical-align: top
	#header
		@include background-image('../assets/img/tiger-node.png')
		padding: $space
		padding-left: $space-medium
		@media (max-width: $breakpoint-mobile)
			min-height: $unit15
		@include rounded-big
		@media (min-width: $breakpoint-mobile-upper)
			border-top-right-radius: 0
			border-bottom-right-radius: 0
		@media (max-width: $breakpoint-mobile)
			border-bottom-left-radius: 0
			border-bottom-right-radius: 0
			display: flex
			justify-content: space-between
			align-items: center
	#contents
		background: $bg
		padding: $space
		padding-right: $space-medium
		/deep/
			.info-icon
				transform: scale(0.7) translateY(-1px)
		@include rounded-big
		@media (min-width: $breakpoint-mobile-upper)
			border-top-left-radius: 0
			border-bottom-left-radius: 0
			width: 99%
		@media (max-width: $breakpoint-mobile)
			border-top-left-radius: 0
			border-top-right-radius: 0
</style>
