import { EffectState } from "./EffectModel";

export type EnemyState = "alive" | "dead" | "pooled";

export interface EnemyInstance {
	readonly uid: string;
	readonly definitionId: string;
	readonly plotId: string;
	part: BasePart;
	health: number;
	maxHealth: number;
	speed: number;
	baseSpeed: number;
	damage: number;
	attackCooldown: number;
	lastAttackTime: number;
	moneyReward: number;
	expReward: number;
	isBoss: boolean;
	state: EnemyState;
	effects: EffectState;
	isStunned: boolean;
	stunExpiry: number;
	targetId: string | undefined;
	spawnTime: number;
	hoverY: number;
}
