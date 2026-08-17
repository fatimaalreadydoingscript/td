export type EffectType = "burn" | "slow" | "toxic";

export interface BurnEffect {
	readonly type: "burn";
	readonly dps: number;
	readonly duration: number;
	startTime: number;
	lastTick: number;
}

export interface SlowEffect {
	readonly type: "slow";
	readonly multiplier: number;
	readonly duration: number;
	startTime: number;
}

export interface ToxicEffect {
	readonly type: "toxic";
	readonly dpsPerStack: number;
	readonly duration: number;
	startTime: number;
	lastTick: number;
	stacks: number;
}

export type ActiveEffect = BurnEffect | SlowEffect | ToxicEffect;

export interface EffectState {
	burn?: BurnEffect;
	slow?: SlowEffect;
	toxic?: ToxicEffect;
}
