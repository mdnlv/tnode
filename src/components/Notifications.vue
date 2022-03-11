<template lang="pug">
.notifications(:class="{ open: show }")
	header.cursor-pointer(@click="toggle()")
		.bell.flex.cursor-pointer
			img(:src="bellIcon")
			span.small.center(v-if="newNotificationCount") {{ newNotificationCount }}
		h3 Notifications
		.close.cursor-pointer.center(v-html="arrowIcon")
	.notification-list.space-items-medium
		.notification.space-items(v-for="(notification, index) of notifications")
			.header
				.title.flex-space-between
					h5 {{ notification.title }}
					img.cursor-pointer(@click="markAsRead(notification.id)", :src="closeIcon")
				p.small.light-text {{ notification.start_at | formatDate }}
			.description.space-items
				p {{ notification.description }}
			.right
				a(:href="notification.href" v-if="notification.href" target="_blank")
					button.small-padding {{ notification.link }}
			hr(v-if="index !== notifications.length - 1")
		.no-notifications(v-if="!notifications.length")
			.center.space-items
				p.light-text No unread notifications to show...
				p.cursor-pointer.color-fg(@click="markAllUnviewed") See read notifications

</template>

<script lang="ts">
import Vue from "vue"
import sleep from "await-sleep"
import { Notification } from "~/_types"

export default Vue.extend({
	data() {
		return {
			show: false,
			deleteIcon: require("../assets/svg/notifications/delete.svg"),
			bellIcon: require("../assets/svg/notifications/bell.svg"),
			closeIcon: require("../assets/svg/notifications/close.svg"),
			arrowIcon: require("~/assets/svg/ui/arrow-right.svg?raw"),
		}
	},
	computed: {
		newNotificationCount(): number {
			return this.$store.getters["notifications/newNotificationCount"]
		},
		notifications(): Notification[] {
			return 	this.$store.getters["notifications/notifications"]
		},
	},
	async mounted() {
		await this.$store.dispatch("notifications/getViewedNotifications")
		await this.$store.dispatch("notifications/getReadNotifications")
		await this.$store.dispatch("notifications/getNotifications")
	},
	methods: {
		markAsRead(notificationId) {
			this.$store.dispatch("notifications/markAsRead", notificationId)
		},
		toggle(show?: boolean) {
			this.show = show ?? !this.show
			if (this.show) {
				this.markReadIfOpen()
			}
		},
		markAllUnviewed() {
			this.$store.dispatch("notifications/markAllUnviewed")
			this.markReadIfOpen()
		},
		async markReadIfOpen() {
			await sleep(1000 * this.notifications.length)
			if (!this.show) {
				return
			}
			this.$store.dispatch("notifications/markAsViewed")
		},
	},
})
</script>

<style lang="sass" scoped>

	.notifications
		position: fixed
		top: 0
		background: $bg
		height: 100vh
		z-index: $z-index-tooltips
		width: $unit20
		right: 0
		@include transition(transform)
		&:not(.open)
			transform: translateX(100%)
		header
			border-bottom: 1px solid $grey
			position: relative
			.bell,
			h3,
			img.close
				padding: $unit-1 $unit2
			.bell
				@include hover-opacity
				position: absolute
				top: 0
				right: 100%
				height: 100%
				@include transition(all)
				background: $fg3
				border-top-left-radius: 40px
				border-bottom-left-radius: 40px
				padding-right: $unit2
				img
					height: 100%
					max-width: unset
				span
					background: $fg
					color: $white
					width: $unit3
					height: $unit3
					border-radius: 50%
					position: absolute
					transform: scale(0.75) translate(50%, -50%)
			h3
				@media (max-width: $breakpoint-mobile)
					text-align: center
			.close
				@include hover-opacity
				position: absolute
				top: 50%
				right: $unit1
				transform: translateY(-50%)
				/deep/
					svg
						path
							color: $fg
		@media (max-width: $breakpoint-mobile)
			width: 100vw
			&.open
				header
					.bell
						transform: translateX(100%)
						border-top-left-radius: 0
						border-bottom-left-radius: 0
		.notification-list
			height: 100vh
			overflow-y: auto
			padding: $unit1 $unit2
			h5
				color: $fg3
			hr
				border-bottom: 1px solid $grey
		// @media (min-width: $breakpoint-mobile)
		// 	header
		// 		.bell
		// 			float: left
		// 			right: 80px
		// 			position: relative
		.no-notifications
			@include big-vert-padding
	.right
		a
			margin-right: $unit-4

</style>
