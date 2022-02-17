import bn, { BigSource } from "big.js"

export function times10toPow(value: BigSource, power: number): bn
export function times10toPow(value: BigSource, power: number, asNormalNotationString: true): string
export function times10toPow(value: null, power: number, asNormalNotationString?: boolean): null
export function times10toPow(value: BigSource | null, power: number, asNormalNotationString?: boolean): bn | null | string {
	return value === null
		? null
		: asNormalNotationString
			? toStringNormalNotation(
				bn(value)
					.times(10 ** power),
			)
			: bn(value)
				.times(10 ** power)
}

export function divBy10toPow(value: BigSource, power: number): bn
export function divBy10toPow(value: BigSource, power: number, asNormalNotationString: true): string
export function divBy10toPow(value: null, power: number, asNormalNotationString?: boolean): null
export function divBy10toPow(value: BigSource | null, power: number, asNormalNotationString?: boolean): bn | null | string {
	return value === null
		? null
		: asNormalNotationString
			? toStringNormalNotation(
				bn(value)
					.div(10 ** power),
			)
			: bn(value)
				.div(10 ** power)
}

export function max(...values: BigSource[]): bn {
	return values.length
		? bn(
			values.reduce(
				(prev, curr) =>
					bn(prev).gte(curr)
						? prev
						: curr,
				values[0],
			),
		)
		: bn(0)
}

export function toStringNormalNotation(value: BigSource): string {
	preventSciNotation(value)
	return bn(value).toString()
}

export function preventSciNotation(value: BigSource) {
	bn.NE = Math.min(
		bn.NE,
		bn(value).e * -1 - 1, // prevent sci notation
	)
	bn.PE = Math.max(
		bn.PE,
		bn(value).e + 1, // prevent sci notation
	)
}

export function toLink(addressOrHash: string, linkTemplate: string) {
	return linkTemplate.replace("###", addressOrHash)
}
