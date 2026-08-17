import { EffectType } from "./EffectModel";

export interface TroopInstance {
	readonly uid: string;
	readonly definitionId: string;
	readonly plotId: string;
	readonly ownerId: string;
	part: BasePart;
	health: number;
	maxHealth: number;
	damage: number;
	range: number;
	cooldown: number;
	lastFireTime: number;
	upgradeLevel: number;
	effects: ReadonlyArray<EffectType>;
	isStunned: boolean;
	stunExpiry: number;
	isActive: boolean;
	targetId: string | undefined;
}
