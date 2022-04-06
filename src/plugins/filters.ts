import Vue from "vue"
import bn, { BigSource } from "big.js"
import cn from "comma-number"
import { format } from "date-fns"
import { preventSciNotation, toLink } from "~/_utils"

export const floorToDP = (value: BigSource, dp: number): bn => {
	preventSciNotation(value)
	return bn(value).round(dp, bn.roundDown)
}

export const floorToDPDisplay = (value: BigSource | null, dp: number): string => {
	return value !== null
		? cn(floorToDP(value, dp).toString())
		: "--"
}

Vue.filter(
	"floorToDP",
	floorToDPDisplay,
)
Vue.filter(
	"floorToDPorE",
	(value: BigSource | null, dp: number) =>
		value !== null
			? floorToDPDisplay(
				value,
				bn(
					Math.min( // if exponent is smaller than dp, use exponent
						bn(value).e,
						bn(dp).times(-1).toNumber(),
					),
				).times(-1).toNumber(),
			)
			: null,
)
Vue.filter(
	"toLocaleString",
	(value: number | string | null) => value !== null
		? value.toLocaleString()
		: "--",
)

// adapted from https://github.com/mvasilkov/human-readable
function hn(value: BigSource, dp: number): string {
	const units = "KMB".split("")
	const threshold = 1e3
	// TODO: account for negative value

	value = bn(value).abs()
	let index = 0
	while (value.gte(threshold) && ++index < units.length) {
		value = value.div(threshold)
	}
	return [
		floorToDPDisplay(value.toString(), dp),
		index !== 0
			? units[index - 1]
			: "",
	].join("")
}

Vue.filter(
	"humanNumber",
	(value: number | string | null, dp: number = 0) => value !== null
		? hn(value, dp)
		: "--",
)

Vue.filter(
	"accountAddress",
	(address: string) => [
		address.substring(0, 6),
		address.substring(address.length - 6),
	].join("..."),
)

Vue.filter(
	"toLink",
	toLink,
)

Vue.filter(
	"formatDate",
	date => format(new Date(date), "d.M.yyyy"),
)
