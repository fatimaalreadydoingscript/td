import { EffectType } from "./EffectModel";

export interface TowerInstance {
	readonly uid: string;
	readonly definitionId: string;
	readonly plotId: string;
	readonly ownerId: string;
	part: BasePart;
	damage: number;
	range: number;
	cooldown: number;
	lastFireTime: number;
	effects: ReadonlyArray<EffectType>;
	isActive: boolean;
}
