export interface Weighted {
	readonly weight: number;
}

export namespace WeightedRandom {
	export function pick<T extends Weighted>(items: ReadonlyArray<T>): T | undefined {
		if (items.size() === 0) return undefined;

		let total = 0;
		for (const item of items) {
			total += item.weight;
		}

		let roll = math.random() * total;
		for (const item of items) {
			roll -= item.weight;
			if (roll <= 0) return item;
		}

		return items[items.size() - 1];
	}

	export function pickFiltered<T extends Weighted>(
		items: ReadonlyArray<T>,
		predicate: (item: T) => boolean,
	): T | undefined {
		const filtered = items.filter(predicate);
		return pick(filtered);
	}
}
